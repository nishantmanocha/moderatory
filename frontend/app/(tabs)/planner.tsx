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

interface GoalPlanning {
  user_profile: {
    monthly_income: number;
    monthly_expenses: number;
    disposable_income: number;
    savings_goal: number;
    age: number;
  };
  savings_capacity: {
    recommended_rate: string;
    monthly_capacity: number;
    daily_capacity: number;
  };
  savings_only_plan: {
    monthly_amount: number;
    daily_amount: number;
    months: number;
    years: number;
    remaining_months: number;
    achievable: boolean;
    progression: Array<{ month: number; total: number }>;
  };
  savings_investing_plan: {
    risk_profile: string;
    monthly_savings: number;
    monthly_investment: number;
    total_monthly: number;
    expected_return: number;
    months: number;
    years: number;
    remaining_months: number;
    investment_options: Array<{
      name: string;
      allocation: string;
      expected_return: string;
      risk: string;
      monthly_amount: number;
      description: string;
    }>;
    progression: Array<{ month: number; savings_total: number; investment_total: number; cumulative_total: number }>;
  };
  tax_optimization: {
    annual_investment: number;
    section_80c_deduction: number;
    nps_additional_deduction: number;
    total_tax_saved: number;
    net_investment_cost: number;
    effective_return_boost: string;
    recommendations: string[];
  };
  timeline_comparison: {
    savings_only: Array<{ month: number; total: number }>;
    savings_investing: Array<{ month: number; total: number }>;
    goal_amount: number;
  };
  time_saved: {
    total_months: number;
    years: number;
    months: number;
    percentage_faster: number;
  };
  recommended_first_step: {
    action: string;
    description: string;
    amount: string;
    priority: string;
  };
  summary: {
    time_saved: string;
    key_benefit: string;
    recommended_action: string;
    next_step: string;
    motivation: string;
  };
}

