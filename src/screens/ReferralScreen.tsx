import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../config/api';


const ReferralScreen = () => {
  const navigation = useNavigation();
  const [referralCode, setReferralCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      const { phone_number, name } = response.data;
      if (phone_number && name) {
        // Generate referral code: first 5 digits of phone + first name
        // Assuming phone_number is stored as 10 digits. If it has +91, we might want to strip it.
        // Based on backend logic, it seems specifically normalized to 10 digits.
        const phonePart = phone_number.substring(0, 5);
        const firstName = name.split(' ')[0];
        setReferralCode(`${phonePart}${firstName}`);
      }
    } catch (error) {
      console.error('Error fetching profile for referral code:', error);
    } finally {
      setLoading(false);
    }
  };



  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a202c" />
        </TouchableOpacity>
        <Title style={styles.headerTitle}>Your Referrals</Title>
      </View>
      <View style={styles.content}>
        <View style={styles.referralBox}>
          <Image source={require('../assets/Otp_verification.png')} style={styles.referralImage} resizeMode="contain" />
          <Title style={styles.referralCodeTitle}>Your Referral Code</Title>
          {loading ? (
            <ActivityIndicator size="small" color="#fe7009" />
          ) : (
            <Paragraph style={styles.referralCode}>{referralCode || 'UNAVAILABLE'}</Paragraph>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f5f7',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
    textAlign: 'center',
    flex: 1,
  },
  content: {
    padding: 20,
  },
  referralBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
  },
  referralImage: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  referralCodeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  referralCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fe7009',
    textTransform: 'uppercase',
  },
  listContainer: {
    paddingBottom: 20,
  },
  referralCard: {
    marginBottom: 10,
  },
});

export default ReferralScreen;
