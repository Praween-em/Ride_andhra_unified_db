import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
  Keyboard,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import LockIcon from '../components/LockIcon';
import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OTPWidget } from '@msg91comm/sendotp-react-native';
import { verifyMsg91AccessToken } from '../utils/msg91'; // Import the new utility function

const { height } = Dimensions.get('window');

type RootStackParamList = {
  OtpVerification: { phoneNumber: string; reqId?: string };
  Main: undefined;
  DriverRegistrationStack: { screen: string; params: { phoneNumber: string } };
  VerificationPending: { phoneNumber: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'OtpVerification'>;

const OtpVerificationScreen = ({ route, navigation }: Props) => {
  const { phoneNumber, reqId: initialReqId } = route.params;
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [reqId, setReqId] = useState(initialReqId || '');
  const imageContainerHeight = useRef(new Animated.Value(height * 0.45)).current;
  const cardHeight = useRef(new Animated.Value(height * 0.55)).current;

  const handleResendOtp = async () => {
    try {
      const data = {
        identifier: '91' + phoneNumber // Assuming '91' is the country code
      };
      const response = await OTPWidget.sendOTP(data);
      console.log('MSG91 Send OTP response:', response);
      if (response.type === 'success') {
        const newReqId = response.res?.reqId || response.message;
        if (newReqId) {
          setReqId(newReqId);
          setErrorMessage(''); // Clear any previous error messages
        } else {
          setErrorMessage('Request ID not found in the response.');
        }
      } else {
        setErrorMessage(response.message || 'Failed to send OTP.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setErrorMessage('Error sending OTP. Please try again.');
    }
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        Animated.parallel([
          Animated.timing(imageContainerHeight, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(cardHeight, {
            toValue: height,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start();
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        Animated.parallel([
          Animated.timing(imageContainerHeight, {
            toValue: height * 0.45,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(cardHeight, {
            toValue: height * 0.55,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start();
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [imageContainerHeight, cardHeight]);

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setErrorMessage('Please enter a 6-digit OTP.');
      return;
    }

    // BYPASS FOR GOOGLE PLAY VERIFICATION
    if (phoneNumber.endsWith('9999999999') && otp === '123456') {
      try {
        const response = await api.post('/auth/login-by-phone', {
          phoneNumber: '9999999999',
        });

        // Save token for ALL users (required for authenticated API calls)
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('phoneNumber', phoneNumber);

        if (response.data.user_exists) {
          const { user } = response.data;

          const hasDriverRole = user.roles && user.roles.includes('driver');
          const isVerified = user.is_verified === true;
          const hasDriverRecord = user.driver_id !== null && user.driver_id !== undefined;

          if (hasDriverRole && isVerified && hasDriverRecord) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            });
          } else {
            navigation.navigate('DriverRegistrationStack', {
              screen: 'DriverRegistration',
              params: { phoneNumber }
            });
          }
        } else {
          navigation.navigate('DriverRegistrationStack', {
            screen: 'DriverRegistration',
            params: { phoneNumber }
          });
        }
      } catch (error) {
        console.error('Test login error:', error);
        setErrorMessage('Test login failed.');
      }
      return;
    }
    if (!reqId) {
      setErrorMessage('OTP not sent. Please resend OTP.');
      return;
    }

    try {
      const otpVerifyResponse = await OTPWidget.verifyOTP({ reqId, otp });
      console.log('MSG91 Verify OTP response:', otpVerifyResponse);
      const accessToken = otpVerifyResponse.access_token || otpVerifyResponse.message;

      if (otpVerifyResponse.type === 'success' && accessToken) {
        // Step 1: Verify Access Token directly with MSG91 using the utility function
        const msg91Data = await verifyMsg91AccessToken(accessToken);

        if (msg91Data.type === 'success') {
          // Step 2: MSG91 verification successful, now call our backend to log in/register
          const verifiedPhoneNumber = msg91Data.message.slice(-10);
          console.log('Verified Phone Number from MSG91:', verifiedPhoneNumber);

          const response = await api.post('/auth/login-by-phone', {
            phoneNumber: verifiedPhoneNumber,
          });

          // Save token for ALL users (required for authenticated API calls)
          await AsyncStorage.setItem('token', response.data.token);
          await AsyncStorage.setItem('phoneNumber', phoneNumber);

          if (response.data.user_exists) {
            const { user } = response.data;

            console.log('DEBUG: User details received:', JSON.stringify(user, null, 2));

            // NEW LOGIC: Check if user is verified AND has driver record
            const hasDriverRole = user.roles && user.roles.includes('driver');
            const isVerified = user.is_verified === true;
            const hasDriverRecord = user.driver_id !== null && user.driver_id !== undefined;

            console.log('DEBUG: Navigation checks:', {
              hasDriverRole,
              isVerified,
              hasDriverRecord,
              roles: user.roles,
              driver_id: user.driver_id,
              is_verified_value: user.is_verified
            });

            if (hasDriverRole && isVerified && hasDriverRecord) {
              console.log('DEBUG: Conditions met, navigating to Main');
              // Verified driver with driver record - go to main app
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            } else {
              console.log('DEBUG: Conditions NOT met, navigating to DriverRegistration');
              // User exists but not verified or no driver record - go to registration
              navigation.navigate('DriverRegistrationStack', {
                screen: 'DriverRegistration',
                params: { phoneNumber }
              });
            }
          } else {
            console.log('DEBUG: User does not exist, navigating to DriverRegistration');
            // New user - go to registration
            navigation.navigate('DriverRegistrationStack', {
              screen: 'DriverRegistration',
              params: { phoneNumber }
            });
          }
        } else {
          setErrorMessage(msg91Data.message || 'MSG91 direct verification failed.');
        }
      } else {
        setErrorMessage(otpVerifyResponse.message || 'OTP verification failed.');
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Animated.View style={[styles.imageContainer, { height: imageContainerHeight }]}>
          <Image
            source={require('../assets/Otp_verification.png')}
            style={styles.image}
            resizeMode="stretch"
          />
        </Animated.View>
        <Animated.View style={[styles.card, { height: cardHeight }]}>
          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>We've sent an OTP to your phone number</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <LockIcon size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
                placeholderTextColor="#aaa"
                maxLength={6}
              />
            </View>
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <TouchableOpacity style={styles.button} onPress={handleVerifyOTP}>
              <Text style={styles.buttonText}>Verify OTP</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.resendButton]} onPress={handleResendOtp}>
              <Text style={styles.buttonText}>Resend OTP</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '140%',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    padding: 15,
    marginTop: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f3f3',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#fe7009',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  resendButton: {
    backgroundColor: '#6c757d', // A different color for distinction
    marginTop: 10,
  },
});

export default OtpVerificationScreen;
