import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import { API_URL } from '../config/api';

const PaymentScreen = ({ navigation }) => {
  const route = useRoute();
  const { plan } = route.params;
  const [loading, setLoading] = useState(false);
  const [mobileNumber, setMobileNumber] = useState(null);

  useEffect(() => {
    const getMobileNumber = async () => {
      const number = await AsyncStorage.getItem('phoneNumber');
      if (number) {
        setMobileNumber(number);
      } else {
        Alert.alert('Error', 'Mobile number not found. Please log in again.');
        navigation.goBack();
      }
    };
    getMobileNumber();
  }, []);

  const handleRazorpayPayment = async () => {
    if (!mobileNumber) {
      Alert.alert('Error', 'Mobile number not available.');
      return;
    }

    setLoading(true);
    try {
      // Get JWT token for authentication
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        navigation.goBack();
        return;
      }

      // Step 1: Create order on backend
      const orderResponse = await fetch(`${API_URL}/razorpay/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: plan.price * 100, // Convert to paise
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const orderData = await orderResponse.json();
      console.log('Order created:', orderData);

      // Step 2: Open Razorpay Checkout
      const options = {
        description: `${plan.name} - ${plan.validity}`,
        image: 'https://i.imgur.com/3g7nmJC.jpg', // Replace with your app logo
        currency: 'INR',
        key: 'rzp_test_RpO2Zgt8T7ubJ4', // Razorpay Test Key (should match backend)
        amount: orderData.amount,
        name: 'Ride Andhra',
        order_id: orderData.orderId,
        prefill: {
          contact: mobileNumber,
          name: 'Driver',
        },
        theme: { color: '#fe7009' },
      };

      const data = await RazorpayCheckout.open(options);

      // Step 3: Payment successful, verify on backend
      console.log('Payment success:', data);
      await verifyPayment(data, orderData.orderId);

    } catch (error) {
      console.error('Payment Error:', error);
      if (error.code === 2) {
        // User cancelled payment
        Alert.alert('Payment Cancelled', 'You have cancelled the payment.');
      } else {
        Alert.alert('Payment Failed', 'An error occurred during payment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentData, orderId) => {
    try {
      const token = await AsyncStorage.getItem('token');

      const verifyResponse = await fetch(`${API_URL}/razorpay/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_signature: paymentData.razorpay_signature,
          planDetails: {
            planName: plan.name,
            amount: plan.price,
            validity: plan.validity,
          },
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Payment verification failed');
      }

      const verifyData = await verifyResponse.json();
      console.log('Verification response:', verifyData);

      Alert.alert(
        'Payment Successful!',
        `Your ${plan.name} subscription has been activated.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Main'),
          },
        ]
      );
    } catch (error) {
      console.error('Verification Error:', error);
      Alert.alert(
        'Verification Failed',
        'Payment was successful but verification failed. Please contact support.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Main'),
          },
        ]
      );
    }
  };

  if (!mobileNumber) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Complete Your Payment</Text>

        <View style={styles.planDetails}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planPrice}>₹{plan.price}</Text>
          <Text style={styles.planValidity}>{plan.validity}</Text>
        </View>

        <TouchableOpacity
          style={[styles.paymentButton, loading && styles.paymentButtonDisabled]}
          onPress={handleRazorpayPayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Image source={require('../assets/UPI.png')} style={styles.upiIcon} />
              <Text style={styles.paymentButtonText}>Pay with Razorpay</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  planDetails: {
    width: '100%',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 25,
    alignItems: 'center',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fe7009',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 10,
  },
  planValidity: {
    fontSize: 16,
    color: '#666',
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fe7009',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  paymentButtonDisabled: {
    backgroundColor: '#ccc',
  },
  upiIcon: {
    width: 80,
    height: 30,
    resizeMode: 'contain',
    marginRight: 10,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  appIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginRight: 15,
  },
  appName: {
    fontSize: 18,
  },
  closeButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f44336',
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PaymentScreen;
