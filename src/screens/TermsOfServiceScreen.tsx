import { ScrollView, Text, StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Title } from 'react-native-paper';
const TermsOfServiceScreen = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a202c" />
        </TouchableOpacity>
        <Title style={styles.headerTitle}>Terms of Service</Title>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last Updated: November 9, 2025</Text>

        <Text style={styles.paragraph}>
          Welcome to Ride Andhra! By downloading, registering, or using the Ride Andhra Driver App, you agree to the following terms and conditions. Please read them carefully.
        </Text>

        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By registering as a driver and using our app or services, you agree to be bound by these Terms of Service and our Privacy Policy.
          If you do not agree, you may not use the app.
        </Text>

        <Text style={styles.heading}>2. Definitions</Text>
        <Text style={styles.listItem}>- “App” – the Ride Andhra Driver mobile application and related services</Text>
        <Text style={styles.listItem}>- “Driver” – an individual who registers to provide transportation services</Text>
        <Text style={styles.listItem}>- “Rider” – an individual who requests rides through the app</Text>
        <Text style={styles.listItem}>- “Platform” – the digital system that connects riders and drivers</Text>

        <Text style={styles.heading}>3. Eligibility</Text>
        <Text style={styles.paragraph}>
          To use the driver app, you must:
        </Text>
        <Text style={styles.listItem}>- Be at least 18 years old</Text>
        <Text style={styles.listItem}>- Hold a valid driving licence issued in India</Text>
        <Text style={styles.listItem}>- Own or be authorized to operate a registered vehicle</Text>
        <Text style={styles.listItem}>- Have a smartphone with GPS and internet access</Text>
        <Text style={styles.listItem}>- Complete Ride Andhra’s verification process</Text>

        <Text style={styles.heading}>4. Driver Responsibilities</Text>
        <Text style={styles.paragraph}>
          You agree to:
        </Text>
        <Text style={styles.listItem}>- Provide accurate information during registration</Text>
        <Text style={styles.listItem}>- Maintain valid vehicle documents (RC, insurance, pollution certificate, etc.)</Text>
        <Text style={styles.listItem}>- Drive safely and follow all traffic laws</Text>
        <Text style={styles.listItem}>- Keep your app status (“Online”/“Offline”) accurate</Text>
        <Text style={styles.listItem}>- Treat riders respectfully and maintain professionalism</Text>
        <Text style={styles.listItem}>- Not share your account or device with others</Text>

        <Text style={styles.heading}>5. Platform Usage</Text>
        <Text style={styles.paragraph}>
          Ride Andhra acts as a technology platform connecting drivers and riders.
          We do not own vehicles, employ drivers, or guarantee ride volume or income.
          All rides are offered by independent drivers at their own discretion.
        </Text>

        <Text style={styles.heading}>6. Earnings and Payments</Text>
        <Text style={styles.listItem}>- Ride Andhra calculates fares automatically using distance and time.</Text>
        <Text style={styles.listItem}>- The platform may charge a service fee, subscription, or commission as stated in your driver account.</Text>
        <Text style={styles.listItem}>- Drivers receive payouts to their linked bank account or wallet as per schedule.</Text>
        <Text style={styles.listItem}>- In case of disputes, payment logs maintained by Ride Andhra are considered final.</Text>

        <Text style={styles.heading}>7. Cancellations and Penalties</Text>
        <Text style={styles.listItem}>- Drivers may cancel a booking before pickup if necessary, but frequent cancellations may affect ratings or access.</Text>
        <Text style={styles.listItem}>- Misuse or fraudulent cancellations can lead to suspension or termination of your account.</Text>

        <Text style={styles.heading}>8. Ratings and Feedback</Text>
        <Text style={styles.listItem}>- Both riders and drivers can rate each other after a ride.</Text>
        <Text style={styles.listItem}>- Ride Andhra may use these ratings to maintain quality standards or deactivate low-performing accounts after review.</Text>

        <Text style={styles.heading}>9. Subscription and Zero-Commission Plans</Text>
        <Text style={styles.listItem}>- For drivers under a subscription model, you may pay a daily, weekly, or monthly fee that covers your ride commissions.</Text>
        <Text style={styles.listItem}>- Your rides during that active period will not be subject to per-ride commissions.</Text>
        <Text style={styles.listItem}>- Failure to renew the plan may automatically revert your account to a commission-based model.</Text>

        <Text style={styles.heading}>10. Data and Privacy</Text>
        <Text style={styles.paragraph}>
          Your data is handled in accordance with our Privacy Policy.
          By using the app, you consent to collection of location and transaction data necessary for operations.
        </Text>

        <Text style={styles.heading}>11. Account Suspension or Termination</Text>
        <Text style={styles.paragraph}>
          We may suspend or deactivate your account if you:
        </Text>
        <Text style={styles.listItem}>- Violate these terms</Text>
        <Text style={styles.listItem}>- Engage in fraud, misconduct, or unsafe driving</Text>
        <Text style={styles.listItem}>- Receive repeated complaints from riders</Text>
        <Text style={styles.listItem}>- Use the platform for illegal purposes</Text>

        <Text style={styles.heading}>12. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          Ride Andhra provides the service “as is”.
          We are not responsible for:
        </Text>
        <Text style={styles.listItem}>- Accidents, injuries, or property damage during rides</Text>
        <Text style={styles.listItem}>- Delays or cancellations</Text>
        <Text style={styles.listItem}>- Losses due to device failure, internet issues, or third-party services</Text>
        <Text style={styles.paragraph}>
          Our total liability is limited to the amount of service fees paid by you in the last 30 days.
        </Text>

        <Text style={styles.heading}>13. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          All content, logos, software, and materials in the app are the property of Ride Andhra Mobility Pvt. Ltd.
          You may not copy, modify, or distribute them without permission.
        </Text>

        <Text style={styles.heading}>14. Governing Law and Jurisdiction</Text>
        <Text style={styles.paragraph}>
          These terms are governed by the laws of India, and disputes shall be settled under the jurisdiction of Vijayawada, Andhra Pradesh courts.
        </Text>

        <Text style={styles.heading}>15. Updates to Terms</Text>
        <Text style={styles.paragraph}>
          We may update these Terms from time to time.
          Any changes will be posted in the app. Continued use means you accept the updated terms.
        </Text>

        <Text style={styles.heading}>16. Contact Us</Text>
        <Text style={styles.paragraph}>
          For any questions, feedback, or legal concerns:
          📩 help.rideandhra@gmail.com
          📍 Ride Andhra Mobility Pvt. Ltd.,
          Anantapur district, Kurnool district, Kadapa district,
          Andhra Pradesh, India
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  lastUpdated: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
  },
  listItem: {
    fontSize: 16,
    lineHeight: 24,
    marginLeft: 10,
    marginBottom: 5,
  },
});

export default TermsOfServiceScreen;
