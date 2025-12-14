import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import api from '../config/api';

const VerificationPendingScreen = ({ navigation }) => {
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Poll every 3 seconds to check if verification is complete
    const checkVerification = async () => {
      try {
        setChecking(true);
        const response = await api.get('/profile');
        const userData = response.data;

        console.log('Verification Check:', {
          isVerified: userData.is_verified,
          hasDriverId: !!userData.driver_id,
          hasDriverRole: userData.roles?.includes('driver')
        });

        // If user is now verified with driver record, navigate to home
        if (userData.is_verified && userData.driver_id && userData.roles?.includes('driver')) {
          console.log('✅ Driver approved! Navigating to home...');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }
      } catch (error) {
        console.error('Error checking verification:', error);
      } finally {
        setChecking(false);
      }
    };

    // Check immediately on mount
    checkVerification();

    // Then check every 3 seconds
    const interval = setInterval(checkVerification, 3000);

    return () => clearInterval(interval);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Verification in Progress</Text>
        <Text style={styles.subtitle}>
          Thank you for submitting your application. We are currently reviewing your documents.
        </Text>
        <Text style={styles.subtitle}>
          We will notify you once the verification is complete.
        </Text>

        {checking && (
          <View style={styles.checkingContainer}>
            <ActivityIndicator size="small" color="#fe7009" />
            <Text style={styles.checkingText}>Checking status...</Text>
          </View>
        )}

        <Button
          mode="contained"
          onPress={() => navigation.navigate('Login')}
          style={styles.button}
        >
          Back to Login
        </Button>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  checkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  checkingText: {
    marginLeft: 10,
    color: '#fe7009',
    fontSize: 14,
  },
  button: {
    marginTop: 30,
  },
});

export default VerificationPendingScreen;
