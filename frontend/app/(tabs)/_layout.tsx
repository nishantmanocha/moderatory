import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#006B3F',
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E0E0E0',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '🏠' : '🏡'}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '💳' : '💰'}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '📊' : '📈'}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '🎓' : '📚'}</Text>
          ),
        }}
      />
    </Tabs>
  );
}