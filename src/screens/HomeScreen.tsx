import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Dimensions, Animated, FlatList, Button, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from 'react-native-paper';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRideRequest } from '../context/RideRequestContext';
import { useSound } from '../context/SoundContext';
import RideRequestCard from '../components/RideRequestCard';
import api from '../config/api';
import React, { useEffect, useRef, useState } from 'react';

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Helper function to register for push notifications
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
    Alert.alert('Permission Required', 'Push notification permissions are required to receive ride requests.');
    return;
  }

  try {
    // For development builds, we can get the token without projectId
    // For production, you'll need to configure EAS and provide projectId
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    if (projectId && projectId !== 'your-eas-project-id-here') {
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } else {
      // Fallback for development - get token without projectId
      // This will work for Expo Go and development builds
      token = (await Notifications.getExpoPushTokenAsync()).data;
    }

    console.log('Expo Push Token:', token);
  } catch (error: any) {
    // Suppress Firebase-related errors - they're misleading
    // Expo push notifications work fine without Firebase in development
    if (error.message?.includes('FirebaseApp') || error.message?.includes('fcm-credentials')) {
      console.log('📱 Push notifications are configured for Expo (development mode)');
      console.log('ℹ️  For production, configure EAS project ID in app.json');
      // Return a development token placeholder
      token = 'ExponentPushToken[development-mode]';
    } else {
      console.error('Error getting push token:', error);
      console.log('Push notifications may not work properly. Error:', error.message);
    }
    // Don't throw - allow app to continue without push notifications
  }

  return token;
}

// Helper function to send push token to backend
async function sendPushTokenToBackend(token: string) {
  try {
    await api.put('/profile/push-token', { token });
    console.log('Push token sent to backend successfully');
  } catch (error) {
    console.error('Error sending push token to backend:', error);
  }
}

