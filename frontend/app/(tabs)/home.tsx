import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyticsAPI, transactionsAPI } from '../../services/api';

const mockUserId = 1; // In real app, get from AsyncStorage

export default function HomeScreen() {
  const [safeSave, setSafeSave] = useState<any>(null);
  const [projection, setProjection] = useState<any>(null);
  const [investmentPlan, setInvestmentPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [safeSaveData, projectionData, investmentData] = await Promise.all([
        analyticsAPI.getSafeSave(mockUserId),
        analyticsAPI.getProjection(mockUserId),
        analyticsAPI.getInvestmentRecommendations(mockUserId),
      ]);

      if (safeSaveData.success) {
        setSafeSave(safeSaveData.recommendation);
      }
      if (projectionData.success) {
        setProjection(projectionData.projection);
      }
      if (investmentData.success) {
        setInvestmentPlan(investmentData.recommendations);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNow = async () => {
    try {
      const amount = safeSave?.amount || 15;
      await transactionsAPI.add({
        user_id: mockUserId,
        amount: -amount,
        category: 'Essential',
        merchant: 'MicroSave',
        description: 'Daily savings contribution',
      });
      Alert.alert('Success', `₹${amount} saved successfully!`);
      loadData(); // Refresh data
    } catch (error) {
      Alert.alert('Error', 'Failed to save money');
    }
  };

  const handleGenerateFresh = async () => {
    try {
      await transactionsAPI.generateFresh(mockUserId, 25);
      Alert.alert('Success', 'Fresh transaction data generated!');
      loadData(); // Refresh data
    } catch (error) {
      Alert.alert('Error', 'Failed to generate fresh data');
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'High': return '#4CAF50';
      case 'Medium': return '#FF914D';
      case 'Low': return '#F44336';
      default: return '#666666';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006B3F" />
          <Text style={styles.loadingText}>Loading your recommendations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.greeting}>Good morning! 👋</Text>
            <Text style={styles.headerTitle}>Your Smart Savings Dashboard</Text>
          </View>

          {/* Safe Save Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Today's Safe Save</Text>
              {safeSave && (
                <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(safeSave.confidence) }]}>
                  <Text style={styles.confidenceText}>{safeSave.confidence}</Text>
                </View>
              )}
            </View>
            
            {safeSave ? (
              <>
                <Text style={styles.saveAmount}>₹{safeSave.amount}</Text>
                <Text style={styles.saveReasoning}>{safeSave.reasoning}</Text>
                
                <View style={styles.alternatives}>
                  <Text style={styles.alternativesTitle}>Other options:</Text>
                  <View style={styles.alternativeOptions}>
                    <View style={styles.alternativeOption}>
                      <Text style={styles.alternativeLabel}>Conservative</Text>
                      <Text style={styles.alternativeAmount}>₹{safeSave.alternatives.conservative}</Text>
                    </View>
                    <View style={styles.alternativeOption}>
                      <Text style={styles.alternativeLabel}>Moderate</Text>
                      <Text style={styles.alternativeAmount}>₹{safeSave.alternatives.moderate}</Text>
                    </View>
                    <View style={styles.alternativeOption}>
                      <Text style={styles.alternativeLabel}>Aggressive</Text>
                      <Text style={styles.alternativeAmount}>₹{safeSave.alternatives.aggressive}</Text>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.noData}>Unable to load recommendation</Text>
            )}
          </View>

          {/* Goal Projection Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Goal Progress</Text>
            {projection ? (
              <>
                {projection.goal_date ? (
                  <>
                    <Text style={styles.projectionMessage}>{projection.message}</Text>
                    <View style={styles.projectionStats}>
                      <View style={styles.projectionStat}>
                        <Text style={styles.projectionLabel}>Months to Goal</Text>
                        <Text style={styles.projectionValue}>{projection.months_to_goal}</Text>
                      </View>
                      <View style={styles.projectionStat}>
                        <Text style={styles.projectionLabel}>Current Savings</Text>
                        <Text style={styles.projectionValue}>₹{projection.projected_amount}</Text>
                      </View>
                    </View>
                    
                    {projection.improvement_impact && (
                      <View style={styles.improvementCard}>
                        <Text style={styles.improvementTitle}>💡 Improvement Tip</Text>
                        <Text style={styles.improvementText}>
                          By saving ₹{projection.improvement_impact.improved_weekly_savings} weekly, 
                          you could reach your goal {projection.improvement_impact.months_sooner} months sooner!
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.noData}>{projection.message}</Text>
                )}
              </>
            ) : (
              <Text style={styles.noData}>Unable to load projection</Text>
            )}
          </View>

          {/* Today's Save & Invest Plan Card */}
          {investmentPlan && (
            <View style={styles.investmentCard}>
              <Text style={styles.cardTitle}>💡 Today's Save & Invest Plan</Text>
              <Text style={styles.dailyTotal}>
                ₹{Math.round(investmentPlan.totalInvestment / 30)}/day total
              </Text>
              
              <View style={styles.investmentBreakdown}>
                {Object.entries(investmentPlan.allocation).map(([key, value]: [string, any], index) => (
                  <View key={index} style={styles.investmentRow}>
                    <Text style={styles.investmentScheme}>{value.scheme}</Text>
                    <Text style={styles.investmentAmount}>₹{Math.round(value.amount / 30)}/day</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.investmentFooter}>
                <View style={styles.investmentBenefit}>
                  <Text style={styles.benefitText}>📈 Tax savings up to ₹46,800/year</Text>
                  <Text style={styles.benefitText}>📊 Expected growth: {investmentPlan.risk_profile} risk</Text>
                </View>
                <TouchableOpacity style={styles.learnMoreButton}>
                  <Text style={styles.learnMoreText}>Learn More →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.primaryAction} onPress={handleSaveNow}>
                <Text style={styles.primaryActionText}>💰 Save Now</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryAction} onPress={handleGenerateFresh}>
                <Text style={styles.secondaryActionText}>🔄 Fresh Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 18,
    color: '#003153',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003153',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003153',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  saveAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#006B3F',
    marginBottom: 8,
  },
  saveReasoning: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  alternatives: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
  },
  alternativesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#003153',
    marginBottom: 8,
  },
  alternativeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alternativeOption: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  alternativeLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  alternativeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#006B3F',
  },
  projectionMessage: {
    fontSize: 16,
    color: '#003153',
    marginBottom: 16,
    lineHeight: 22,
  },
  projectionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  projectionStat: {
    flex: 1,
    alignItems: 'center',
  },
  projectionLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  projectionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#006B3F',
  },
  improvementCard: {
    backgroundColor: '#F0F8F5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  improvementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 4,
  },
  improvementText: {
    fontSize: 12,
    color: '#003153',
    lineHeight: 16,
  },
  quickActions: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: '#006B3F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#006B3F',
  },
  secondaryActionText: {
    color: '#006B3F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noData: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  investmentCard: {
    backgroundColor: '#006B3F',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dailyTotal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  investmentBreakdown: {
    marginBottom: 16,
  },
  investmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  investmentScheme: {
    fontSize: 14,
    color: '#E8F5E8',
    flex: 1,
  },
  investmentAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  investmentFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  investmentBenefit: {
    flex: 1,
  },
  benefitText: {
    fontSize: 12,
    color: '#E8F5E8',
    marginBottom: 4,
  },
  learnMoreButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  learnMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});