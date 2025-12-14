import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { List } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useDriverRegistration } from '../context/DriverRegistrationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const steps = [
  { id: '1', title: 'Personal Information', screen: 'PersonalInfo' },
  { id: '2', title: 'Select Vehicle', screen: 'SelectVehicle' },
  { id: '3', title: 'Driving License', screen: 'DrivingLicense' },
  { id: '4', title: 'Vehicle Information', screen: 'VehicleInfo' },
  { id: '5', title: 'Aadhaar & PAN Card', screen: 'AadhaarPan' },
];

const DriverRegistrationScreen = ({ navigation }) => {
  const { completedSteps, setRegistrationData } = useDriverRegistration();

  useEffect(() => {
    const getPhoneNumber = async () => {
      const storedPhoneNumber = await AsyncStorage.getItem('phoneNumber');
      if (storedPhoneNumber) {
        setRegistrationData({ phoneNumber: storedPhoneNumber });
      }
    };
    getPhoneNumber();
  }, [setRegistrationData]);

  const isStepCompleted = (stepId) => completedSteps.includes(stepId);

  const isStepLocked = (stepId) => {
    if (stepId === '1') {
      return false;
    }
    const previousStepId = (parseInt(stepId, 10) - 1).toString();
    return !isStepCompleted(previousStepId);
  };

  const handleStepPress = (step) => {
    if (!isStepLocked(step.id)) {
      navigation.navigate(step.screen);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Become a Rider</Text>
        <Text style={styles.subtitle}>Complete the following steps to start earning</Text>
        <List.Section>
          {steps.map((step) => (
            <TouchableOpacity
              key={step.id}
              onPress={() => handleStepPress(step)}
              disabled={isStepLocked(step.id)}
            >
              <List.Item
                title={step.title}
                left={() => (
                  <Ionicons
                    name={isStepCompleted(step.id) ? 'checkmark-circle' : isStepLocked(step.id) ? 'lock-closed' : 'ellipse-outline'}
                    size={24}
                    color={isStepCompleted(step.id) ? '#28a745' : isStepLocked(step.id) ? '#dc3545' : '#fe7009'}
                  />
                )}
                right={() => <List.Icon icon="chevron-right" />}
                style={[styles.listItem, isStepLocked(step.id) && styles.lockedItem]}
              />
            </TouchableOpacity>
          ))}
        </List.Section>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  listItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 10,
    paddingLeft: 15,
  },
  lockedItem: {
    backgroundColor: '#e9ecef',
  },
});

export default DriverRegistrationScreen;