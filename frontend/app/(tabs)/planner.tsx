import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PlannerScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Financial Planner</Text>
        <Text style={styles.subtitle}>Budget tracking and goal planning</Text>
        
        <View style={styles.comingSoon}>
          <Text style={styles.icon}>📊</Text>
          <Text style={styles.comingSoonText}>Coming Soon!</Text>
          <Text style={styles.description}>
            Budget analysis, goal tracking, and personalized financial planning tools
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F0',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#006B3F',
    marginBottom: 40,
  },
  comingSoon: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  comingSoonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});