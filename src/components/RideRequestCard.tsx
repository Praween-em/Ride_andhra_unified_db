import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import api from '../config/api';
import { useRideRequest, RideRequest } from '../context/RideRequestContext';
import * as Progress from 'react-native-progress';
import { MapPinIcon } from 'lucide-react-native'; // Assuming you use lucide-react-native

const RIDE_REQUEST_TIMEOUT = 30; // 30 seconds

const RideRequestCard = () => {
  const { rideRequest, setRideRequest } = useRideRequest();
  const [progress, setProgress] = useState(1);
  const [slideAnim] = useState(new Animated.Value(300)); // Start off-screen

  useEffect(() => {
    if (rideRequest) {
      // Animate card slide-in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Start countdown
      setProgress(1);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev <= 0) {
            clearInterval(interval);
            handleDecline(false); // Auto-decline when time runs out
            return 0;
          }
          return prev - 1 / (RIDE_REQUEST_TIMEOUT * 10);
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
        // Animate card slide-out
        Animated.timing(slideAnim, {
            toValue: 300,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }
  }, [rideRequest]);

  const handleDecline = (isManual: boolean) => {
    if (!rideRequest) return;
    if (isManual) {
      api.post(`/rides/${rideRequest.rideId}/decline`).catch(err => console.error("Failed to decline ride:", err));
    }
    setRideRequest(null);
  };

  const handleAccept = async () => {
    if (!rideRequest) return;
    try {
      await api.post(`/rides/${rideRequest.rideId}/accept`);
      // Optionally navigate to a "trip started" screen
      alert("Ride Accepted!");
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        alert("Ride was already accepted by another driver.");
      } else {
        alert("Failed to accept ride. Please try again.");
      }
      console.error("Failed to accept ride:", error);
    } finally {
        setRideRequest(null);
    }
  };

  if (!rideRequest) {
    return null;
  }

  return (
    <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.header}>
        <Text style={styles.fare}>₹{rideRequest.fare.toFixed(2)}</Text>
        <View style={styles.timerContainer}>
          <Progress.Circle
            size={40}
            progress={progress}
            showsText={true}
            formatText={() => Math.round(progress * RIDE_REQUEST_TIMEOUT)}
            color={'#34D399'}
            unfilledColor="#E5E7EB"
            borderColor="#fff"
            textStyle={styles.timerText}
          />
        </View>
      </View>
      <View style={styles.locationContainer}>
        <MapPinIcon size={20} color="#34D399" />
        <Text style={styles.addressText} numberOfLines={1}>{rideRequest.pickupAddress}</Text>
      </View>
      <View style={[styles.locationContainer, { marginBottom: 20 }]}>
        <MapPinIcon size={20} color="#F87171" />
        <Text style={styles.addressText} numberOfLines={1}>{rideRequest.dropoffAddress || 'Destination not provided'}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.declineButton]} onPress={() => handleDecline(true)}>
          <Text style={[styles.buttonText, styles.declineButtonText]}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={handleAccept}>
          <Text style={[styles.buttonText, styles.acceptButtonText]}>Accept</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  fare: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  timerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#4B5563',
    flexShrink: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#F3F4F6',
    marginRight: 10,
  },
  acceptButton: {
    backgroundColor: '#10B981',
    marginLeft: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  declineButtonText: {
    color: '#4B5563',
  },
  acceptButtonText: {
    color: 'white',
  },
});

export default RideRequestCard;
