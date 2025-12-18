import { Injectable, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '../auth/entities/user.entity';
import { Driver } from '../profile/entities/driver.entity';
import { Ride } from '../rides/entities/ride.entity';
import Expo from 'expo-server-sdk';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { RidesService } from '../rides/rides.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private expo: Expo;
  private notificationClient: any;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectConnection() private readonly connection: Connection,
    private readonly notificationsGateway: NotificationsGateway,
  ) {
    this.expo = new Expo();
  }

  // Inject RidesService later to avoid circular dependency
  private ridesService: RidesService;

  setRidesService(ridesService: RidesService) {
    this.ridesService = ridesService;
  }

  async onModuleInit() {
    await this.listenForNotifications();
  }

  async onModuleDestroy() {
    if (this.notificationClient) {
      await this.notificationClient.release();
    }
  }

  private async listenForNotifications() {
    // Get a dedicated client from the TypeORM's underlying connection pool
    const driver = this.connection.driver as any;
    this.notificationClient = await driver.master.connect();

    await this.notificationClient.query('LISTEN new_ride_broadcast');

    this.notificationClient.on('notification', async (msg) => {
      console.log('Received notification:', msg.payload);
      if (msg.channel === 'new_ride_broadcast') {
        const rideId = msg.payload;
        // Notify the first available driver
        try {
          if (this.ridesService) {
            await this.ridesService.notifyNextDriver(rideId);
          } else {
            console.error('RidesService not initialized yet');
          }
        } catch (error) {
          console.error('Error handling new ride notification:', error);
        }
      }
    });
  }

  async sendRideRequestNotifications(rideId: string) {
    const notifications = await this.notificationRepository.find({
      where: { ride: { id: rideId } },
      relations: ['user'],
    });

    const messages = [];
    for (const notification of notifications) {
      if (notification.user.pushToken && Expo.isExpoPushToken(notification.user.pushToken)) {
        messages.push({
          to: notification.user.pushToken,
          sound: 'default',
          title: notification.title,
          body: notification.message,
          data: notification.data,
        });
      }
    }

    if (messages.length > 0) {
      const chunks = this.expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        try {
          const tickets = await this.expo.sendPushNotificationsAsync(chunk);
          console.log('Push notification tickets:', tickets);
        } catch (error) {
          console.error('Error sending push notification:', error);
        }
      }
    }
  }

  /**
   * Send ride notification to a specific driver
   */
  async sendRideNotificationToDriver(driver: Driver, ride: Ride): Promise<void> {
    if (!driver.user?.pushToken) {
      console.log(`Driver ${driver.user_id} does not have a push token`);
      return;
    }

    if (!Expo.isExpoPushToken(driver.user.pushToken)) {
      console.log(`Invalid push token for driver ${driver.user_id}`);
      return;
    }

    const message = {
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
      console.log(`Sent ride notification to driver ${driver.user_id}:`, tickets);

      // WebSocket broadcast for the ride
      this.notificationsGateway.sendRideUpdate(ride.id, 'ride_request', message.data);

      // Create notification record in database
      const notification = this.notificationRepository.create({
        user: driver.user,
        ride: ride,
        type: NotificationType.RIDE_REQUEST,
        title: message.title,
        message: message.body,
        data: message.data,
      });
      await this.notificationRepository.save(notification);
    } catch (error) {
      console.error(`Error sending notification to driver ${driver.user_id}:`, error);
    }
  }

  /**
   * Notify user that their ride has been accepted by a driver
   */
  async notifyUserRideAccepted(userId: string, ride: Ride, driver: Driver): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user?.pushToken) {
      console.log(`User ${userId} does not have a push token`);
      return;
    }

    if (!Expo.isExpoPushToken(user.pushToken)) {
      console.log(`Invalid push token for user ${userId}`);
      return;
    }

    const driverName = `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 'Your driver';

    const message = {
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
      const tickets = await this.expo.sendPushNotificationsAsync([message]);
      console.log(`Sent ride accepted notification to user ${userId}:`, tickets);

      // WebSocket broadcast
      this.notificationsGateway.sendRideUpdate(ride.id, 'ride_accepted', message.data);

      // Create notification record in database
      const notification = this.notificationRepository.create({
        user: user,
        ride: ride,
        type: NotificationType.RIDE_UPDATE,
        title: message.title,
        message: message.body,
        data: message.data,
      });
      await this.notificationRepository.save(notification);
    } catch (error) {
      console.error(`Error sending notification to user ${userId}:`, error);
    }
  }

  async getUserNotifications(userId: string) {
    return this.notificationRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async notifyUserRideStarted(userId: string, ride: Ride) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user?.pushToken || !Expo.isExpoPushToken(user.pushToken)) return;

    const message = {
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
      console.error(`Error sending ride started notification:`, error);
    }
  }

  async notifyUserRideCompleted(userId: string, ride: Ride) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user?.pushToken || !Expo.isExpoPushToken(user.pushToken)) return;

    const message = {
      to: user.pushToken,
      sound: 'default' as const,
      title: 'Ride Completed! ✅',
      body: `You define arrived at your destination. Total fare: ₹${ride.finalFare || ride.fare}`,
      data: { type: 'ride_completed', rideId: ride.id, fare: ride.finalFare },
    };

    try {
      await this.expo.sendPushNotificationsAsync([message]);
      this.notificationsGateway.sendRideUpdate(ride.id, 'ride_completed', message.data);
      await this.saveNotification(user, ride, message, NotificationType.RIDE_UPDATE);
    } catch (error) {
      console.error(`Error sending ride completed notification:`, error);
    }
  }

  private async saveNotification(user: User, ride: Ride, message: any, type: NotificationType) {
    const notification = this.notificationRepository.create({
      user,
      ride,
      type,
      title: message.title,
      message: message.body,
      data: message.data,
    });
    await this.notificationRepository.save(notification);
  }
}