const HomeScreen = ({ navigation }: { navigation: any }) => {
  const [isDrawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width * 0.9)).current;
  const [timeLeft, setTimeLeft] = useState('00:00:00');
  const [isOnline, setIsOnline] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const glowAnim = useRef(new Animated.Value(10)).current;
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const { rideRequest, setRideRequest } = useRideRequest();
  const { playAlert } = useSound();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  const classyGreen = '#ff0000fd';
  const classyRed = '#28a745';

  const [zones, setZones] = useState<string[]>([]);
  const [loadingZones, setLoadingZones] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();

    // Fetch initial status
    const fetchStatus = async () => {
      try {
        const response = await api.get('/profile');
        if (response.data?.profile) {
          setIsOnline(response.data.profile.isOnline);
        }
      } catch (error) {
        console.error('Error fetching driver status:', error);
      }
    };
    fetchStatus();

    // Fetch High Booking Zones
    const fetchZones = async () => {
      try {
        const response = await api.get('/rides/high-booking-zones');
        // If we get data, use it; otherwise fallback to default empty list will show empty state
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setZones(response.data);
        } else {
          // Fallback to empty to show "No high demand zones currently" message
          setZones([]);
        }
      } catch (error) {
        console.error('Error fetching high booking zones:', error);
        // On error, keep empty
        setZones([]);
      } finally {
        setLoadingZones(false);
      }
    };
    fetchZones();

    // Register for push notifications
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        // Send token to backend
        sendPushTokenToBackend(token);
      }
    });
  }, []);

  // Setup push notification listeners
  useEffect(() => {
    // Listener for notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      const data = notification.request.content.data as any;
      if (data.type === 'ride_request') {
        // Update ride request context
        setRideRequest({
          rideId: data.rideId as string,
          pickupLocation: data.pickupLocation as string,
          pickupLatitude: data.pickupLatitude as number,
          pickupLongitude: data.pickupLongitude as number,
          dropoffLocation: data.dropoffLocation as string,
          dropoffLatitude: data.dropoffLatitude as number,
          dropoffLongitude: data.dropoffLongitude as number,
          fare: data.fare as number,
          distance: data.distance as number,
          duration: data.duration as number,
        });
      }
    });

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      const data = response.notification.request.content.data as any;
      if (data.type === 'ride_request') {
        // Navigate to Rides screen
        navigation.navigate('Rides');
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  let text = 'Waiting..';
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }

  useEffect(() => {
    const getSubscription = async () => {
      try {
        const expiryString = await AsyncStorage.getItem('subscriptionExpiry');
        if (expiryString) {
          const expiry = new Date(expiryString);
          const now = new Date();
          const diff = expiry.getTime() - now.getTime();

          if (diff > 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          }
        }
      } catch (e) {
        console.error('Failed to load subscription.', e);
      }
    };

    getSubscription();

    const interval = setInterval(() => {
      getSubscription();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const glowAnimation = () => {
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 15,
          duration: 1000,
          useNativeDriver: false, // shadowRadius is not supported by native driver
        }),
        Animated.timing(glowAnim, {
          toValue: 10,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]).start(() => glowAnimation()); // Loop the animation
    };

    glowAnimation();
  }, []);

  const slideIn = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const slideOut = () => {
    Animated.timing(slideAnim, {
      toValue: -Dimensions.get('window').width * 0.75,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setDrawerVisible(false));
  };

  const toggleDrawer = () => {
    if (isDrawerVisible) {
      slideOut();
    } else {
      setDrawerVisible(true);
    }
  };

  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (isDrawerVisible) {
      slideIn();
      fetchNotifications();
    }
  }, [isDrawerVisible]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // This effect will run to periodically update the driver's location while online
  useEffect(() => {
    const updateLocation = async () => {
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      if (currentLocation) {
        const payload = {
          online: true, // Always true when this interval is running
          location: {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          },
        };
        try {
          await api.put('/profile/driver/status', payload);
        } catch (error) {
          console.error("Failed to periodically update location:", error);
        }
      }
    };

    if (isOnline) {
      // Update location immediately when going online
      updateLocation();

      // Then update location every 20 seconds
      const intervalId = setInterval(updateLocation, 20000);

      // Cleanup function to clear the interval when the component unmounts or driver goes offline
      return () => clearInterval(intervalId);
    }
  }, [isOnline]);

  const toggleOnlineStatus = async () => {
    if (isUpdatingStatus) return; // Prevent multiple clicks

    const newStatus = !isOnline;

    // If going offline, just update the status without needing a location.
    if (!newStatus) {
      setIsUpdatingStatus(true);
      try {
        await api.put('/profile/driver/status', { online: false });
        setIsOnline(newStatus);
      } catch (error) {
        console.error("Failed to go offline:", error);
        Alert.alert("Update Failed", "Could not go offline. Please try again.");
      } finally {
        setIsUpdatingStatus(false);
      }
      return;
    }

    // If going online, check for location first.
    if (!location) {
      Alert.alert("Location not available", "Could not get your current location. Please ensure location services are enabled.");
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const payload = {
        online: newStatus,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      };
      await api.put('/profile/driver/status', payload);

      // Also update push token when going online
      if (expoPushToken) {
        await sendPushTokenToBackend(expoPushToken);
      }

      setIsOnline(newStatus); // Update state only after successful API call
      playAlert('ONLINE_POP');
    } catch (error) {
      console.error("Failed to update online status:", error);
      Alert.alert("Update Failed", "Could not update your online status. Please check your connection and try again.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer}>
          <Image source={require('../assets/burger-bar.png')} style={{ width: 24, height: 24, tintColor: '#ffff' }} />
        </TouchableOpacity>
        <Image source={require('../assets/Dashboard.png')} style={styles.headerImage} />
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {errorMsg ? (
          <View>
            <Text style={styles.errorText}>{errorMsg}</Text>
            <Button title="Grant Permission" onPress={() => (async () => {
              let { status } = await Location.requestForegroundPermissionsAsync();
              if (status === 'granted') {
                setErrorMsg(null);
                let location = await Location.getCurrentPositionAsync({});
                setLocation(location);
              }
            })()} />
          </View>
        ) : null}
        <Card style={[styles.rideStatusCard, styles.highlightCard]}>
          <Card.Content>
            <Text style={styles.timer}>{timeLeft}</Text>
            <Text style={styles.statusText}>
              {timeLeft === 'Expired' ? 'Subscription Expired' : timeLeft === 'No Subscription' ? 'No Active Subscription' : 'Subscription Remaining'}
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.statsSection}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statValue}><Image source={require('../assets/rupee.png')} style={{ width: 18, height: 18, tintColor: '#1E293B' }} />1,500</Text>
              <Text style={styles.statLabel}>Today’s Earnings</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statValue}>18</Text>
              <Text style={styles.statLabel}>Total Rides</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statValue}>4.8 <Image source={require('../assets/star.png')} style={{ width: 16, height: 16, tintColor: '#FFD700' }} /></Text>
              <Text style={styles.statLabel}>Rating</Text>
            </Card.Content>
          </Card>
        </View>

        <Animated.View style={{
          shadowRadius: glowAnim,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowColor: isOnline ? classyRed : classyGreen,
          elevation: 10, // For Android
        }}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: isOnline ? classyGreen : classyRed }]}
            onPress={toggleOnlineStatus}
            disabled={isUpdatingStatus}
          >
            <Text style={styles.primaryButtonText}>{isUpdatingStatus ? 'UPDATING...' : (isOnline ? 'GO OFFLINE' : 'GO ONLINE')}</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('MyRides')}>
            <Image source={require('../assets/bike.png')} style={{ width: 24, height: 24, tintColor: '#fe7009' }} />
            <Text style={styles.quickActionLabel}>My Rides</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('Wallet')}>
            <Image source={require('../assets/wallet-filled-money-tool.png')} style={{ width: 24, height: 24, tintColor: '#fe7009' }} />
            <Text style={styles.quickActionLabel}>Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('Support')}>
            <Image source={require('../assets/customer-service.png')} style={{ width: 24, height: 24, tintColor: '#fe7009' }} />
            <Text style={styles.quickActionLabel}>Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('Subscriptions')}>
            <Image source={require('../assets/upi-icon.png')} style={{ width: 50, height: 24, tintColor: '#fe7009' }} />
            <Text style={styles.quickActionLabel}>Subscriptions</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionTitle}>High Booking Zones</Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={{ flex: 1 }}>
        <Modal
          animationType="fade"
          transparent={true}
          visible={isDrawerVisible}
          onRequestClose={toggleDrawer}
        >
          <TouchableOpacity style={styles.drawerOverlay} onPress={toggleDrawer} activeOpacity={1}>
            <Animated.View style={[styles.drawerContainer, { transform: [{ translateX: slideAnim }] }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Notifications</Text>
                <TouchableOpacity onPress={toggleDrawer}>
                  <Text style={styles.closeButton}>X</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.drawerContent} contentContainerStyle={styles.drawerScrollContent}>
                {/* Default Welcome Notification */}
                <Card style={styles.notificationCard}>
                  <Card.Content>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle}>Welcome to Ride Andhra!</Text>
                      <Text style={styles.notificationTime}>Now</Text>
                    </View>
                    <Text style={styles.notificationText}>
                      Enjoy ZERO commissions on your rides! We are excited to have you on board. Drive more, earn more!
                    </Text>
                  </Card.Content>
                </Card>

                {/* Fetched Notifications */}
                {notifications.map((notification, index) => (
                  <Card key={index} style={styles.notificationCard}>
                    <Card.Content>
                      <View style={styles.notificationHeader}>
                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                        <Text style={styles.notificationTime}>
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={styles.notificationText}>{notification.message}</Text>
                    </Card.Content>
                  </Card>
                ))}
              </ScrollView>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
        <FlatList
          data={zones}
          keyExtractor={(item, index) => `${item}-${index}`}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={() => (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: 'gray' }}>No high booking zones identified yet.</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.zoneItem}>
              <Text style={styles.zoneText}>{item}</Text>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          style={styles.zoneList}
        />
        {rideRequest && <RideRequestCard />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fe7009',
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawerContainer: {
    width: Dimensions.get('window').width * 0.9,
    height: '100%',
    backgroundColor: '#fff',

  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  drawerContent: {
    padding: 20,
    flex: 1,
  },
  drawerScrollContent: {
    paddingBottom: 20,
  },
  notificationCard: {
    marginBottom: 15,
    elevation: 2,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    marginTop: 5,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a202c',
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: 'gray',
    marginLeft: 10,
  },
  notificationText: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fe7009',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  headerImage: {
    width: 180, // Adjust as needed
    height: 40,  // Adjust as needed
    resizeMode: 'contain',
  },
  content: {
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  rideStatusCard: {
    marginTop: -40,
    borderRadius: 12,
    elevation: 15, // Increased
    shadowColor: 'rgba(0, 0, 0, 0.2)', // Increased opacity
    shadowOffset: { width: 0, height: 8 }, // Increased offset
    shadowOpacity: 0.9, // Increased
    borderColor: 'black',
    borderWidth: 0.03,

    shadowRadius: 12, // Increased
  },
  highlightCard: {
    backgroundColor: 'white', // A light orange background
  },
  timer: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1E293B',
  },
  statusText: {
    fontSize: 16,
    color: 'gray',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    marginHorizontal: 5,
    elevation: 12, // Increased
    backgroundColor: '#fff',
    shadowColor: 'rgba(0, 0, 0, 0.2)', // Increased opacity
    shadowOffset: { width: 0, height: 4 }, // Increased offset
    shadowOpacity: 0.9, // Increased
    shadowRadius: 8, // Increased
    borderColor: 'black',
    borderWidth: 0.01,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: 'gray',

    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#fe7009',
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 20,
    alignItems: 'center',
    elevation: 8, // Increased
    borderColor: 'black',
    borderWidth: 0.2,

    shadowColor: 'rgba(0, 0, 0, 0.3)', // Increased opacity
    shadowOffset: { width: 0, height: 6 }, // Increased offset
    shadowOpacity: 0.4, // Increased
    shadowRadius: 10, // Increased
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  quickActionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '48%',
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 6, // Increased
    shadowColor: 'rgba(0, 0, 0, 0.2)', // Increased opacity
    shadowOffset: { width: 0, height: 4 }, // Increased offset
    shadowOpacity: 0.3, // Increased
    shadowRadius: 8, // Increased
  },
  quickActionLabel: {
    marginTop: 10,
    fontWeight: '600',
    color: '#1E293B',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,

    color: '#1E293B',
  },
  zoneList: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 6, // Increased
    shadowColor: 'rgba(0, 0, 0, 0.2)', // Increased opacity
    shadowOffset: { width: 0, height: 4 }, // Increased offset
    shadowOpacity: 0.3, // Increased
    shadowRadius: 8, // Increased
  },
  zoneItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  zoneText: {
    fontSize: 16,
    color: '#1E293B',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 15,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default HomeScreen;
