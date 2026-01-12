import { Injectable, Logger } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Notification, NotificationType } from './entities/notification.entity';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
  private logger = new Logger(NotificationsService.name);
  private expo = new Expo();

  constructor(
    private readonly notificationsGateway: NotificationsGateway,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) { }

  /**
   * Sends a ride update via WebSocket FIRST, then attempts Push Notification.
   * This is critical to ensure the UI updates even if Push fails (e.g. invalid dev token).
   */
  async sendRideUpdate(rideId: string, status: string, ride: any) {
    // 1. WebSocket Update (Critical for Real-time UI)
    try {
      this.logger.log(`[Socket] Emitting ride update for ${rideId}: ${status}`);
      this.notificationsGateway.sendRideUpdate(rideId, status, ride);
    } catch (wsError) {
      this.logger.error(`[Socket] Failed to emit update: ${wsError.message}`);
    }

    // 2. Push Notification (Best Effort)
    this.handlePushNotification(rideId, status, ride).catch(err => {
      this.logger.error(`[Push] Error in background push process: ${err.message}`);
    });
  }

  private async handlePushNotification(rideId: string, status: string, ride: any) {
    let targetUserId: string | null = null;
    let title = '';
    let body = '';

    // Determine target and message based on status
    if (status === 'PENDING') {
      // Typically we notify drivers here, but for now we focus on User-side updates
      // If this is a ride request, we might not have a single target user yet except the requester?
      return;
    }

    if (status === 'ACCEPTED') {
      targetUserId = ride.rider_id; // Notify Rider
      title = 'Driver Found! 🚗';
      body = `Your ride has been accepted. Driver is on the way.`;
    } else if (status === 'ARRIVED') {
      targetUserId = ride.rider_id;
      title = 'Driver Arrived 📍';
      body = 'Your driver has arrived at the pickup location.';
    } else if (status === 'IN_PROGRESS' || status === 'ride_started') {
      targetUserId = ride.rider_id;
      title = 'Ride Started 🚕';
      body = 'Your ride has started. Have a safe journey!';
    } else if (status === 'COMPLETED') {
      targetUserId = ride.rider_id;
      title = 'Ride Completed ✅';
      body = `You have arrived. Total fare: ₹${ride.estimated_fare || ride.fare}`;
    } else if (status === 'CANCELLED') {
      targetUserId = ride.rider_id; // Or driver, depends who cancelled. Assuming Rider needs to know.
      title = 'Ride Cancelled ❌';
      body = 'Your ride has been cancelled.';
    }

    if (!targetUserId) return;

    const user = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!user || !user.pushToken) {
      this.logger.warn(`[Push] User ${targetUserId} has no push token.`);
      return;
    }

    if (!Expo.isExpoPushToken(user.pushToken)) {
      this.logger.warn(`[Push] Invalid Expo push token for user ${targetUserId}: ${user.pushToken}`);
      return;
    }

    const message: ExpoPushMessage = {
      to: user.pushToken,
      sound: 'default',
      title,
      body,
      data: { rideId, status, ride },
    };

    try {
      const tickets = await this.expo.sendPushNotificationsAsync([message]);
      this.logger.log(`[Push] Notification sent to ${targetUserId}. Tickets: ${JSON.stringify(tickets)}`);

      // Check for errors in tickets (like DeviceNotRegistered)
      for (const ticket of tickets) {
        if (ticket.status === 'error') {
          this.logger.error(`[Push] Delivery error: ${ticket.message} (${ticket.details?.error})`);
          // Optional: If DeviceNotRegistered, remove the token from DB
          if (ticket.details?.error === 'DeviceNotRegistered') {
            await this.removeInvalidToken(targetUserId);
          }
        }
      }
    } catch (error) {
      this.logger.error(`[Push] Failed to send notification: ${error}`);
    }
  }

  async getUserNotifications(userId: string) {
    return this.notificationRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Send ride notification to a specific driver
   */
  async sendRideNotificationToDriver(driver: any, ride: any): Promise<void> {
    if (!driver.user?.pushToken) {
      this.logger.warn(`Driver ${driver.user_id} does not have a push token`);
      return;
    }

    if (!Expo.isExpoPushToken(driver.user.pushToken)) {
      this.logger.warn(`Invalid push token for driver ${driver.user_id}`);
      return;
    }

    const message: ExpoPushMessage = {
      to: driver.user.pushToken,
      sound: 'default' as const,
      title: 'New Ride Request! 🚗',
      body: `Pickup: ${ride.pickupLocation} • Fare: ₹${ride.fare}`,
      data: {
        type: 'ride_request',
        rideId: ride.id,
        pickupLocation: ride.pickupLocation,
        pickupLatitude: ride.pickupLatitude,
        pickupLongitude: ride.pickupLongitude,
        dropoffLocation: ride.dropoffLocation,
        dropoffLatitude: ride.dropoffLatitude,
        dropoffLongitude: ride.dropoffLongitude,
        fare: ride.fare,
        distance: ride.distance,
        duration: ride.duration,
      },
      priority: 'high' as const,
    };

    try {
      const tickets = await this.expo.sendPushNotificationsAsync([message]);
      this.logger.log(`Sent ride notification to driver ${driver.user_id}: ${JSON.stringify(tickets)}`);

      // WebSocket broadcast for the ride
      this.notificationsGateway.sendRideUpdate(ride.id, 'ride_request', message.data);

      await this.saveNotification(driver.user, ride, message, NotificationType.RIDE_REQUEST);
    } catch (error) {
      this.logger.error(`Error sending notification to driver ${driver.user_id}: ${error.message}`);
    }
  }

  /**
   * Notify user that their ride has been accepted by a driver
   */
  async notifyUserRideAccepted(userId: string, ride: any, driver: any): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user?.pushToken || !Expo.isExpoPushToken(user.pushToken)) {
      this.logger.warn(`User ${userId} missing/invalid push token for acceptance notification.`);
      return;
    }

    const driverName = `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 'Your driver';

    const message: ExpoPushMessage = {
      to: user.pushToken,
      sound: 'default' as const,
      title: 'Driver Found! 🎉',
      body: `${driverName} is on the way. ${driver.vehicleModel || 'Vehicle'} - ${driver.vehiclePlateNumber || ''}`,
      data: {
        type: 'ride_accepted',
        rideId: ride.id,
        driverId: driver.user_id,
        driverName: driverName,
        vehicleModel: driver.vehicleModel,
        vehicleColor: driver.vehicleColor,
        vehiclePlateNumber: driver.vehiclePlateNumber,
        driverRating: driver.driverRating,
      },
      priority: 'high' as const,
    };

    try {
      await this.expo.sendPushNotificationsAsync([message]);
      this.notificationsGateway.sendRideUpdate(ride.id, 'ride_accepted', message.data);
      await this.saveNotification(user, ride, message, NotificationType.RIDE_UPDATE);
    } catch (error) {
      this.logger.error(`Error sending accepted notification to user ${userId}: ${error.message}`);
    }
  }

  async notifyUserRideStarted(userId: string, ride: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user?.pushToken || !Expo.isExpoPushToken(user.pushToken)) return;

    const message: ExpoPushMessage = {
      to: user.pushToken,
      sound: 'default' as const,
      title: 'Ride Started! 🚕',
      body: 'Your ride has started. Have a safe journey!',
      data: { type: 'ride_started', rideId: ride.id },
    };

    try {
      await this.expo.sendPushNotificationsAsync([message]);
      this.notificationsGateway.sendRideUpdate(ride.id, 'ride_started', message.data);
      await this.saveNotification(user, ride, message, NotificationType.RIDE_UPDATE);
    } catch (error) {
      this.logger.error(`Error sending ride started notification: ${error.message}`);
    }
  }

  async notifyUserRideCompleted(userId: string, ride: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user?.pushToken || !Expo.isExpoPushToken(user.pushToken)) return;

    const message: ExpoPushMessage = {
      to: user.pushToken,
      sound: 'default' as const,
      title: 'Ride Completed! ✅',
      body: `You have arrived at your destination. Total fare: ₹${ride.finalFare || ride.fare}`,
      data: { type: 'ride_completed', rideId: ride.id, fare: ride.finalFare },
    };

    try {
      await this.expo.sendPushNotificationsAsync([message]);
      this.notificationsGateway.sendRideUpdate(ride.id, 'ride_completed', message.data);
      await this.saveNotification(user, ride, message, NotificationType.RIDE_UPDATE);
    } catch (error) {
      this.logger.error(`Error sending ride completed notification: ${error.message}`);
    }
  }

  private async saveNotification(user: User, ride: any, message: any, type: NotificationType) {
    const notification = this.notificationRepository.create({
      user,
      rideId: ride.id,
      type,
      title: message.title,
      message: message.body,
      data: message.data,
    });
    await this.notificationRepository.save(notification);
  }

  private async removeInvalidToken(userId: string) {
    try {
      await this.userRepository.update(userId, { pushToken: null as any });
      this.logger.log(`[Push] Removed invalid token for user ${userId}`);
    } catch (err) {
      this.logger.error(`[Push] Failed to remove invalid token: ${err.message}`);
    }
  }
}
