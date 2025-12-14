import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import RidesScreen from '../screens/RidesScreen';
import EarningsScreen from '../screens/EarningsScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoadingScreen from '../screens/LoadingScreen';
import DriverRegistrationScreen from '../screens/DriverRegistrationScreen';
import PersonalInfoScreen from '../screens/PersonalInfoScreen';
import SelectVehicleScreen from '../screens/SelectVehicleScreen';
import DrivingLicenseScreen from '../screens/DrivingLicenseScreen';
import VehicleInfoScreen from '../screens/VehicleInfoScreen';
import AadhaarPanScreen from '../screens/AadhaarPanScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';
import { DriverRegistrationProvider } from '../context/DriverRegistrationContext';
import SubscriptionsScreen from '../screens/SubscriptionsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import MyRidesScreen from '../screens/MyRidesScreen';
import WalletScreen from '../screens/WalletScreen';
import SupportScreen from '../screens/SupportScreen';
import ReferralScreen from '../screens/ReferralScreen';
import WithdrawScreen from '../screens/WithdrawScreen';
import VerificationPendingScreen from '../screens/VerificationPendingScreen';
import ContactUsScreen from '../screens/ContactUsScreen';
import HelpScreen from '../screens/HelpScreen';
import PaymentScreen from '../screens/PaymentScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const RegistrationStack = createNativeStackNavigator();

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// ...

const HomeTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Earnings') {
            iconName = focused ? 'cash' : 'cash';
          } else if (route.name === 'Rides') {
            iconName = focused ? 'motorbike' : 'motorbike'; // Using bicycle as proxy for rides/scooter
          } else if (route.name === 'Profile') {
            iconName = focused ? 'face-man-profile' : 'face-man-profile';
          }

          return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#fe7009',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Rides" component={RidesScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Earnings" component={EarningsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
};

const DriverRegistrationStack = () => {
  return (
    <DriverRegistrationProvider>
      <RegistrationStack.Navigator>
        <RegistrationStack.Screen name="DriverRegistration" component={DriverRegistrationScreen} options={{ title: 'Become a Rider' }} />
        <RegistrationStack.Screen name="PersonalInfo" component={PersonalInfoScreen} options={{ title: 'Personal Information' }} />
        <RegistrationStack.Screen name="SelectVehicle" component={SelectVehicleScreen} options={{ title: 'Select Vehicle' }} />
        <RegistrationStack.Screen name="DrivingLicense" component={DrivingLicenseScreen} options={{ title: 'Driving License' }} />
        <RegistrationStack.Screen name="VehicleInfo" component={VehicleInfoScreen} options={{ title: 'Vehicle Information' }} />
        <RegistrationStack.Screen name="AadhaarPan" component={AadhaarPanScreen} options={{ title: 'Aadhaar & PAN Card' }} />

      </RegistrationStack.Navigator>
    </DriverRegistrationProvider>
  );
}

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [hasDriverRole, setHasDriverRole] = useState(false);
  const [isApprovedDriver, setIsApprovedDriver] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');

        if (token) {
          // Token exists - now verify user has driver role
          try {
            const response = await api.get('/profile');
            const userData = response.data;

            console.log('User Profile:', userData);

            // NEW LOGIC: Check if user is_verified AND has a driver record
            const isVerified = userData.is_verified === true;
            const hasDriverRecord = userData.driver_id !== null && userData.driver_id !== undefined;
            const hasDriverRole = userData.roles && userData.roles.includes('driver');

            setUser(userData);
            setHasDriverRole(hasDriverRole);

            // User can access home if: is_verified=true AND driver_id exists
            const canAccessHome = isVerified && hasDriverRecord && hasDriverRole;
            setIsApprovedDriver(canAccessHome);
            setIsAuthenticated(canAccessHome);

            console.log('Auth Check:', {
              isVerified,
              hasDriverRecord,
              hasDriverRole,
              driverStatus: userData.driver_status,
              canAccessHome
            });
          } catch (profileError) {
            console.error('Error fetching profile:', profileError);
            // If profile fetch fails, clear token and show login
            await AsyncStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
            setHasDriverRole(false);
            setIsApprovedDriver(false);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setHasDriverRole(false);
          setIsApprovedDriver(false);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
        setUser(null);
        setHasDriverRole(false);
        setIsApprovedDriver(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Set up an interval to periodically check auth status
    // This helps detect when user logs out or role changes
    const interval = setInterval(async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token && isAuthenticated) {
        // Token removed - log out
        setIsAuthenticated(false);
        setUser(null);
        setHasDriverRole(false);
        setIsApprovedDriver(false);
      } else if (token && !isAuthenticated) {
        // Token added (login) - verify auth
        console.log('Token detected, verifying auth...');
        checkAuth();
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'Main' : 'Login'}
        screenOptions={{ headerShown: false }}
      >
        {!isAuthenticated ? (
          // Auth Stack - Show when NOT authenticated (no token or not approved driver)
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} options={{ headerShown: false }} />
            <Stack.Screen name="DriverRegistrationStack" component={DriverRegistrationStack} options={{ headerShown: false }} />
            <Stack.Screen name="VerificationPending" component={VerificationPendingScreen} options={{ headerShown: false }} />
          </>
        ) : (
          // Main App Stack - Only show when authenticated as APPROVED DRIVER
          <>
            <Stack.Screen name="Main" component={HomeTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={{ title: 'Terms of Service' }} />
            <Stack.Screen name="MyRides" component={MyRidesScreen} options={{ title: 'My Rides' }} />
            <Stack.Screen name="Wallet" component={WalletScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Support" component={SupportScreen} options={{ title: 'Support' }} />
            <Stack.Screen name="Referral" component={ReferralScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Withdraw" component={WithdrawScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ContactUs" component={ContactUsScreen} options={{ title: 'Contact Us' }} />
            <Stack.Screen name="Help" component={HelpScreen} options={{ title: 'Help' }} />
            <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;