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
import { FlatGrid } from 'react-native-super-grid';

const { width } = Dimensions.get('window');

interface EducationalContent {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  icon: string;
  readTime: string;
}

interface QuickLink {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
}

export default function LearnScreen() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const quickLinks: QuickLink[] = [
    {
      id: '1',
      title: 'Investment Calculator',
      description: 'Calculate returns on your investments',
      icon: '📊',
      action: 'calculator'
    },
    {
      id: '2',
      title: 'Tax Saving Guide',
      description: 'Learn about Section 80C, ELSS, PPF',
      icon: '💰',
      action: 'tax-guide'
    },
    {
      id: '3',
      title: 'Emergency Fund',
      description: 'Build your safety net',
      icon: '🛡️',
      action: 'emergency-fund'
    },
    {
      id: '4',
      title: 'Financial Quiz',
      description: 'Test your knowledge',
      icon: '🎯',
      action: 'quiz'
    }
  ];

  const educationalContent: EducationalContent[] = [
    {
      id: '1',
      title: 'What is PPF (Public Provident Fund)?',
      description: 'Long-term tax-saving investment with guaranteed returns',
      content: `PPF is a 15-year lock-in investment scheme that offers:

• Tax benefits under Section 80C (up to ₹1.5 lakh)
• Tax-free returns (currently ~7.1% annually)
• Triple tax benefit (EEE - Exempt, Exempt, Exempt)
• Minimum investment: ₹500 per year
• Maximum investment: ₹1.5 lakh per year
• Partial withdrawal allowed after 7 years
• Loan facility against PPF balance

💡 Best for: Long-term wealth creation and tax saving
⚠️ Note: Money is locked for 15 years`,
      category: 'investments',
      icon: '🏛️',
      readTime: '3 min'
    },
    {
      id: '2',
      title: 'ELSS Mutual Funds Explained',
      description: 'Tax-saving mutual funds with growth potential',
      content: `ELSS (Equity Linked Saving Scheme) features:

• Tax deduction under Section 80C (up to ₹1.5 lakh)
• Shortest lock-in period: 3 years
• Potential for higher returns (10-15% historically)
• Invests primarily in equity markets
• Systematic Investment Plan (SIP) available
• Professional fund management
• Liquidity after 3 years

💡 Best for: Young investors seeking growth
⚠️ Risk: Market-linked returns, can be volatile`,
      category: 'investments',
      icon: '📈',
      readTime: '4 min'
    },
    {
      id: '3',
      title: 'NPS (National Pension System)',
      description: 'Retirement planning with tax benefits',
      content: `NPS is a retirement-focused investment:

• Additional tax benefit: ₹50,000 under Section 80CCD(1B)
• Low-cost investment option
• Mix of equity, corporate bonds, government securities
• Flexibility to choose fund managers
• Partial withdrawal allowed (25% after 3 years)
• Annuity mandatory at maturity
• Lock-in until age 60

💡 Best for: Long-term retirement planning
⚠️ Note: 40% must be used to buy annuity`,
      category: 'investments',
      icon: '👴',
      readTime: '4 min'
    },
    {
      id: '4',
      title: 'Gold ETF Investment Guide',
      description: 'Digital gold investment for portfolio diversification',
      content: `Gold ETFs offer digital gold investment:

• No storage or purity concerns
• Lower costs compared to physical gold
• Traded like stocks on exchanges
• Good hedge against inflation
• Portfolio diversification
• Highly liquid
• No making charges or wastage

💡 Best for: Portfolio diversification (5-10%)
⚠️ Note: Gold doesn't generate regular income`,
      category: 'investments',
      icon: '🥇',
      readTime: '3 min'
    },
    {
      id: '5',
      title: 'Emergency Fund Essentials',
      description: 'Your financial safety net explained',
      content: `Building an emergency fund:

• Keep 6-12 months of expenses
• High liquidity is essential
• Keep in savings account or FD
• Don't invest in risky assets
• Use only for genuine emergencies
• Medical emergencies, job loss, urgent repairs
• Rebuild immediately after use

💡 Priority: Build this before any investments
⚠️ Don't use for planned expenses`,
      category: 'planning',
      icon: '🛡️',
      readTime: '3 min'
    },
    {
      id: '6',
      title: 'SIP vs Lump Sum Investment',
      description: 'Which investment strategy suits you?',
      content: `SIP (Systematic Investment Plan):

Advantages:
• Rupee cost averaging
• Disciplined investing
• Lower risk perception
• Suitable for regular income
• No need to time the market

Lump Sum:
• Better when markets are low
• Requires market timing skills
• Suitable for windfall money
• Higher potential returns in bull markets

💡 Recommendation: SIP for regular investing, lump sum for windfalls`,
      category: 'planning',
      icon: '⚖️',
      readTime: '4 min'
    }
  ];

  const categories = [
    { id: 'all', name: 'All', icon: '📚' },
    { id: 'investments', name: 'Investments', icon: '📊' },
    { id: 'planning', name: 'Planning', icon: '🎯' },
    { id: 'tax', name: 'Tax Saving', icon: '💰' }
  ];

  const filteredContent = selectedCategory === 'all' 
    ? educationalContent 
    : educationalContent.filter(item => item.category === selectedCategory);

  const handleQuickLinkPress = (action: string) => {
    switch (action) {
      case 'calculator':
        Alert.alert('Investment Calculator', 'Feature coming soon!');
        break;
      case 'tax-guide':
        setSelectedCategory('investments');
        break;
      case 'emergency-fund':
        const emergencyCard = educationalContent.find(item => item.id === '5');
        if (emergencyCard) setExpandedCard('5');
        break;
      case 'quiz':
        Alert.alert('Financial Quiz', 'Interactive quiz coming soon!');
        break;
    }
  };

  const handleReadMore = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const renderQuickLink = ({ item }: { item: QuickLink }) => (
    <TouchableOpacity
      style={styles.quickLinkCard}
      onPress={() => handleQuickLinkPress(item.action)}
    >
      <Text style={styles.quickLinkIcon}>{item.icon}</Text>
      <Text style={styles.quickLinkTitle}>{item.title}</Text>
      <Text style={styles.quickLinkDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  const renderEducationalCard = (item: EducationalContent) => (
    <View key={item.id} style={styles.educationalCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{item.icon}</Text>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.readTime}>{item.readTime} read</Text>
        </View>
      </View>
      
      <Text style={styles.cardDescription}>{item.description}</Text>
      
      {expandedCard === item.id && (
        <View style={styles.expandedContent}>
          <Text style={styles.contentText}>{item.content}</Text>
        </View>
      )}
      
      <TouchableOpacity
        style={styles.readMoreButton}
        onPress={() => handleReadMore(item.id)}
      >
        <Text style={styles.readMoreText}>
          {expandedCard === item.id ? 'Read Less' : 'Read More'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Financial Learning</Text>
          <Text style={styles.subtitle}>Master your money, secure your future</Text>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Quick Actions</Text>
          <FlatGrid
            itemDimension={width / 2.3}
            data={quickLinks}
            style={styles.quickLinksGrid}
            spacing={12}
            renderItem={renderQuickLink}
            scrollEnabled={false}
          />
        </View>

        {/* Category Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📖 Learn by Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Educational Content */}
        <View style={styles.section}>
          {filteredContent.map(renderEducationalCard)}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F0',
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
  quickLinksGrid: {
    paddingHorizontal: 20,
  },
  quickLinkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickLinkIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickLinkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#003153',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickLinkDescription: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  categoryFilter: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryButtonActive: {
    backgroundColor: '#006B3F',
    borderColor: '#006B3F',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    color: '#003153',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  educationalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 4,
  },
  readTime: {
    fontSize: 12,
    color: '#006B3F',
    fontWeight: '500',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
    marginBottom: 16,
  },
  contentText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 22,
  },
  readMoreButton: {
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: 14,
    color: '#006B3F',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
});