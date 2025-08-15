import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { userAPI } from '../../services/api';

export default function IncomeOnboarding() {
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    monthlyIncome: '',
    monthlyRent: '',
    monthlyEMI: '',
    savingsGoal: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return false;
    }
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return false;
    }
    if (!formData.monthlyIncome.trim() || isNaN(Number(formData.monthlyIncome))) {
      Alert.alert('Error', 'Please enter a valid monthly income');
      return false;
    }
    if (formData.monthlyRent && isNaN(Number(formData.monthlyRent))) {
      Alert.alert('Error', 'Please enter a valid rent amount');
      return false;
    }
    if (formData.monthlyEMI && isNaN(Number(formData.monthlyEMI))) {
      Alert.alert('Error', 'Please enter a valid EMI amount');
      return false;
    }
    if (formData.savingsGoal && isNaN(Number(formData.savingsGoal))) {
      Alert.alert('Error', 'Please enter a valid savings goal');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = {
        phone: formData.phone.trim(),
        name: formData.name.trim(),
        monthly_income: Number(formData.monthlyIncome),
        monthly_rent: formData.monthlyRent ? Number(formData.monthlyRent) : 0,
        monthly_emi: formData.monthlyEMI ? Number(formData.monthlyEMI) : 0,
        savings_goal: formData.savingsGoal ? Number(formData.savingsGoal) : 0,
        language: 'en', // Default for now
      };

      const response = await userAPI.setup(userData);
      
      if (response.success) {
        // Store user ID for future use (in real app, use AsyncStorage)
        console.log('User setup successful:', response);
        router.push('/onboarding/permissions');
      } else {
        Alert.alert('Error', response.message || 'Failed to setup user profile');
      }
    } catch (error: any) {
      console.error('Setup error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    if (!value) return '';
    return `₹${Number(value).toLocaleString('en-IN')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Let's set up your profile</Text>
            <Text style={styles.subtitle}>
              This helps us provide personalized savings recommendations
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder="+91 9876543210"
                keyboardType="phone-pad"
                maxLength={13}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Enter your full name"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Monthly Income *</Text>
              <TextInput
                style={styles.input}
                value={formData.monthlyIncome}
                onChangeText={(value) => handleInputChange('monthlyIncome', value)}
                placeholder="25000"
                keyboardType="numeric"
              />
              {formData.monthlyIncome && (
                <Text style={styles.helperText}>
                  {formatCurrency(formData.monthlyIncome)} per month
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Monthly Rent (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.monthlyRent}
                onChangeText={(value) => handleInputChange('monthlyRent', value)}
                placeholder="8000"
                keyboardType="numeric"
              />
              {formData.monthlyRent && (
                <Text style={styles.helperText}>
                  {formatCurrency(formData.monthlyRent)} per month
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Monthly EMI (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.monthlyEMI}
                onChangeText={(value) => handleInputChange('monthlyEMI', value)}
                placeholder="5000"
                keyboardType="numeric"
              />
              {formData.monthlyEMI && (
                <Text style={styles.helperText}>
                  {formatCurrency(formData.monthlyEMI)} per month
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Savings Goal (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.savingsGoal}
                onChangeText={(value) => handleInputChange('savingsGoal', value)}
                placeholder="100000"
                keyboardType="numeric"
              />
              {formData.savingsGoal && (
                <Text style={styles.helperText}>
                  Target: {formatCurrency(formData.savingsGoal)}
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>Continue</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            * Required fields. Your data is encrypted and secure.
          </Text>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
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
    lineHeight: 22,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003153',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#003153',
  },
  helperText: {
    fontSize: 14,
    color: '#006B3F',
    marginTop: 4,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#006B3F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
  },
});