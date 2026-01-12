import { Injectable, Logger } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
  private logger = new Logger(NotificationsService.name);
  private expo = new Expo();

  constructor(
    private readonly notificationsGateway: NotificationsGateway,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  private async removeInvalidToken(userId: string) {
    try {
      await this.userRepository.update(userId, { pushToken: null as any });
      this.logger.log(`[Push] Removed invalid token for user ${userId}`);
    } catch (err) {
      this.logger.error(`[Push] Failed to remove invalid token: ${err.message}`);
    }
  }
}
