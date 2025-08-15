import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { analyticsAPI } from '../../services/api';

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
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#006B3F',
  },
};

const mockUserId = 1;

interface InvestmentRecommendation {
  totalInvestment: number;
  allocation: any;
  risk_profile: string;
  emergency_fund_target: number;
  tax_saving_schemes: string[];
}

interface PortfolioAllocation {
  equity: { percentage: number; amount: number; instruments: string[] };
  debt: { percentage: number; amount: number; instruments: string[] };
  gold: { percentage: number; amount: number; instruments: string[] };
}

interface InvestmentComparison {
  [key: string]: {
    name: string;
    annual_return: number;
    final_amount: number;
    risk_level: string;
    liquidity: string;
    tax_benefit: boolean;
  };
}

export default function PlannerScreen() {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<InvestmentRecommendation | null>(null);
  const [projections, setProjections] = useState<any>(null);
  const [portfolioAllocation, setPortfolioAllocation] = useState<PortfolioAllocation | null>(null);
  const [investmentComparison, setInvestmentComparison] = useState<InvestmentComparison | null>(null);
  const [selectedTab, setSelectedTab] = useState('recommendations');
  const [comparisonAmount, setComparisonAmount] = useState(10000);
  const [comparisonYears, setComparisonYears] = useState(5);

  useEffect(() => {
    loadPlannerData();
  }, []);

  const loadPlannerData = async () => {
    try {
      setLoading(true);
      const [recData, portfolioData, comparisonData] = await Promise.all([
        analyticsAPI.getInvestmentRecommendations(mockUserId),
        analyticsAPI.getPortfolioAllocation(mockUserId, 50000),
        analyticsAPI.getInvestmentComparison(mockUserId, comparisonAmount, comparisonYears),
      ]);

      if (recData.success) {
        setRecommendations(recData.recommendations);
        setProjections(recData.projections);
      }
      if (portfolioData.success) {
        setPortfolioAllocation(portfolioData.allocation);
      }
      if (comparisonData.success) {
        setInvestmentComparison(comparisonData.comparison);
      }
    } catch (error) {
      console.error('Error loading planner data:', error);
      Alert.alert('Error', 'Failed to load investment recommendations');
    } finally {
      setLoading(false);
    }
  };

  const renderTodaysPlan = () => {
    if (!recommendations) return null;

    const dailySave = recommendations.totalInvestment / 30;
    const schemes = Object.entries(recommendations.allocation).map(([key, value]: [string, any]) => ({
      name: value.scheme,
      amount: value.amount / 30,
      percentage: value.percentage,
    }));

    return (
      <View style={styles.todaysPlanCard}>
        <Text style={styles.cardTitle}>💡 Today's Save & Invest Plan</Text>
        <Text style={styles.dailyAmount}>₹{dailySave.toFixed(0)}/day total</Text>
        
        {schemes.map((scheme, index) => (
          <View key={index} style={styles.schemeRow}>
            <Text style={styles.schemeName}>{scheme.name}</Text>
            <Text style={styles.schemeAmount}>₹{scheme.amount.toFixed(0)}/day</Text>
          </View>
        ))}
        
        <View style={styles.projectionSummary}>
          <Text style={styles.projectionText}>
            📈 In 1 year: ₹{projections?.year_1?.total_value?.toLocaleString() || '0'}
          </Text>
          <Text style={styles.projectionText}>
            📊 Extra growth: ₹{projections?.year_1?.returns?.toLocaleString() || '0'}
          </Text>
        </View>
      </View>
    );
  };

  const renderRecommendations = () => {
    if (!recommendations) return <ActivityIndicator size="large" color="#006B3F" />;

    const allocationData = Object.entries(recommendations.allocation).map(([key, value]: [string, any]) => ({
      name: value.scheme,
      population: value.percentage,
      color: getSchemeColor(key),
      legendFontColor: '#333333',
      legendFontSize: 12,
    }));

    return (
      <ScrollView style={styles.tabContent}>
        {/* Risk Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Your Investment Profile</Text>
          <View style={styles.profileCard}>
            <Text style={styles.profileTitle}>Risk Tolerance: {recommendations.risk_profile.toUpperCase()}</Text>
            <Text style={styles.profileDescription}>
              {getRiskDescription(recommendations.risk_profile)}
            </Text>
          </View>
        </View>

        {/* Portfolio Allocation Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Recommended Portfolio</Text>
          <View style={styles.chartContainer}>
            <PieChart
              data={allocationData}
              width={width - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 0]}
            />
          </View>
        </View>

        {/* Investment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Investment Breakdown</Text>
          {Object.entries(recommendations.allocation).map(([key, value]: [string, any]) => (
            <View key={key} style={styles.investmentCard}>
              <View style={styles.investmentHeader}>
                <Text style={styles.investmentName}>{value.scheme}</Text>
                <Text style={styles.investmentPercentage}>{value.percentage}%</Text>
              </View>
              <Text style={styles.investmentAmount}>₹{value.amount.toLocaleString()}/month</Text>
              <Text style={styles.investmentDescription}>
                {getSchemeDescription(key)}
              </Text>
            </View>
          ))}
        </View>

        {/* Tax Saving Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💸 Tax Saving Opportunities</Text>
          <View style={styles.taxCard}>
            <Text style={styles.taxTitle}>Section 80C Benefits</Text>
            <Text style={styles.taxDescription}>
              Save up to ₹46,800 in taxes annually by investing ₹1.5 lakh in:
            </Text>
            {recommendations.tax_saving_schemes.map((scheme, index) => (
              <Text key={index} style={styles.taxScheme}>• {scheme}</Text>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderProjections = () => {
    if (!projections) return <ActivityIndicator size="large" color="#006B3F" />;

    const years = Object.keys(projections).map(key => parseInt(key.split('_')[1]));
    const values = years.map(year => projections[`year_${year}`].total_value);
    const investments = years.map(year => projections[`year_${year}`].investment_amount);

    const lineData = {
      labels: years.map(y => `${y}Y`),
      datasets: [
        {
          data: values,
          color: (opacity = 1) => `rgba(0, 107, 63, ${opacity})`,
          strokeWidth: 3,
        },
        {
          data: investments,
          color: (opacity = 1) => `rgba(255, 159, 64, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ['With Returns', 'Investment Only'],
    };

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Growth Projections</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={lineData}
              width={width - 40}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Year-wise Breakdown</Text>
          {years.map(year => {
            const data = projections[`year_${year}`];
            return (
              <View key={year} style={styles.projectionCard}>
                <Text style={styles.projectionYear}>Year {year}</Text>
                <View style={styles.projectionRow}>
                  <Text style={styles.projectionLabel}>Total Value:</Text>
                  <Text style={styles.projectionValue}>₹{data.total_value.toLocaleString()}</Text>
                </View>
                <View style={styles.projectionRow}>
                  <Text style={styles.projectionLabel}>Invested:</Text>
                  <Text style={styles.projectionValue}>₹{data.investment_amount.toLocaleString()}</Text>
                </View>
                <View style={styles.projectionRow}>
                  <Text style={styles.projectionLabel}>Returns:</Text>
                  <Text style={styles.projectionGain}>₹{data.returns.toLocaleString()}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const renderComparison = () => {
    if (!investmentComparison) return <ActivityIndicator size="large" color="#006B3F" />;

    const comparisonData = Object.values(investmentComparison).map((option, index) => ({
      name: option.name.split(' ')[0],
      value: option.final_amount,
      color: getComparisonColor(index),
    }));

    const barData = {
      labels: comparisonData.map(item => item.name),
      datasets: [{
        data: comparisonData.map(item => item.value),
      }],
    };

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚖️ Investment Comparison</Text>
          <Text style={styles.comparisonSubtitle}>
            ₹{comparisonAmount.toLocaleString()} invested for {comparisonYears} years
          </Text>
          
          <View style={styles.chartContainer}>
            <BarChart
              data={barData}
              width={width - 40}
              height={220}
              chartConfig={{
                ...chartConfig,
                barPercentage: 0.7,
              }}
              style={styles.chart}
              yAxisLabel="₹"
              yAxisSuffix=""
              showValuesOnTopOfBars
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Detailed Comparison</Text>
          {Object.entries(investmentComparison).map(([key, option]) => (
            <View key={key} style={styles.comparisonCard}>
              <Text style={styles.comparisonName}>{option.name}</Text>
              <View style={styles.comparisonDetails}>
                <Text style={styles.comparisonFinal}>₹{option.final_amount.toLocaleString()}</Text>
                <Text style={styles.comparisonReturn}>{option.annual_return}% p.a.</Text>
              </View>
              <View style={styles.comparisonMeta}>
                <Text style={styles.comparisonRisk}>Risk: {option.risk_level}</Text>
                <Text style={styles.comparisonLiquidity}>Liquidity: {option.liquidity}</Text>
                {option.tax_benefit && <Text style={styles.comparisonTax}>Tax Benefit ✓</Text>}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006B3F" />
          <Text style={styles.loadingText}>Loading investment recommendations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Financial Planner</Text>
          <Text style={styles.subtitle}>Smart investing for your goals</Text>
        </View>

        {/* Today's Plan */}
        {renderTodaysPlan()}

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {[
            { id: 'recommendations', label: 'Recommendations', icon: '🎯' },
            { id: 'projections', label: 'Projections', icon: '📈' },
            { id: 'comparison', label: 'Compare', icon: '⚖️' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, selectedTab === tab.id && styles.activeTab]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, selectedTab === tab.id && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {selectedTab === 'recommendations' && renderRecommendations()}
        {selectedTab === 'projections' && renderProjections()}
        {selectedTab === 'comparison' && renderComparison()}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper functions
function getSchemeColor(scheme: string): string {
  const colors: { [key: string]: string } = {
    emergency_fund: '#4CAF50',
    ppf: '#2196F3',
    elss: '#FF9800',
    nps: '#9C27B0',
    gold_etf: '#FFD700',
  };
  return colors[scheme] || '#006B3F';
}

function getComparisonColor(index: number): string {
  const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#FFD700'];
  return colors[index % colors.length];
}

function getRiskDescription(riskProfile: string): string {
  const descriptions = {
    aggressive: 'Higher growth potential with more market volatility. Suitable for long-term goals.',
    moderate: 'Balanced approach with moderate risk and steady growth. Good for medium-term goals.',
    conservative: 'Lower risk with guaranteed returns. Ideal for capital preservation.',
  };
  return descriptions[riskProfile as keyof typeof descriptions] || '';
}

function getSchemeDescription(scheme: string): string {
  const descriptions = {
    emergency_fund: 'High liquidity for emergencies. Keep in savings account.',
    ppf: '15-year lock-in with guaranteed 7.1% returns. Tax-free.',
    elss: '3-year lock-in with potential 12%+ returns. Tax-saving.',
    nps: 'Retirement-focused with 10% expected returns. Tax benefits.',
    gold_etf: 'Digital gold for portfolio diversification. 8% expected returns.',
  };
  return descriptions[scheme as keyof typeof descriptions] || '';
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
  todaysPlanCard: {
    backgroundColor: '#006B3F',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  dailyAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  schemeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  schemeName: {
    fontSize: 14,
    color: '#E8F5E8',
  },
  schemeAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  projectionSummary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  projectionText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 8,
  },
  profileDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  chartContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chart: {
    borderRadius: 16,
  },
  investmentCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  investmentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003153',
  },
  investmentPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#006B3F',
  },
  investmentAmount: {
    fontSize: 14,
    color: '#006B3F',
    marginBottom: 8,
  },
  investmentDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  taxCard: {
    backgroundColor: '#E8F5E8',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
  },
  taxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 8,
  },
  taxDescription: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 12,
    lineHeight: 20,
  },
  taxScheme: {
    fontSize: 14,
    color: '#006B3F',
    marginBottom: 4,
  },
  projectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  projectionYear: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 12,
  },
  projectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  projectionLabel: {
    fontSize: 14,
    color: '#666666',
  },
  projectionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#003153',
  },
  projectionGain: {
    fontSize: 14,
    fontWeight: '600',
    color: '#006B3F',
  },
  comparisonSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  comparisonCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  comparisonName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 8,
  },
  comparisonDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  comparisonFinal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#006B3F',
  },
  comparisonReturn: {
    fontSize: 14,
    color: '#666666',
  },
  comparisonMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  comparisonRisk: {
    fontSize: 12,
    color: '#666666',
    marginRight: 16,
  },
  comparisonLiquidity: {
    fontSize: 12,
    color: '#666666',
    marginRight: 16,
  },
  comparisonTax: {
    fontSize: 12,
    color: '#006B3F',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
});