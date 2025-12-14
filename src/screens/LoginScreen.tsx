import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Keyboard,
  Animated,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OTPWidget } from '@msg91comm/sendotp-react-native';
import PhoneIcon from '../components/PhoneIcon';
import api from '../config/api';
import Constants from 'expo-constants';

const widgetId = Constants.expoConfig?.extra?.widgetId;
const tokenAuth = Constants.expoConfig?.extra?.tokenAuth;



const { height } = Dimensions.get('window');

const LoginScreen = ({ navigation }: { navigation: any }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const imageContainerHeight = useRef(new Animated.Value(height * 0.45)).current;
  const cardHeight = useRef(new Animated.Value(height * 0.55)).current;

  useEffect(() => {
    OTPWidget.initializeWidget(widgetId, tokenAuth);

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

  const handleSendOtp = async () => {
    if (phoneNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number.');
      return;
    }

    // BYPASS FOR GOOGLE PLAY VERIFICATION
    if (phoneNumber === '9999999999') {
      navigation.navigate('OtpVerification', {
        phoneNumber: `91${phoneNumber}`,
        reqId: 'TEST_REQ_ID_GOOGLE_VERIFY'
      });
      return;
    }

    setLoading(true);
    try {
      const fullPhoneNumber = `91${phoneNumber}`; // Country code + phone number

      // Use MSG91 Widget to send OTP
      const response = await OTPWidget.sendOTP({
        identifier: fullPhoneNumber
      });

      console.log('MSG91 Send OTP response:', response);

      if (response.type === 'success') {
        // Extract reqId from MSG91 response
        const reqId = response.res?.reqId || response.message;

        if (reqId) {
          // Navigate to OTP verification screen with reqId
          navigation.navigate('OtpVerification', {
            phoneNumber: fullPhoneNumber,
            reqId: reqId
          });
        } else {
          Alert.alert('Error', 'Request ID not found in the response. Please try again.');
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', 'An error occurred while sending the OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Animated.View style={[styles.imageContainer, { height: imageContainerHeight }]}>
          <Image
            source={require('../assets/driver_eelcome.png')}
            style={styles.image}
            resizeMode="stretch"
          />
        </Animated.View>
        <Animated.View style={[styles.card, { height: cardHeight }]}>
          <Image
            source={require('../assets/Ridenew.png')}
            style={styles.image1}
            resizeMode="stretch"
          />
          <Text style={styles.subtitle}>Please enter your phone number to continue</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.prefix}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Phone Number"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholderTextColor="#aaa"
                maxLength={10}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
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
    height: '160%',
  },
  image1: {
    width: 250,
    height: 60,
    alignSelf: 'center',
    marginBottom: 10,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    padding: 15,
    marginTop: 10,
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
  prefix: {
    marginRight: 10,
    fontSize: 16,
    color: '#333',
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
});

export default LoginScreen;