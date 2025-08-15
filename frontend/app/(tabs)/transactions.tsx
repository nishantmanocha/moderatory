import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { transactionsAPI, analyticsAPI } from '../../services/api';

const { width } = Dimensions.get('window');
const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 107, 63, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 49, 83, ${opacity})`,
  style: {
    borderRadius: 16,
  },
};

const mockUserId = 1;

interface Transaction {
  id: number;
  amount: number;
  category: string;
  merchant: string;
  description: string;
  date: string;
}

interface SpendingInsights {
  total_spent: number;
  daily_average: number;
  category_breakdown: Array<{
    category: string;
    total_amount: number;
    percentage: string;
    transaction_count: number;
  }>;
  top_merchants: Array<{
    merchant: string;
    total_spent: number;
    transaction_count: number;
  }>;
  recommendations: Array<{
    type: string;
    message: string;
    potential_savings: number;
  }>;
}

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<SpendingInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionData, insightsData] = await Promise.all([
        transactionsAPI.getAll(mockUserId, 50),
        analyticsAPI.getSpendingInsights(mockUserId, selectedPeriod),
      ]);

      if (transactionData.success) {
        setTransactions(transactionData.transactions);
      }
      if (insightsData.success) {
        setInsights(insightsData.insights);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load transaction data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFresh = async () => {
    try {
      setLoading(true);
      await transactionsAPI.generateFresh(mockUserId, 25);
      await loadData();
      Alert.alert('Success', 'Fresh transaction data generated!');
    } catch (error) {
      console.error('Error generating fresh data:', error);
      Alert.alert('Error', 'Failed to generate fresh data');
    }
  };

  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      'Food & Dining': '🍽️',
      'Shopping': '🛒',
      'Transportation': '🚗',
      'Bills & Utilities': '💡',
      'Health & Medical': '🏥',
      'Entertainment': '🎬',
      'Discretionary': '💸',
      'Essential': '🏠',
      'Income': '💰',
    };
    return icons[category] || '📝';
  };

  const getCategoryColor = (index: number): string => {
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#FFD700', '#F44336', '#607D8B', '#795548'];
    return colors[index % colors.length];
  };

  const renderSpendingOverview = () => {
    if (!insights || insights.category_breakdown.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No spending data available</Text>
        </View>
      );
    }

    const pieData = insights.category_breakdown.map((category, index) => ({
      name: category.category,
      population: category.total_amount,
      color: getCategoryColor(index),
      legendFontColor: '#333333',
      legendFontSize: 12,
    }));

    return (
      <ScrollView style={styles.tabContent}>
        {/* Spending Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📊 Spending Summary ({selectedPeriod} days)</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Spent</Text>
              <Text style={styles.summaryValue}>₹{insights.total_spent.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Daily Average</Text>
              <Text style={styles.summaryValue}>₹{Math.round(insights.daily_average)}</Text>
            </View>
          </View>
        </View>

        {/* Category Breakdown Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>💸 Spending by Category</Text>
          <View style={styles.chartContainer}>
            <PieChart
              data={pieData}
              width={width - 60}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 0]}
            />
          </View>
        </View>

        {/* Category Details */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>📋 Category Breakdown</Text>
          {insights.category_breakdown.map((category, index) => (
            <View key={category.category} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryIcon}>{getCategoryIcon(category.category)}</Text>
                  <View style={styles.categoryDetails}>
                    <Text style={styles.categoryName}>{category.category}</Text>
                    <Text style={styles.categoryCount}>{category.transaction_count} transactions</Text>
                  </View>
                </View>
                <View style={styles.categoryAmount}>
                  <Text style={styles.categoryTotal}>₹{category.total_amount.toLocaleString()}</Text>
                  <Text style={styles.categoryPercentage}>{category.percentage}%</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderActionableTips = () => {
    if (!insights || insights.recommendations.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No recommendations available</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent}>
        {/* Potential Savings */}
        <View style={styles.savingsCard}>
          <Text style={styles.savingsTitle}>💰 Potential Monthly Savings</Text>
          <Text style={styles.savingsAmount}>
            ₹{insights.recommendations.reduce((sum, rec) => sum + rec.potential_savings, 0).toLocaleString()}
          </Text>
          <Text style={styles.savingsDescription}>
            Based on your spending patterns, here's how you can save more:
          </Text>
        </View>

        {/* Recommendations */}
        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>🎯 Actionable Suggestions</Text>
          {insights.recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationCard}>
              <View style={styles.recommendationHeader}>
                <Text style={styles.recommendationIcon}>💡</Text>
                <Text style={styles.recommendationType}>
                  {recommendation.type.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              <Text style={styles.recommendationMessage}>{recommendation.message}</Text>
              <View style={styles.recommendationFooter}>
                <Text style={styles.potentialSaving}>
                  Potential savings: ₹{recommendation.potential_savings.toLocaleString()}/month
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Top Spending Merchants */}
        {insights.top_merchants.length > 0 && (
          <View style={styles.merchantSection}>
            <Text style={styles.sectionTitle}>🏪 Top Spending Merchants</Text>
            {insights.top_merchants.slice(0, 5).map((merchant, index) => (
              <View key={index} style={styles.merchantCard}>
                <View style={styles.merchantInfo}>
                  <Text style={styles.merchantName}>{merchant.merchant}</Text>
                  <Text style={styles.merchantCount}>{merchant.transaction_count} visits</Text>
                </View>
                <Text style={styles.merchantAmount}>₹{merchant.total_spent.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Smart Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>🧠 Smart Money Tips</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>50/30/20 Rule</Text>
            <Text style={styles.tipDescription}>
              Allocate 50% for needs, 30% for wants, and 20% for savings and debt repayment.
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>The 24-Hour Rule</Text>
            <Text style={styles.tipDescription}>
              Wait 24 hours before making non-essential purchases to avoid impulse buying.
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>Track Small Expenses</Text>
            <Text style={styles.tipDescription}>
              Small daily expenses like coffee and snacks can add up to significant amounts monthly.
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderRecentTransactions = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>📋 Recent Transactions</Text>
        {transactions.slice(0, 20).map((transaction) => (
          <View key={transaction.id} style={styles.transactionCard}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionIcon}>{getCategoryIcon(transaction.category)}</Text>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionMerchant}>{transaction.merchant}</Text>
                <Text style={styles.transactionDescription}>{transaction.description}</Text>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.date).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <View style={styles.transactionAmount}>
              <Text style={[
                styles.transactionValue,
                { color: transaction.amount < 0 ? '#F44336' : '#4CAF50' }
              ]}>
                {transaction.amount < 0 ? '-' : '+'}₹{Math.abs(transaction.amount)}
              </Text>
              <Text style={styles.transactionCategory}>{transaction.category}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.generateButton} onPress={handleGenerateFresh}>
        <Text style={styles.generateButtonText}>🔄 Generate Fresh Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006B3F" />
          <Text style={styles.loadingText}>Analyzing your transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transaction Analysis</Text>
        <Text style={styles.subtitle}>Smart insights from your spending</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {[7, 30, 90].map((days) => (
          <TouchableOpacity
            key={days}
            style={[
              styles.periodButton,
              selectedPeriod === days && styles.activePeriodButton,
            ]}
            onPress={() => setSelectedPeriod(days)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === days && styles.activePeriodButtonText,
            ]}>
              {days} days
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'insights', label: 'Insights', icon: '💡' },
          { id: 'transactions', label: 'History', icon: '📋' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderSpendingOverview()}
      {activeTab === 'insights' && renderActionableTips()}
      {activeTab === 'transactions' && renderRecentTransactions()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#006B3F',
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  activePeriodButton: {
    backgroundColor: '#006B3F',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activePeriodButtonText: {
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#006B3F',
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabLabel: {
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#006B3F',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
  },
  categorySection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003153',
  },
  categoryCount: {
    fontSize: 12,
    color: '#666666',
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  categoryTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#006B3F',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#666666',
  },
  savingsCard: {
    backgroundColor: '#E8F5E8',
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  savingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 8,
  },
  savingsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#006B3F',
    marginBottom: 8,
  },
  savingsDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  recommendationsSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  recommendationType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#006B3F',
  },
  recommendationMessage: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 8,
  },
  recommendationFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  potentialSaving: {
    fontSize: 12,
    fontWeight: '600',
    color: '#006B3F',
  },
  merchantSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  merchantCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003153',
  },
  merchantCount: {
    fontSize: 12,
    color: '#666666',
  },
  merchantAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#006B3F',
  },
  tipsSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 8,
  },
  tipDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  transactionsSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  transactionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionMerchant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003153',
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666666',
    marginVertical: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999999',
  },
  transactionAmount: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  transactionValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  generateButton: {
    backgroundColor: '#006B3F',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});