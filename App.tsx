import React, { useEffect, useRef } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { LoadingProvider, useLoading } from './src/hooks/LoadingContext';
import LoadingScreen from './src/screens/LoadingScreen';
import { RideRequestProvider, useRideRequest } from './src/context/RideRequestContext';
import { SoundProvider, useSound } from './src/context/SoundContext';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { logger, consoleTransport } from 'react-native-logs';
import api from './src/config/api';

const config = {
  severity: 'debug',
  transport: consoleTransport,
  transportOptions: {},
};

const log = logger.createLogger(config);


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    log.warn('Push notification permission not granted');
    return;
  }

  try {
    token = (await Notifications.getExpoPushTokenAsync()).data;
    log.info("Expo Push Token:", token);

    // Send the token to the backend
    try {
      await api.post('/profile/update-push-token', { token: token });
      log.info("Push token sent to backend successfully.");
    } catch (error) {
      log.error("Error sending push token to backend:", error);
    }
  } catch (error: any) {
    log.error("Error getting push token:", error.message);
  }

  return token;
}


const AppContent = () => {
  const { isLoading, hideLoading } = useLoading();
  const { setRideRequest } = useRideRequest();
  const { playAlert, stopAlert } = useSound();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);


  useEffect(() => {
    registerForPushNotificationsAsync();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      const notificationData = notification.request.content.data as any;
      if (notificationData && notificationData.type === 'ride_request') {
        // Play looping alert sound for new ride requests
        playAlert('RIDE_REQUEST');

        setRideRequest({
          rideId: notificationData.rideId as string,
          pickupLocation: notificationData.pickupLocation as string,
          pickupLatitude: notificationData.pickupLatitude as number,
          pickupLongitude: notificationData.pickupLongitude as number,
          dropoffLocation: notificationData.dropoffLocation as string,
          dropoffLatitude: notificationData.dropoffLatitude as number,
          dropoffLongitude: notificationData.dropoffLongitude as number,
          fare: Number(notificationData.fare),
          distance: notificationData.distance as number,
          duration: notificationData.duration as number,
        });
      }
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
      // Stop sound when user taps the notification
      stopAlert();
    });

    return () => {
      notificationListener.current && notificationListener.current.remove();
      responseListener.current && responseListener.current.remove();
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      hideLoading();
    }, 2000);
  }, []);

  return isLoading ? <LoadingScreen /> : <AppNavigator />;
}

export default function App() {
  return (
    <LoadingProvider>
      <SoundProvider>
        <RideRequestProvider>
          <AppContent />
        </RideRequestProvider>
      </SoundProvider>
    </LoadingProvider>
  );
}
