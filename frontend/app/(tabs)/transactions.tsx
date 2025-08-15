import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { transactionsAPI } from '../../services/api';

const mockUserId = 1;

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionsAPI.getAll(mockUserId);
      if (response.success) {
        setTransactions(response.transactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Income': return '💰';
      case 'Essential': return '🏠';
      case 'Discretionary': return '🛍️';
      case 'Debt': return '💳';
      default: return '📊';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Income': return '#4CAF50';
      case 'Essential': return '#2196F3';
      case 'Discretionary': return '#FF914D';
      case 'Debt': return '#F44336';
      default: return '#666666';
    }
  };

  const renderTransaction = ({ item }: { item: any }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Text style={styles.iconText}>{getCategoryIcon(item.category)}</Text>
      </View>
      
      <View style={styles.transactionDetails}>
        <Text style={styles.merchantName}>{item.merchant}</Text>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>
      
      <View style={styles.transactionAmount}>
        <Text style={[
          styles.amountText,
          { color: item.amount > 0 ? '#4CAF50' : '#003153' }
        ]}>
          {item.amount > 0 ? '+' : ''}₹{Math.abs(item.amount).toLocaleString('en-IN')}
        </Text>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006B3F" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.subtitle}>Your financial activity</Text>
      </View>
      
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#006B3F']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
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
    color: '#006B3F',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#006B3F',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  transactionDetails: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003153',
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: '#999999',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});