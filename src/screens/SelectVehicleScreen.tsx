import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, RadioButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDriverRegistration } from '../context/DriverRegistrationContext';

const vehicleOptions = [
  { id: '1', label: 'Bike', value: 'Bike', icon: 'motorbike' },
  { id: '2', label: 'Auto', value: 'Auto', icon: 'rickshaw' },
  { id: '3', label: 'Cab', value: 'Car', icon: 'car' },
  { id: '4', label: 'Bike Lite', value: 'bike-lite', icon: 'bike-fast' },
];

const SelectVehicleScreen = ({ navigation }) => {
  const { registrationData, setRegistrationData, markStepAsCompleted } = useDriverRegistration();

  const handleSave = () => {
    if (registrationData.vehicleType) {
      markStepAsCompleted('2');
      navigation.goBack();
    } else {
      alert('Please select a vehicle type');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Select Your Vehicle</Text>
        <Text style={styles.subtitle}>Choose the type of vehicle you will be using for rides.</Text>
        
        <View style={styles.optionsContainer}>
          {vehicleOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                registrationData.vehicleType === option.value && styles.selectedCard,
              ]}
              onPress={() => setRegistrationData({ vehicleType: option.value as 'Bike' | 'Auto' | 'Car' | 'bike-lite' })}
            >
              <MaterialCommunityIcons
                name={option.icon}
                size={48}
                color={registrationData.vehicleType === option.value ? '#fff' : '#fe7009'}
              />
              <Text
                style={[
                  styles.optionLabel,
                  registrationData.vehicleType === option.value && styles.selectedLabel,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
          Save and Continue
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  optionCard: {
    width: '45%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    backgroundColor: '#fe7009',
    borderColor: '#fe7009',
  },
  optionLabel: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedLabel: {
    color: '#fff',
  },
  saveButton: {
    marginTop: 20,
    paddingVertical: 8,
    backgroundColor: '#fe7009',
  },
});

export default SelectVehicleScreen;