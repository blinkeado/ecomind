// SOURCE: personal-relationship-assistant.md privacy requirements + React Native Official Docs
// URL: https://reactnative.dev/docs/components-and-apis
// VERIFIED: Privacy-first onboarding flow based on GDPR requirements

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { 
  OnboardingStep, 
  PrivacyLevel, 
  DEFAULT_USER_PREFERENCES,
  UserPreferences 
} from '../types/user';

/**
 * Onboarding Screen Component
 * Guides users through account creation and privacy consent
 * SOURCE: SHARED_RELATIONSHIP_PROTOCOL.md consent framework
 */
export const OnboardingScreen: React.FC = () => {
  const { signUp, signIn, signInAnonymous, loading, error } = useAuth();
  
  // Onboarding State
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  
  // Privacy Preferences State
  const [privacyPreferences, setPrivacyPreferences] = useState<UserPreferences>({
    ...DEFAULT_USER_PREFERENCES,
  });

  /**
   * Handle form input changes
   */
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Handle privacy preference changes
   */
  const handlePrivacyChange = useCallback((field: keyof UserPreferences, value: any) => {
    setPrivacyPreferences(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Handle privacy level change
   */
  const handlePrivacyLevelChange = useCallback((level: PrivacyLevel) => {
    const updatedPreferences: UserPreferences = {
      ...privacyPreferences,
      privacyLevel: level,
      aiProcessingConsent: level !== 'strict',
      notificationSettings: {
        ...privacyPreferences.notificationSettings,
        insights: level === 'open',
        weeklyInsights: level === 'open',
        monthlyReports: level === 'open',
      },
    };
    setPrivacyPreferences(updatedPreferences);
  }, [privacyPreferences]);

  /**
   * Validate email format
   */
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validate password strength
   */
  const isValidPassword = (password: string): boolean => {
    return password.length >= 8;
  };

  /**
   * Handle user registration
   */
  const handleSignUp = useCallback(async () => {
    if (!formData.email || !formData.password || !formData.displayName) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (!isValidEmail(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    if (!isValidPassword(formData.password)) {
      Alert.alert('Error', 'Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      await signUp(formData.email, formData.password, formData.displayName);
      setCurrentStep('privacy_consent');
    } catch (error) {
      console.error('Signup error:', error);
    }
  }, [formData, signUp]);

  /**
   * Handle anonymous sign in
   */
  const handleAnonymousSignIn = useCallback(async () => {
    try {
      await signInAnonymous();
      setCurrentStep('privacy_consent');
    } catch (error) {
      console.error('Anonymous signin error:', error);
    }
  }, [signInAnonymous]);

  /**
   * Handle privacy consent completion
   */
  const handlePrivacyConsentComplete = useCallback(() => {
    setCurrentStep('complete');
    // TODO: Update user preferences in Firestore
    // This will be implemented when we have the profile update functionality
  }, []);

  /**
   * Render Welcome Step
   */
  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Welcome to EcoMind</Text>
      <Text style={styles.subtitle}>
        Your Personal Relationship Assistant
      </Text>
      
      <Text style={styles.description}>
        EcoMind helps you nurture and strengthen your relationships through 
        AI-powered insights and gentle reminders, all while respecting your privacy.
      </Text>

      <TouchableOpacity 
        style={styles.primaryButton}
        onPress={() => setCurrentStep('authentication')}
      >
        <Text style={styles.primaryButtonText}>Get Started</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.secondaryButton}
        onPress={handleAnonymousSignIn}
        disabled={loading}
      >
        <Text style={styles.secondaryButtonText}>
          {loading ? 'Loading...' : 'Try Anonymously'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render Authentication Step
   */
  const renderAuthenticationStep = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.stepContainer}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Create Your Account</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Display Name *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.displayName}
            onChangeText={(value) => handleInputChange('displayName', value)}
            placeholder="How should we address you?"
            autoCapitalize="words"
            testID="display-name-input"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email Address *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            testID="email-input"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            placeholder="At least 8 characters"
            secureTextEntry
            testID="password-input"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Confirm Password *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            placeholder="Confirm your password"
            secureTextEntry
            testID="confirm-password-input"
          />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleSignUp}
          disabled={loading}
          testID="sign-up-button"
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.textButton}
          onPress={() => setCurrentStep('welcome')}
        >
          <Text style={styles.textButtonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  /**
   * Render Privacy Consent Step
   */
  const renderPrivacyConsentStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Privacy & Data Control</Text>
      <Text style={styles.subtitle}>You are in complete control of your data</Text>

      {/* Privacy Level Selection */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Choose Your Privacy Level</Text>
        
        {(['strict', 'moderate', 'open'] as PrivacyLevel[]).map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.privacyOption,
              privacyPreferences.privacyLevel === level && styles.privacyOptionSelected
            ]}
            onPress={() => handlePrivacyLevelChange(level)}
          >
            <Text style={styles.privacyOptionTitle}>
              {level.charAt(0).toUpperCase() + level.slice(1)} Privacy
            </Text>
            <Text style={styles.privacyOptionDescription}>
              {level === 'strict' && 'Maximum privacy. No AI processing, local data only.'}
              {level === 'moderate' && 'Balanced approach. Limited AI processing with anonymization.'}
              {level === 'open' && 'Full features enabled. AI processing with your consent.'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* AI Processing Consent */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>AI Processing</Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>
            Allow AI to analyze relationship patterns for insights
          </Text>
          <Switch
            value={privacyPreferences.aiProcessingConsent}
            onValueChange={(value) => handlePrivacyChange('aiProcessingConsent', value)}
            disabled={privacyPreferences.privacyLevel === 'strict'}
            testID="ai-consent-switch"
          />
        </View>
        <Text style={styles.switchDescription}>
          AI processing helps generate personalized relationship insights and suggestions.
          {privacyPreferences.privacyLevel === 'strict' && ' (Disabled for Strict Privacy)'}
        </Text>
      </View>

      {/* Notification Preferences */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Relationship Prompts</Text>
          <Switch
            value={privacyPreferences.notificationSettings.prompts}
            onValueChange={(value) => handlePrivacyChange('notificationSettings', {
              ...privacyPreferences.notificationSettings,
              prompts: value
            })}
          />
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Important Date Reminders</Text>
          <Switch
            value={privacyPreferences.notificationSettings.reminders}
            onValueChange={(value) => handlePrivacyChange('notificationSettings', {
              ...privacyPreferences.notificationSettings,
              reminders: value
            })}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={styles.primaryButton}
        onPress={handlePrivacyConsentComplete}
        testID="complete-privacy-button"
      >
        <Text style={styles.primaryButtonText}>Complete Setup</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        You can change these preferences anytime in Settings. 
        We respect your privacy and will never share your personal data.
      </Text>
    </ScrollView>
  );

  /**
   * Render Completion Step
   */
  const renderCompleteStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Welcome to EcoMind! 🎉</Text>
      <Text style={styles.subtitle}>Your relationship assistant is ready</Text>
      
      <Text style={styles.description}>
        You can now start adding your relationships and let EcoMind help you 
        stay connected with the people who matter most.
      </Text>

      <TouchableOpacity 
        style={styles.primaryButton}
        onPress={() => {
          // Navigation to main app will be handled by parent component
          console.log('Onboarding complete - navigate to main app');
        }}
        testID="start-using-app-button"
      >
        <Text style={styles.primaryButtonText}>Start Using EcoMind</Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render current step based on state
   */
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'authentication':
        return renderAuthenticationStep();
      case 'privacy_consent':
        return renderPrivacyConsentStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderCurrentStep()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  stepContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  textButton: {
    alignItems: 'center',
    padding: 12,
  },
  textButtonText: {
    color: '#3B82F6',
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  privacyOption: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  privacyOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF4FF',
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  privacyOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
    marginRight: 16,
  },
  switchDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});

export default OnboardingScreen;