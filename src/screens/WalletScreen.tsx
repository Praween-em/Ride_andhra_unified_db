import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../config/api';

const WalletScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [referralBalance, setReferralBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/wallet');
      setBalance(response.data.balance || 0);
      setReferralBalance(response.data.referralBalance || 0);

      // Format transactions for display
      const formattedTransactions = (response.data.transactions || []).map(t => ({
        id: t.id.toString(),
        type: t.type === 'credit' ? 'Ride Earning' : 'Withdrawal',
        date: new Date(t.createdAt).toLocaleDateString(),
        amount: t.type === 'credit' ? `+ ₹${t.amount}` : `- ₹${t.amount}`,
      }));
      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const canWithdraw = referralBalance >= 1000;

  const renderTransaction = ({ item }) => (
    <Card style={styles.transactionCard}>
      <View style={styles.transactionContent}>
        <View style={styles.transactionLeft}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: item.amount.startsWith('+') ? '#E6F9ED' : '#FDE8E8' },
            ]}
          >
            <Ionicons
              name={item.amount.startsWith('+') ? 'arrow-down-circle' : 'arrow-up-circle'}
              size={24}
              color={item.amount.startsWith('+') ? '#28a745' : '#dc3545'}
            />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.transactionType}>{item.type}</Text>
            <Text style={styles.transactionDate}>{item.date}</Text>
          </View>
        </View>
        <Text
          style={[
            styles.transactionAmount,
            { color: item.amount.startsWith('+') ? '#28a745' : '#dc3545' },
          ]}
        >
          {item.amount}
        </Text>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fe7009" />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <LinearGradient colors={['#fe7009', '#ff9a00']} style={styles.header}>
          <Image
            source={require('../assets/MyWallet.png')}
            style={styles.headerImage}
            resizeMode="contain"
          />

        </LinearGradient>

        {/* BALANCE SECTION */}
        <View style={styles.balanceContainer}>


          <Card style={styles.balanceCard}>
            <Card.Content style={styles.cardContent}>
              <Ionicons name="gift-outline" size={28} color="#fe7009" />
              <Paragraph style={styles.balanceLabel}>Referral Balance</Paragraph>
              <Title style={styles.balanceAmount}>₹{referralBalance}</Title>
            </Card.Content>
          </Card>
        </View>

        {/* INFO MESSAGE */}
        {!canWithdraw && (
          <Text style={styles.withdrawalInfo}>
            Referral balance can be withdrawn once it exceeds ₹1000.
          </Text>
        )}

        {/* WITHDRAW BUTTON */}
        <TouchableOpacity
          style={styles.withdrawButton}
          onPress={() =>
            navigation.navigate('Withdraw', { mainBalance: balance, referralBalance })
          }
        >
          <LinearGradient
            colors={['#fe7009', '#ff9a00']} // Always use the orange gradient
            style={styles.buttonGradient}
          >
            <Text style={styles.withdrawButtonText}>Withdraw Funds</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* TRANSACTIONS */}
        <View style={styles.transactionsSection}>
          <Title style={styles.transactionsTitle}>Recent Transactions</Title>
          {transactions.length > 0 ? (
            <FlatList
              data={transactions}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noTransactionsText}>No transactions yet</Text>
          )}
        </View>

        {/* REFER A FRIEND */}

        <TouchableOpacity
          style={styles.referralContainer}
          onPress={() => navigation.navigate('Referral')}
        >
          <Image
            source={require('../assets/referafriend.png')}
            style={styles.referralImage}
            resizeMode="contain"
          />
          <Text style={{ marginTop: 5, fontSize: 20, fontWeight: 'bold' }}>₹500 for each Referal </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 35,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 5,
  },
  headerImage: {
    width: 150,
    height: 60,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: -20,
    marginHorizontal: 10,
  },
  balanceCard: {
    flex: 1,
    marginHorizontal: 10,
    borderRadius: 15,
    elevation: 4,
    backgroundColor: '#fff',
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  withdrawalInfo: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 15,
    marginHorizontal: 20,
    fontSize: 14,
  },
  withdrawButton: {
    marginHorizontal: 25,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 10,
  },
  buttonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#fe7009',
  },
  transactionsSection: {
    marginTop: 15,
  },
  transactionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 20,
    marginBottom: 10,
  },
  noTransactionsText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginVertical: 20,
  },
  transactionCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    color: '#888',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  referralContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderWidth: 0.2,
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  referralImage: {
    width: '90%',
    height: 150,
    borderRadius: 15,
  },
});

export default WalletScreen;
