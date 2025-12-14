import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

const WithdrawScreen = ({ navigation, route }) => {
  const { mainBalance, referralBalance } = route.params;

  const [selectedBalanceType, setSelectedBalanceType] = useState('main'); // 'main' or 'referral'
  const [withdrawMethod, setWithdrawMethod] = useState('bank'); // 'bank' or 'upi'

  // Bank details
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  // UPI details
  const [upiId, setUpiId] = useState('');

  const [amount, setAmount] = useState('');

  const currentBalance = selectedBalanceType === 'main' ? mainBalance : referralBalance;
  const isReferralWithdrawalAllowed = selectedBalanceType === 'referral' && referralBalance >= 1000;
  const isWithdrawalAllowed = selectedBalanceType === 'main' || isReferralWithdrawalAllowed;

  const handleWithdraw = () => {
    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount to withdraw.');
      return;
    }

    if (withdrawAmount > currentBalance) {
      Alert.alert('Error', `You can only withdraw up to ₹${currentBalance}.`);
      return;
    }

    if (selectedBalanceType === 'referral' && withdrawAmount < 1000) {
      Alert.alert('Error', 'Referral balance can only be withdrawn if the amount is ₹1000 or more.');
      return;
    }

    if (withdrawMethod === 'bank') {
      if (!accountNumber || !confirmAccountNumber || !ifsc || !accountHolder) {
        Alert.alert('Error', 'Please fill all the bank details.');
        return;
      }
      if (accountNumber !== confirmAccountNumber) {
        Alert.alert('Error', 'Account numbers do not match.');
        return;
      }
    } else {
      if (!upiId) {
        Alert.alert('Error', 'Please enter your UPI ID.');
        return;
      }
    }

    Alert.alert('Success', `Withdrawal request for ₹${amount} from ${selectedBalanceType} balance via ${withdrawMethod} has been submitted.`);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Withdraw Funds</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.formCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Available Balances</Title>
            <View style={styles.balanceDisplayContainer}>
              <Text style={styles.balanceDisplayText}>Main Balance: <Text style={styles.balanceValue}>₹{mainBalance}</Text></Text>
              <Text style={styles.balanceDisplayText}>Referral Balance: <Text style={styles.balanceValue}>₹{referralBalance}</Text></Text>
            </View>

            <Title style={styles.sectionTitle}>Select Balance to Withdraw From</Title>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, selectedBalanceType === 'main' && styles.activeTab]}
                onPress={() => setSelectedBalanceType('main')}
              >
                <Text style={[styles.tabText, selectedBalanceType === 'main' && styles.activeTabText]}>Main</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, selectedBalanceType === 'referral' && styles.activeTab]}
                onPress={() => setSelectedBalanceType('referral')}
              >
                <Text style={[styles.tabText, selectedBalanceType === 'referral' && styles.activeTabText]}>Referral</Text>
              </TouchableOpacity>
            </View>

            {selectedBalanceType === 'referral' && referralBalance < 1000 && (
              <Paragraph style={styles.referralWarning}>
                Referral balance can only be withdrawn once it exceeds ₹1000.
              </Paragraph>
            )}

            <Title style={styles.sectionTitle}>Withdrawal Method</Title>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, withdrawMethod === 'bank' && styles.activeTab]}
                onPress={() => setWithdrawMethod('bank')}
              >
                <Text style={[styles.tabText, withdrawMethod === 'bank' && styles.activeTabText]}>Bank Account</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, withdrawMethod === 'upi' && styles.activeTab]}
                onPress={() => setWithdrawMethod('upi')}
              >
                <Text style={[styles.tabText, withdrawMethod === 'upi' && styles.activeTabText]}>UPI</Text>
              </TouchableOpacity>
            </View>

            {withdrawMethod === 'bank' ? (
              <>
                <TextInput style={styles.input} placeholder="Bank Account Number" keyboardType="number-pad" value={accountNumber} onChangeText={setAccountNumber} />
                <TextInput style={styles.input} placeholder="Confirm Bank Account Number" keyboardType="number-pad" value={confirmAccountNumber} onChangeText={setConfirmAccountNumber} />
                <TextInput style={styles.input} placeholder="IFSC Code" autoCapitalize="characters" value={ifsc} onChangeText={setIfsc} />
                <TextInput style={styles.input} placeholder="Account Holder Name" value={accountHolder} onChangeText={setAccountHolder} />
              </>
            ) : (
              <TextInput style={styles.input} placeholder="UPI ID (e.g., yourname@upi)" value={upiId} onChangeText={setUpiId} />
            )}

            <TextInput
              style={styles.input}
              placeholder={`Amount to Withdraw (Max: ₹${currentBalance})`}
              keyboardType="number-pad"
              value={amount}
              onChangeText={setAmount}
              editable={isWithdrawalAllowed}
            />

            <TouchableOpacity
              style={[styles.withdrawButton, !isWithdrawalAllowed && styles.disabledButton]}
              onPress={handleWithdraw}
              disabled={!isWithdrawalAllowed}
            >
              <Text style={styles.withdrawButtonText}>Submit Request</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>
      </ScrollView>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  formCard: {
    margin: 20,
    borderRadius: 15,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  balanceDisplayContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff7ed',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fe7009',
  },
  balanceDisplayText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  balanceValue: {
    fontWeight: 'bold',
    color: '#fe7009',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#fe7009',
  },
  tabText: {
    fontWeight: '600',
    color: '#333',
  },
  activeTabText: {
    color: '#fff',
  },
  referralWarning: {
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  withdrawButton: {
    backgroundColor: '#fe7009',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WithdrawScreen;