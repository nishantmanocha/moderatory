import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PermissionsScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>🔐</Text>
          <Text style={styles.title}>Almost Done!</Text>
          <Text style={styles.subtitle}>
            For demo purposes, we'll skip permissions setup
          </Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.description}>
            In a production app, we would request permissions for:
          </Text>
          
          <View style={styles.permissions}>
            <View style={styles.permission}>
              <Text style={styles.permissionIcon}>📱</Text>
              <Text style={styles.permissionText}>SMS access for transaction tracking</Text>
            </View>
            <View style={styles.permission}>
              <Text style={styles.permissionIcon}>🔔</Text>
              <Text style={styles.permissionText}>Notifications for savings reminders</Text>
            </View>
            <View style={styles.permission}>
              <Text style={styles.permissionIcon}>📊</Text>
              <Text style={styles.permissionText}>Usage analytics for better recommendations</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueText}>Enter App</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#006B3F',
    textAlign: 'center',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  description: {
    fontSize: 16,
    color: '#003153',
    textAlign: 'center',
    marginBottom: 32,
  },
  permissions: {
    gap: 20,
  },
  permission: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  permissionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  permissionText: {
    fontSize: 16,
    color: '#003153',
    flex: 1,
  },
  continueButton: {
    backgroundColor: '#006B3F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});