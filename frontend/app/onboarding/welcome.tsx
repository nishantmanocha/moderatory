import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

type Language = 'en' | 'hi' | 'pb';

const translations = {
  en: {
    title: 'Welcome to MicroSave',
    subtitle: 'Your personal AI financial advisor for smart micro-investments',
    description: 'We help you save small amounts regularly to build wealth over time, with personalized recommendations based on your spending patterns.',
    languageLabel: 'Choose your language',
    continueButton: 'Continue',
    skipButton: 'Skip',
  },
  hi: {
    title: 'MicroSave में आपका स्वागत है',
    subtitle: 'स्मार्ट माइक्रो-इन्वेस्टमेंट के लिए आपका व्यक्तिगत AI वित्तीय सलाहकार',
    description: 'हम आपको समय के साथ धन बनाने के लिए नियमित रूप से छोटी मात्रा में बचत करने में मदद करते हैं, आपके खर्च के पैटर्न के आधार पर व्यक्तिगत सिफारिशों के साथ।',
    languageLabel: 'अपनी भाषा चुनें',
    continueButton: 'जारी रखें',
    skipButton: 'छोड़ें',
  },
  pb: {
    title: 'MicroSave ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ',
    subtitle: 'ਸਮਾਰਟ ਮਾਈਕਰੋ-ਨਿਵੇਸ਼ ਲਈ ਤੁਹਾਡਾ ਨਿੱਜੀ AI ਵਿੱਤੀ ਸਲਾਹਕਾਰ',
    description: 'ਅਸੀਂ ਤੁਹਾਨੂੰ ਸਮੇਂ ਦੇ ਨਾਲ ਦੌਲਤ ਬਣਾਉਣ ਲਈ ਨਿਯਮਿਤ ਤੌਰ ਤੇ ਛੋਟੀਆਂ ਮਾਤਰਾਵਾਂ ਵਿੱਚ ਬਚਤ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰਦੇ ਹਾਂ, ਤੁਹਾਡੇ ਖਰਚ ਦੇ ਪੈਟਰਨ ਦੇ ਆਧਾਰ ਤੇ ਵਿਅਕਤਿਗਤ ਸਿਫਾਰਸ਼ਾਂ ਦੇ ਨਾਲ।',
    languageLabel: 'ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ',
    continueButton: 'ਜਾਰੀ ਰੱਖੋ',
    skipButton: 'ਛੱਡੋ',
  },
};

export default function WelcomeOnboarding() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const router = useRouter();

  const t = translations[selectedLanguage];

  const handleContinue = () => {
    // Store selected language (in real app, this would be in AsyncStorage)
    router.push('/onboarding/income');
  };

  const handleSkip = () => {
    router.push('/onboarding/income');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.description}>{t.description}</Text>
          
          <View style={styles.languageSection}>
            <Text style={styles.languageLabel}>{t.languageLabel}</Text>
            <View style={styles.languageOptions}>
              {(['en', 'hi', 'pb'] as Language[]).map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.languageOption,
                    selectedLanguage === lang && styles.selectedLanguageOption,
                  ]}
                  onPress={() => setSelectedLanguage(lang)}
                >
                  <Text
                    style={[
                      styles.languageText,
                      selectedLanguage === lang && styles.selectedLanguageText,
                    ]}
                  >
                    {lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी' : 'ਪੰਜਾਬੀ'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>{t.skipButton}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueText}>{t.continueButton}</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#003153',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#006B3F',
    textAlign: 'center',
    lineHeight: 22,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  description: {
    fontSize: 16,
    color: '#003153',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 40,
  },
  languageSection: {
    marginBottom: 40,
  },
  languageLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003153',
    marginBottom: 16,
    textAlign: 'center',
  },
  languageOptions: {
    gap: 12,
  },
  languageOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  selectedLanguageOption: {
    borderColor: '#006B3F',
    backgroundColor: '#F0F8F5',
  },
  languageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003153',
    textAlign: 'center',
  },
  selectedLanguageText: {
    color: '#006B3F',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#006B3F',
    alignItems: 'center',
  },
  skipText: {
    color: '#006B3F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#006B3F',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});