export default function PlannerScreen() {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<InvestmentRecommendation | null>(null);
  const [projections, setProjections] = useState<any>(null);
  const [portfolioAllocation, setPortfolioAllocation] = useState<PortfolioAllocation | null>(null);
  const [investmentComparison, setInvestmentComparison] = useState<InvestmentComparison | null>(null);
  const [goalPlanning, setGoalPlanning] = useState<GoalPlanning | null>(null);
  const [selectedTab, setSelectedTab] = useState('goal-planning');
  const [comparisonAmount, setComparisonAmount] = useState(10000);
  const [comparisonYears, setComparisonYears] = useState(5);

  useEffect(() => {
    loadPlannerData();
  }, []);

  const loadPlannerData = async () => {
    try {
      setLoading(true);
      const [recData, portfolioData, comparisonData, goalData] = await Promise.all([
        analyticsAPI.getInvestmentRecommendations(mockUserId),
        analyticsAPI.getPortfolioAllocation(mockUserId, 50000),
        analyticsAPI.getInvestmentComparison(mockUserId, comparisonAmount, comparisonYears),
        analyticsAPI.getGoalPlanning(mockUserId),
      ]);

      if (recData?.success && recData.recommendations) {
        setRecommendations(recData.recommendations);
        setProjections(recData.projections);
      }
      if (portfolioData?.success && portfolioData.allocation) {
        setPortfolioAllocation(portfolioData.allocation);
      }
      if (comparisonData?.success && comparisonData.comparison) {
        setInvestmentComparison(comparisonData.comparison);
      }
      if (goalData?.success && goalData.goal_planning) {
        setGoalPlanning(goalData.goal_planning);
      }
    } catch (error) {
      console.error('Error loading planner data:', error);
      Alert.alert('Error', 'Failed to load investment recommendations');
    } finally {
      setLoading(false);
    }
  };

  const renderTodaysPlan = () => {
    if (!recommendations || !recommendations.totalInvestment || !recommendations.allocation) return null;

    const dailySave = (recommendations.totalInvestment || 0) / 30;
    const schemes = Object.entries(recommendations.allocation || {}).map(([key, value]: [string, any]) => ({
      name: value?.scheme || 'Investment',
      amount: (value?.amount || 0) / 30,
      percentage: value?.percentage || 0,
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
    if (!recommendations || !recommendations.allocation) return <ActivityIndicator size="large" color="#006B3F" />;

    const allocationData = Object.entries(recommendations.allocation || {}).map(([key, value]: [string, any]) => ({
      name: value?.scheme || 'Investment',
      population: value?.percentage || 0,
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
            <Text style={styles.profileTitle}>Risk Tolerance: {(recommendations.risk_profile || 'moderate').toUpperCase()}</Text>
            <Text style={styles.profileDescription}>
              {getRiskDescription(recommendations.risk_profile || 'moderate')}
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
          {Object.entries(recommendations.allocation || {}).map(([key, value]: [string, any]) => (
            <View key={key} style={styles.investmentCard}>
              <View style={styles.investmentHeader}>
                <Text style={styles.investmentName}>{value?.scheme || 'Investment'}</Text>
                <Text style={styles.investmentPercentage}>{value?.percentage || 0}%</Text>
              </View>
              <Text style={styles.investmentAmount}>₹{(value?.amount || 0).toLocaleString()}/month</Text>
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
            {(recommendations.tax_saving_schemes || []).map((scheme, index) => (
              <Text key={index} style={styles.taxScheme}>• {scheme}</Text>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderProjections = () => {
    if (!projections) return <ActivityIndicator size="large" color="#006B3F" />;

    try {
      const years = Object.keys(projections || {}).map(key => parseInt(key.split('_')[1])).filter(year => !isNaN(year));
      
      if (years.length === 0) {
        return (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No projection data available</Text>
          </View>
        );
      }

      const values = years.map(year => projections[`year_${year}`]?.total_value || 0);
      const investments = years.map(year => projections[`year_${year}`]?.investment_amount || 0);

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
              const data = projections[`year_${year}`] || {};
              return (
                <View key={year} style={styles.projectionCard}>
                  <Text style={styles.projectionYear}>Year {year}</Text>
                  <View style={styles.projectionRow}>
                    <Text style={styles.projectionLabel}>Total Value:</Text>
                    <Text style={styles.projectionValue}>₹{(data.total_value || 0).toLocaleString()}</Text>
                  </View>
                  <View style={styles.projectionRow}>
                    <Text style={styles.projectionLabel}>Invested:</Text>
                    <Text style={styles.projectionValue}>₹{(data.investment_amount || 0).toLocaleString()}</Text>
                  </View>
                  <View style={styles.projectionRow}>
                    <Text style={styles.projectionLabel}>Returns:</Text>
                    <Text style={styles.projectionGain}>₹{(data.returns || 0).toLocaleString()}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      );
    } catch (error) {
      console.error('Error rendering projections:', error);
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>Error loading projections</Text>
        </View>
      );
    }
  };

  const renderComparison = () => {
    if (!investmentComparison) return <ActivityIndicator size="large" color="#006B3F" />;

    try {
      const comparisonData = Object.values(investmentComparison || {}).map((option, index) => ({
        name: (option?.name || 'Investment').split(' ')[0],
        value: option?.final_amount || 0,
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
            {Object.entries(investmentComparison || {}).map(([key, option]) => (
              <View key={key} style={styles.comparisonCard}>
                <Text style={styles.comparisonName}>{option?.name || 'Investment Option'}</Text>
                <View style={styles.comparisonDetails}>
                  <Text style={styles.comparisonFinal}>₹{(option?.final_amount || 0).toLocaleString()}</Text>
                  <Text style={styles.comparisonReturn}>{option?.annual_return || 0}% p.a.</Text>
                </View>
                <View style={styles.comparisonMeta}>
                  <Text style={styles.comparisonRisk}>Risk: {option?.risk_level || 'Medium'}</Text>
                  <Text style={styles.comparisonLiquidity}>Liquidity: {option?.liquidity || 'Medium'}</Text>
                  {option?.tax_benefit && <Text style={styles.comparisonTax}>Tax Benefit ✓</Text>}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      );
    } catch (error) {
      console.error('Error rendering comparison:', error);
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>Error loading comparison data</Text>
        </View>
      );
    }
  };

  const renderGoalPlanning = () => {
    if (!goalPlanning) return <ActivityIndicator size="large" color="#006B3F" />;

    try {
      // Add safety checks for all data
      const userProfile = goalPlanning.user_profile || {};
      const savingsOnlyPlan = goalPlanning.savings_only_plan || {};
      const savingsInvestingPlan = goalPlanning.savings_investing_plan || {};
      const taxOptimization = goalPlanning.tax_optimization || {};
      const timeSaved = goalPlanning.time_saved || {};
      const recommendedFirstStep = goalPlanning.recommended_first_step || {};
      const summary = goalPlanning.summary || {};
      const timelineComparison = goalPlanning.timeline_comparison || { savings_only: [], savings_investing: [] };

      // Safe data for charts
      const chartData = timelineComparison.savings_only?.length > 0 && timelineComparison.savings_investing?.length > 0;
      
      const timelineData = chartData ? {
        labels: timelineComparison.savings_only.slice(0, 24).map((_, index) => 
          index % 6 === 0 ? `${Math.floor(index / 12)}Y${index % 12}M` : ''
        ),
        datasets: [
          {
            data: timelineComparison.savings_only.slice(0, 24).map(item => item?.total || 0),
            color: (opacity = 1) => `rgba(255, 159, 64, ${opacity})`,
            strokeWidth: 2,
          },
          {
            data: timelineComparison.savings_investing.slice(0, 24).map(item => item?.total || 0),
            color: (opacity = 1) => `rgba(0, 107, 63, ${opacity})`,
            strokeWidth: 3,
          },
        ],
        legend: ['Savings Only', 'Savings + Investing'],
      } : null;

      return (
        <ScrollView style={styles.tabContent}>
          {/* User Profile & Disposable Income */}
          <View style={styles.profileSummaryCard}>
            <Text style={styles.profileSummaryTitle}>💰 Your Financial Profile</Text>
            <View style={styles.profileGrid}>
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Monthly Income</Text>
                <Text style={styles.profileValue}>₹{(userProfile.monthly_income || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Monthly Expenses</Text>
                <Text style={styles.profileValue}>₹{(userProfile.monthly_expenses || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Disposable Income</Text>
                <Text style={styles.profileValueHighlight}>₹{(userProfile.disposable_income || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Savings Goal</Text>
                <Text style={styles.profileValue}>₹{(userProfile.savings_goal || 0).toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* Plan Comparison */}
          <View style={styles.planComparisonCard}>
            <Text style={styles.planComparisonTitle}>📊 Savings vs Investing Comparison</Text>
            
            <View style={styles.plansContainer}>
              {/* Savings Only Plan */}
              <View style={styles.planCard}>
                <Text style={styles.planTitle}>💰 Savings Only Plan</Text>
                <Text style={styles.planAmount}>₹{(savingsOnlyPlan.monthly_amount || 0).toLocaleString()}/month</Text>
                <Text style={styles.planDuration}>
                  {savingsOnlyPlan.years || 0} years, {savingsOnlyPlan.remaining_months || 0} months
                </Text>
                <Text style={styles.planNote}>
                  {savingsOnlyPlan.achievable ? '✅ Achievable' : '❌ Too slow'}
                </Text>
              </View>

              {/* Savings + Investing Plan */}
              <View style={[styles.planCard, styles.investingPlan]}>
                <Text style={styles.planTitle}>🚀 Savings + Investing Plan</Text>
                <View style={styles.planBreakdown}>
                  <Text style={styles.planSubAmount}>Savings: ₹{(savingsInvestingPlan.monthly_savings || 0).toLocaleString()}</Text>
                  <Text style={styles.planSubAmount}>Investing: ₹{(savingsInvestingPlan.monthly_investment || 0).toLocaleString()}</Text>
                </View>
                <Text style={styles.planAmount}>₹{(savingsInvestingPlan.total_monthly || 0).toLocaleString()}/month total</Text>
                <Text style={styles.planDuration}>
                  {savingsInvestingPlan.years || 0} years, {savingsInvestingPlan.remaining_months || 0} months
                </Text>
                <Text style={styles.planNote}>⚡ {timeSaved.percentage_faster || 0}% faster</Text>
              </View>
            </View>

            {/* Time Saved Highlight */}
            <View style={styles.timeSavedCard}>
              <Text style={styles.timeSavedTitle}>⏰ Time Saved by Investing</Text>
              <Text style={styles.timeSavedAmount}>{summary.time_saved || 'Calculating...'}</Text>
              <Text style={styles.timeSavedDescription}>{summary.key_benefit || 'Smart investing helps reach goals faster'}</Text>
            </View>
          </View>

          {/* Timeline Comparison Chart */}
          {chartData && timelineData && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>📈 Growth Timeline Comparison</Text>
              <View style={styles.chartContainer}>
                <LineChart
                  data={timelineData}
                  width={width - 40}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </View>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#FF9F40' }]} />
                  <Text style={styles.legendText}>Savings Only</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#006B3F' }]} />
                  <Text style={styles.legendText}>Savings + Investing</Text>
                </View>
              </View>
            </View>
          )}

          {/* Investment Options */}
          {savingsInvestingPlan.investment_options && savingsInvestingPlan.investment_options.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💼 Recommended Investment Mix</Text>
              <Text style={styles.riskProfileText}>
                Risk Profile: {(savingsInvestingPlan.risk_profile || 'moderate').toUpperCase()} 
                ({savingsInvestingPlan.expected_return || 8}% expected return)
              </Text>
              {savingsInvestingPlan.investment_options.map((option, index) => (
                <View key={index} style={styles.investmentOptionCard}>
                  <View style={styles.optionHeader}>
                    <Text style={styles.optionName}>{option?.name || 'Investment Option'}</Text>
                    <Text style={styles.optionAllocation}>{option?.allocation || '0%'}</Text>
                  </View>
                  <Text style={styles.optionAmount}>₹{(option?.monthly_amount || 0).toLocaleString()}/month</Text>
                  <Text style={styles.optionReturn}>Expected: {option?.expected_return || '0%'} | Risk: {option?.risk || 'Medium'}</Text>
                  <Text style={styles.optionDescription}>{option?.description || 'Investment description'}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Tax Optimization */}
          <View style={styles.taxOptimizationCard}>
            <Text style={styles.taxTitle}>💸 Tax Optimization Benefits</Text>
            <View style={styles.taxStats}>
              <View style={styles.taxStat}>
                <Text style={styles.taxLabel}>Annual Investment</Text>
                <Text style={styles.taxValue}>₹{(taxOptimization.annual_investment || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.taxStat}>
                <Text style={styles.taxLabel}>Tax Saved</Text>
                <Text style={styles.taxValueHighlight}>₹{(taxOptimization.total_tax_saved || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.taxStat}>
                <Text style={styles.taxLabel}>Net Cost</Text>
                <Text style={styles.taxValue}>₹{(taxOptimization.net_investment_cost || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.taxStat}>
                <Text style={styles.taxLabel}>Effective Boost</Text>
                <Text style={styles.taxValueHighlight}>{taxOptimization.effective_return_boost || '+0%'}</Text>
              </View>
            </View>
            
            {taxOptimization.recommendations && taxOptimization.recommendations.length > 0 && (
              <View style={styles.taxRecommendations}>
                <Text style={styles.taxRecommendationsTitle}>💡 Tax-Saving Tips:</Text>
                {taxOptimization.recommendations.map((rec, index) => (
                  <Text key={index} style={styles.taxRecommendation}>• {rec}</Text>
                ))}
              </View>
            )}
          </View>

          {/* Recommended First Step */}
          <View style={styles.firstStepCard}>
            <Text style={styles.firstStepTitle}>🎯 Your Recommended First Step</Text>
            <Text style={styles.firstStepAction}>{recommendedFirstStep.action || 'Start Investing'}</Text>
            <Text style={styles.firstStepAmount}>{recommendedFirstStep.amount || '₹5,000/month'}</Text>
            <Text style={styles.firstStepDescription}>{recommendedFirstStep.description || 'Begin your investment journey'}</Text>
            <Text style={styles.firstStepPriority}>Priority: {recommendedFirstStep.priority || 'Medium'}</Text>
          </View>

          {/* Friendly Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>🎉 Summary</Text>
            <Text style={styles.summaryMotivation}>{summary.motivation || '💡 Every step towards financial freedom counts!'}</Text>
            <Text style={styles.summaryNextStep}>{summary.next_step || 'Start with small, consistent investments'}</Text>
          </View>
        </ScrollView>
      );
    } catch (error) {
      console.error('Error rendering goal planning:', error);
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>Error loading goal planning data</Text>
        </View>
      );
    }
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
            { id: 'goal-planning', label: 'Goal Planning', icon: '🎯' },
            { id: 'recommendations', label: 'Portfolio', icon: '📊' },
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
        {selectedTab === 'goal-planning' && renderGoalPlanning()}
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
  return descriptions[riskProfile as keyof typeof descriptions] || 'Balanced approach with moderate risk and steady growth.';
}

function getSchemeDescription(scheme: string): string {
  const descriptions = {
    emergency_fund: 'High liquidity for emergencies. Keep in savings account.',
    ppf: '15-year lock-in with guaranteed 7.1% returns. Tax-free.',
    elss: '3-year lock-in with potential 12%+ returns. Tax-saving.',
    nps: 'Retirement-focused with 10% expected returns. Tax benefits.',
    gold_etf: 'Digital gold for portfolio diversification. 8% expected returns.',
  };
  return descriptions[scheme as keyof typeof descriptions] || 'Investment option for portfolio diversification.';
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
  profileSummaryCard: {
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
  profileSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 16,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  profileItem: {
    width: '48%',
    marginBottom: 12,
  },
  profileLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003153',
  },
  profileValueHighlight: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#006B3F',
  },
  planComparisonCard: {
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
  planComparisonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 16,
  },
  plansContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  planCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  investingPlan: {
    backgroundColor: '#E8F5E8',
    borderColor: '#006B3F',
  },
  planTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 8,
  },
  planAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#006B3F',
    marginBottom: 4,
  },
  planBreakdown: {
    marginBottom: 8,
  },
  planSubAmount: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  planDuration: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  planNote: {
    fontSize: 12,
    fontWeight: '600',
    color: '#006B3F',
  },
  timeSavedCard: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  timeSavedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 8,
  },
  timeSavedAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#006B3F',
    marginBottom: 8,
  },
  timeSavedDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666666',
  },
  riskProfileText: {
    fontSize: 14,
    color: '#006B3F',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  investmentOptionCard: {
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
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003153',
    flex: 1,
  },
  optionAllocation: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#006B3F',
  },
  optionAmount: {
    fontSize: 14,
    color: '#006B3F',
    marginBottom: 4,
  },
  optionReturn: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  taxOptimizationCard: {
    backgroundColor: '#FFF8E1',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  taxStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  taxStat: {
    width: '48%',
    marginBottom: 12,
  },
  taxLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  taxValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#003153',
  },
  taxValueHighlight: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#006B3F',
  },
  taxRecommendations: {
    borderTopWidth: 1,
    borderTopColor: '#FFD54F',
    paddingTop: 16,
  },
  taxRecommendationsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 8,
  },
  taxRecommendation: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 4,
  },
  firstStepCard: {
    backgroundColor: '#006B3F',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  firstStepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  firstStepAction: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  firstStepAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginBottom: 12,
  },
  firstStepDescription: {
    fontSize: 14,
    color: '#E8F5E8',
    textAlign: 'center',
    marginBottom: 8,
  },
  firstStepPriority: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#E8F5E8',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryMotivation: {
    fontSize: 16,
    color: '#006B3F',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  summaryNextStep: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});