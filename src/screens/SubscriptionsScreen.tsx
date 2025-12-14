import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SubscriptionImage from '../assets/Subscription.png';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const SubscriptionsScreen = () => {
  const navigation = useNavigation();
  const handleSubscription = (plan) => {
    navigation.navigate('Payment', { plan });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a202c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscriptions</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Daily</Title>
              <Paragraph style={styles.cardPrice}>₹24</Paragraph>
              <View style={styles.detailsContainer}>
                <Text style={styles.detailText}>✓ 0% Commission</Text>
                <Text style={styles.detailText}>✓ Direct Payouts</Text>
                <Text style={styles.detailText}>✓ Unlimited Rides</Text>
              </View>
              <Text style={{color:'#fe7009'}}>Save upto ₹250 in daily commissions </Text>
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={() => handleSubscription({ name: 'Daily', price: 24, validity: '1 Day' })} style={styles.buyButton}>Buy</Button>
            </Card.Actions>
          </Card>
          <Card style={[styles.card, styles.recommendedCard]}>
            <LinearGradient
              colors={['#fe7009', '#ff9a00']}
              style={styles.gradientBackground}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
              </View>
              <Card.Content>
                <Title style={[styles.cardTitle, styles.recommendedCardTitle]}>Weekly</Title>
                <Paragraph style={[styles.cardPrice, styles.recommendedCardPrice]}>₹149</Paragraph>
                <View style={styles.detailsContainer}>
                  <Text style={[styles.detailText, styles.recommendedDetailText]}>✓ 0% Commission</Text>
                  <Text style={[styles.detailText, styles.recommendedDetailText]}>✓ Direct Payouts</Text>
                  <Text style={[styles.detailText, styles.recommendedDetailText]}>✓ Unlimited Rides</Text>
                  <Text style={[styles.detailText, styles.recommendedDetailText]}>✓ Priority Support</Text>
                </View>
                
              <Text style={{color:'white'}}>Save upto ₹1500 in Weekly commissions </Text>
              </Card.Content>
              <Card.Actions>
                <Button mode="contained" onPress={() => handleSubscription({ name: 'Weekly', price: 149, validity: '7 Days' })} style={styles.recommendedBuyButton} labelStyle={styles.recommendedBuyButtonText}>Buy</Button>
              </Card.Actions>
            </LinearGradient>
          </Card>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Monthly</Title>
              <Paragraph style={styles.cardPrice}>₹669</Paragraph>
              <View style={styles.detailsContainer}>
                <Text style={styles.detailText}>✓ 0% Commission</Text>
                <Text style={styles.detailText}>✓ Direct Payouts</Text>
                <Text style={styles.detailText}>✓ Unlimited Rides</Text>
                <Text style={styles.detailText}>✓ Dedicated Account Manager</Text>
              </View>
              <Text style={{color:'#fe7009'}}>Save upto ₹7000 in Monthly commissions </Text>
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={() => handleSubscription({ name: 'Monthly', price: 669, validity: '30 Days' })} style={styles.buyButton}>Buy</Button>
            </Card.Actions>
          </Card>
        </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  card: {
    marginBottom: 20,
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  cardPrice: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 10,
    color: '#fe7009',
    fontWeight: 'bold',
  },
  detailsContainer: {
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#1E293B',
  },
  buyButton: {
    backgroundColor: '#fe7009',
    marginHorizontal: 10,
    borderRadius: 8,
  },
  recommendedCard: {
    borderColor: '#fe7009',
    borderWidth: 2,
  },
  gradientBackground: {
    padding: 20,
    borderRadius: 10,
  },
  recommendedBadge: {
    backgroundColor: '#fff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 10,
  },
  recommendedBadgeText: {
    color: '#fe7009',
    fontWeight: 'bold',
    fontSize: 12,
  },
  recommendedCardTitle: {
    color: '#fff',
  },
  recommendedCardPrice: {
    color: '#fff',
  },
  recommendedDetailText: {
    color: '#fff',
  },
  recommendedBuyButton: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    borderRadius: 8,
  },
  recommendedBuyButtonText: {
    color: '#fe7009',
  },
});

export default SubscriptionsScreen;
