import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRideRequest } from '../context/RideRequestContext';
import { useSound } from '../context/SoundContext';
import api from '../config/api';

const { width } = Dimensions.get('window');

interface Ride {
    id: string;
    pickupLocation: string;
    pickupLatitude: number;
    pickupLongitude: number;
    dropoffLocation: string;
    dropoffLatitude: number;
    dropoffLongitude: number;
    fare: number;
    distance?: number;
    duration?: number;
    user?: {
        name?: string;
        phone_number?: string;
    };
    status?: string;
}

const RidesScreen = ({ navigation }: { navigation: any }) => {
    const [currentRide, setCurrentRide] = useState<Ride | null>(null);
    const [pinModalVisible, setPinModalVisible] = useState(false);
    const [pin, setPin] = useState(['', '', '', '']);
    const pinInputRefs = useRef<any[]>([]);
    const { rideRequest, clearRideRequest } = useRideRequest();
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(false); // Added isOnline state
    const { playAlert, stopAlert } = useSound();

    const calculateDuration = (minutes?: number) => minutes ? `${minutes} min` : '--';
    const calculateDistance = (km?: number) => km ? `${km} km` : '--';

    const handleReject = async (rideId: string) => {
        try {
            setActionLoading(rideId);
            // Stop the looping alert sound
            stopAlert();
            // Assuming you have a reject endpoint, otherwise just remove from list locally for now
            await api.post(`/rides/${rideId}/decline`);
            setRides(rides.filter(r => r.id !== rideId));
            Alert.alert('Ride Rejected');
        } catch (error: any) {
            console.error('Error rejecting ride:', error);
            Alert.alert('Error', 'Failed to reject ride');
        } finally {
            setActionLoading(null);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchDriverStatus();
            fetchPendingRides();
            fetchCurrentRide();
        }, [rideRequest])
    );



    const fetchDriverStatus = async () => {
        try {
            const response = await api.get('/profile');
            if (response.data?.profile) {
                setIsOnline(response.data.profile.isOnline);
            }
        } catch (error) {
            console.error('Error fetching driver status:', error);
        }
    };

    const fetchPendingRides = async () => {
        try {
            const response = await api.get('/rides/pending');
            const newRides = response.data;
            if (isOnline && newRides.length > rides.length && newRides.length > 0) {
                // Play sound if we have more rides than before and we are online
                playAlert('RIDE_REQUEST');
            }
            setRides(newRides);
        } catch (error) {
            console.error('Error fetching pending rides:', error);
        }
    };

    const fetchCurrentRide = async () => {
        try {
            const response = await api.get('/rides/current');
            if (response.data) {
                setCurrentRide(response.data);
            } else {
                setCurrentRide(null);
            }
        } catch (error) {
            console.error('Error fetching current ride:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (rideId: string) => {
        try {
            setActionLoading(rideId);
            // Stop the looping alert sound
            stopAlert();
            await api.post(`/rides/${rideId}/accept`);
            Alert.alert('Success', 'Ride accepted!');

            // Refresh logic
            setRides(rides.filter(r => r.id !== rideId));
            clearRideRequest();
            fetchCurrentRide(); // Switch to active view
        } catch (error: any) {
            console.error('Error accepting ride:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to accept ride');
        } finally {
            setActionLoading(null);
        }
    };

    const handleStartRide = async () => {
        const pinValue = pin.join('');
        if (pinValue.length !== 4) {
            Alert.alert('Invalid PIN', 'Please enter 4-digit PIN');
            return;
        }

        try {
            setActionLoading('start');
            await api.post(`/rides/${currentRide?.id}/start`, { pin: pinValue });
            setPinModalVisible(false);
            setPin(['', '', '', '']); // Reset PIN
            Alert.alert('Success', 'Ride Started!');
            fetchCurrentRide();
        } catch (error: any) {
            console.error('Error starting ride:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to start ride');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCompleteRide = async () => {
        try {
            setActionLoading('complete');
            await api.post(`/rides/${currentRide?.id}/complete`);
            Alert.alert('Success', 'Ride Completed!');
            setCurrentRide(null); // Clear active ride
            fetchPendingRides(); // Go back to pending list
            // Optionally navigate to payment summary or wallet
        } catch (error: any) {
            console.error('Error completing ride:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to complete ride');
        } finally {
            setActionLoading(null);
        }
    };

    const handlePinChange = (text: string, index: number) => {
        const newPin = [...pin];
        newPin[index] = text;
        setPin(newPin);
        if (text && index < 3) {
            pinInputRefs.current[index + 1].focus();
        }
    };

    // ... existing helpers ...

    const renderActiveRide = () => (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <Card style={[styles.rideCard, styles.activeRideCard]}>
                <Card.Content>
                    <Text style={styles.activeLabel}>ONGOING RIDE ({currentRide?.status})</Text>

                    {/* User Info */}
                    <View style={styles.cardHeader}>
                        <View style={styles.userInfo}>
                            <View style={styles.avatarContainer}>
                                <MaterialCommunityIcons name="face-man-profile" size={24} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.userName}>{currentRide?.user?.name || 'Rider'}</Text>
                                <Text style={styles.phoneText}>{currentRide?.user?.phone_number}</Text>
                            </View>
                        </View>
                        <View style={styles.fareContainer}>
                            <Text style={styles.fareText}>₹{currentRide?.fare}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Locations */}
                    <View style={styles.locationContainer}>
                        <View style={styles.locationRow}>
                            <View style={[styles.dot, styles.greenDot]} />
                            <View style={styles.addressContainer}>
                                <Text style={styles.locationLabel}>PICKUP</Text>
                                <Text style={styles.addressText}>{currentRide?.pickupLocation}</Text>
                            </View>
                        </View>
                        <View style={styles.verticalLine} />
                        <View style={styles.locationRow}>
                            <View style={[styles.dot, styles.redDot]} />
                            <View style={styles.addressContainer}>
                                <Text style={styles.locationLabel}>DROP OFF</Text>
                                <Text style={styles.addressText}>{currentRide?.dropoffLocation}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actionButtons}>
                        {currentRide?.status === 'accepted' && (
                            <TouchableOpacity
                                style={styles.acceptButton}
                                onPress={() => setPinModalVisible(true)}
                            >
                                <Text style={styles.acceptButtonText}>START TRIP</Text>
                            </TouchableOpacity>
                        )}
                        {currentRide?.status === 'in_progress' && (
                            <TouchableOpacity
                                style={[styles.acceptButton, { backgroundColor: '#28a745' }]}
                                onPress={handleCompleteRide}
                                disabled={actionLoading === 'complete'}
                            >
                                {actionLoading === 'complete' ? <ActivityIndicator color="#fff" /> : <Text style={styles.acceptButtonText}>COMPLETE TRIP</Text>}
                            </TouchableOpacity>
                        )}
                    </View>
                </Card.Content>
            </Card>

            {/* PIN Modal */}
            <Modal
                transparent={true}
                visible={pinModalVisible}
                onRequestClose={() => setPinModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Enter Rider PIN</Text>
                        <Text style={styles.modalSubtitle}>Ask the rider for the 4-digit PIN</Text>

                        <View style={styles.pinContainer}>
                            {pin.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => { pinInputRefs.current[index] = ref; }}
                                    style={styles.pinInput}
                                    maxLength={1}
                                    keyboardType="numeric"
                                    value={digit}
                                    onChangeText={(text) => handlePinChange(text, index)}
                                />
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setPinModalVisible(false)} style={styles.cancelLink}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleStartRide}
                                style={[styles.modalButton, actionLoading === 'start' && styles.disabledButton]}
                                disabled={actionLoading === 'start'}
                            >
                                {actionLoading === 'start' ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalButtonText}>Verify & Start</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{currentRide ? 'Current Ride' : 'Ride Requests'}</Text>
                <TouchableOpacity onPress={() => { fetchPendingRides(); fetchCurrentRide(); }} disabled={loading}>
                    <Ionicons name="refresh" size={24} color="#1a202c" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {loading ? (
                    <View style={styles.emptyStateContainer}>
                        <ActivityIndicator size="large" color="#fe7009" />
                        <Text style={styles.emptyStateText}>Loading...</Text>
                    </View>
                ) : !isOnline ? (  // Added check for offline status
                    <View style={styles.emptyStateContainer}>
                        <MaterialCommunityIcons name="steering" size={80} color="#cbd5e0" />
                        <Text style={styles.emptyStateText}>You are Offline</Text>
                        <Text style={styles.emptyStateSubText}>
                            Go Online from the Home screen to start receiving ride requests.
                        </Text>
                    </View>
                ) : currentRide ? (
                    renderActiveRide()
                ) : rides.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                        <MaterialCommunityIcons name="motorbike" size={80} color="#cbd5e0" />
                        <Text style={styles.emptyStateText}>No rides available</Text>
                        <Text style={styles.emptyStateSubText}>
                            Move to high booking zones to get more rides.
                        </Text>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {rides.map((ride) => (
                            <Card key={ride.id} style={styles.rideCard}>
                                <Card.Content>
                                    {/* ... Existing Card Content ... */}
                                    <View style={styles.cardHeader}>
                                        <View style={styles.userInfo}>
                                            <View style={styles.avatarContainer}>
                                                <MaterialCommunityIcons name="face-man-profile" size={24} color="#fff" />
                                            </View>
                                            <View>
                                                <Text style={styles.userName}>{ride.user?.name || 'Rider'}</Text>
                                                <View style={styles.ratingContainer}>
                                                    <Text style={styles.ratingText}>4.8</Text>
                                                    <MaterialCommunityIcons name="star" size={12} color="#FFD700" />
                                                </View>
                                            </View>
                                        </View>
                                        <View style={styles.fareContainer}>
                                            <Text style={styles.fareText}>₹{ride.fare}</Text>
                                            <Text style={styles.paymentType}>Cash</Text>
                                        </View>
                                    </View>

                                    <View style={styles.divider} />

                                    <View style={styles.locationContainer}>
                                        <View style={styles.locationRow}>
                                            <View style={[styles.dot, styles.greenDot]} />
                                            <View style={styles.addressContainer}>
                                                <Text style={styles.locationLabel}>PICKUP</Text>
                                                <Text style={styles.addressText}>{ride.pickupLocation}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.verticalLine} />
                                        <View style={styles.locationRow}>
                                            <View style={[styles.dot, styles.redDot]} />
                                            <View style={styles.addressContainer}>
                                                <Text style={styles.locationLabel}>DROP OFF</Text>
                                                <Text style={styles.addressText}>{ride.dropoffLocation}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.statsRow}>
                                        <View style={styles.statItem}>
                                            <Ionicons name="time-outline" size={20} color="#666" />
                                            <Text style={styles.statText}>{calculateDuration(ride.duration)}</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Ionicons name="speedometer-outline" size={20} color="#666" />
                                            <Text style={styles.statText}>{calculateDistance(ride.distance)}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.actionButtons}>
                                        <TouchableOpacity
                                            style={[styles.rejectButton, actionLoading === ride.id && styles.disabledButton]}
                                            onPress={() => handleReject(ride.id)}
                                            disabled={actionLoading === ride.id}
                                        >
                                            {actionLoading === ride.id ? (
                                                <ActivityIndicator size="small" color="#e53e3e" />
                                            ) : (
                                                <Text style={styles.rejectButtonText}>Reject</Text>
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.acceptButton, actionLoading === ride.id && styles.disabledButton]}
                                            onPress={() => handleAccept(ride.id)}
                                            disabled={actionLoading === ride.id}
                                        >
                                            {actionLoading === ride.id ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Text style={styles.acceptButtonText}>Accept Ride</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </Card.Content>
                            </Card>
                        ))}
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        elevation: 2,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a202c',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyStateText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4a5568',
        marginTop: 20,
        marginBottom: 10,
    },
    emptyStateSubText: {
        fontSize: 16,
        color: '#718096',
        textAlign: 'center',
        marginBottom: 30,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    rideCard: {
        borderRadius: 16,
        elevation: 4,
        backgroundColor: '#fff',
        marginBottom: 16,
    },
    activeRideCard: {
        borderColor: '#fe7009',
        borderWidth: 2,
    },
    activeLabel: {
        textAlign: 'center',
        color: '#fe7009',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fe7009',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a202c',
    },
    phoneText: {
        fontSize: 12,
        color: '#718096',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 12,
        color: '#4a5568',
        marginRight: 4,
    },
    fareContainer: {
        alignItems: 'flex-end',
    },
    fareText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#28a745',
    },
    paymentType: {
        fontSize: 12,
        color: '#718096',
        textTransform: 'uppercase',
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 15,
    },
    locationContainer: {
        marginBottom: 20,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 5,
        marginRight: 12,
    },
    greenDot: {
        backgroundColor: '#28a745',
    },
    redDot: {
        backgroundColor: '#e53e3e',
    },
    verticalLine: {
        width: 2,
        height: 30,
        backgroundColor: '#e2e8f0',
        marginLeft: 5,
        marginVertical: 2,
    },
    addressContainer: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#a0aec0',
        marginBottom: 2,
    },
    addressText: {
        fontSize: 15,
        color: '#2d3748',
        fontWeight: '500',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#f7fafc',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#4a5568',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    rejectButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e53e3e',
        alignItems: 'center',
    },
    rejectButtonText: {
        color: '#e53e3e',
        fontWeight: 'bold',
        fontSize: 16,
    },
    acceptButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#fe7009',
        alignItems: 'center',
        elevation: 2,
    },
    acceptButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    disabledButton: {
        opacity: 0.6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        width: '85%',
        padding: 24,
        borderRadius: 16,
        elevation: 5,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    pinContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 24,
    },
    pinInput: {
        width: 50,
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 24,
        backgroundColor: '#f9f9f9',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center',
    },
    cancelLink: {
        padding: 10,
    },
    cancelText: {
        color: '#666',
        fontWeight: '600',
    },
    modalButton: {
        backgroundColor: '#fe7009',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        minWidth: 120,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default RidesScreen;
