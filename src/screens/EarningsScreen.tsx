import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';


const { width } = Dimensions.get('window');

import api from '../config/api';

const EarningsScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('week');
  const [earningsData, setEarningsData] = useState({
    today: {
      amount: 0,
      labels: ['Morning', 'Afternoon', 'Evening'],
      datasets: [{ data: [0, 0, 0] }],
    },
    week: {
      amount: 0,
      labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
    },
    month: {
      amount: 0,
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{ data: [0, 0, 0, 0] }],
    },
  });

  React.useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const response = await api.get('/profile/earnings');
      if (response.data) {
        setEarningsData(response.data);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const data = earningsData[activeTab];
  const totalEarnings = data.amount; // Use pre-calculated amount from backend
  const summaryLabel = `This ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}'s Earnings`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1a202c" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Earnings</Text>
        </View>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'today' && styles.activeTab]}
            onPress={() => setActiveTab('today')}
          >
            <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'week' && styles.activeTab]}
            onPress={() => setActiveTab('week')}
          >
            <Text style={[styles.tabText, activeTab === 'week' && styles.activeTabText]}>This Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'month' && styles.activeTab]}
            onPress={() => setActiveTab('month')}
          >
            <Text style={[styles.tabText, activeTab === 'month' && styles.activeTabText]}>This Month</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{summaryLabel}</Text>
          <Text style={styles.summaryAmount}>₹{totalEarnings.toLocaleString()}</Text>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Performance</Text>
          <BarChart
            data={data}
            width={width - 80}
            height={250}
            yAxisLabel="₹"
            yAxisSuffix="" // Added this line to fix the error
            chartConfig={chartConfig}
            verticalLabelRotation={0}
            style={styles.chart}
            fromZero
            showValuesOnTopOfBars
          />
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Daily Breakdown</Text>
          {data.labels.map((day, index) => (
            <View key={index} style={styles.dayRow}>
              <Text style={styles.dayLabel}>{day}</Text>
              <Text style={styles.dayAmount}>₹{data.datasets[0].data[index].toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const chartConfig = {
  backgroundColor: '#fe7009',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(254, 112, 9, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(74, 85, 104, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#fe7009',
  },
  barPercentage: 0.7,
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 30,
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
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fe7009',
  },
  tabText: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
    color: '#4a5568',
  },
  activeTabText: {
    color: '#ffffff',
  },
  summaryCard: {
    backgroundColor: '#fe7009',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#fe7009',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  summaryLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#ffffff',
  },
  summaryAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 5,
  },
  chartContainer: {
    marginTop: 30,
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 15,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  detailsContainer: {
    marginTop: 30,
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 15,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4a5568',
  },
  dayAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a202c',
  },
});

export default EarningsScreen;
