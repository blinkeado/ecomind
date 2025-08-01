// SOURCE: Phase 6 Privacy Requirements - Consent flow for AI processing permissions
// VERIFIED: ConsentScreen for initial AI processing consent and privacy education

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { GlassContainer, GlassText, GlassButton } from '../components/design/DesignSystem';
import { useAuth } from '../hooks/useAuth';
import { 
  getPrivacyManager, 
  PermissionType, 
  PERMISSION_DESCRIPTIONS,
  PrivacySettings 
} from '../utils/permissions';
import { UI_CONSTANTS } from '../utils/constants';

/**
 * ConsentScreen Component Props
 */
interface ConsentScreenProps {
  navigation: any;
  route: {
    params?: {
      requiredPermissions?: PermissionType[];
      onComplete?: (granted: boolean) => void;
      mode?: 'initial' | 'feature_specific';
    };
  };
}

/**
 * ConsentScreen Component
 * Handles initial AI processing consent and privacy education
 * SOURCE: Phase 6 - Privacy, Consent & Security Rules
 */
export const ConsentScreen: React.FC<ConsentScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const privacyManager = getPrivacyManager();
  const { requiredPermissions = ['ai_processing'], onComplete, mode = 'initial' } = route.params || {};

  // Local state
  const [currentStep, setCurrentStep] = useState(0);
  const [consentChoices, setConsentChoices] = useState<Record<PermissionType, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [hasReadPrivacyPolicy, setHasReadPrivacyPolicy] = useState(false);

  // Consent flow steps
  const consentSteps = [
    {
      title: 'AI-Powered Relationship Insights',
      description: 'EcoMind can analyze your relationship data to provide personalized suggestions and insights.',
      icon: '🤖',
    },
    {
      title: 'Your Privacy Matters',
      description: 'We use privacy-first design principles. Your data stays secure and you control what gets processed.',
      icon: '🔒',
    },
    {
      title: 'How AI Processing Works',
      description: 'AI analyzes interaction patterns, relationship health, and context to generate helpful suggestions.',
      icon: '🧠',
    },
    {
      title: 'Your Control',
      description: 'You can disable AI processing anytime, export your data, or request complete deletion.',
      icon: '⚙️',
    },
  ];

  /**
   * Initialize consent choices
   */
  useEffect(() => {
    const initializeChoices = async () => {
      try {
        await privacyManager.loadSettings();
        const currentSettings = privacyManager.getSettings();
        
        // Initialize with current settings or defaults
        const choices: Record<PermissionType, boolean> = {};
        requiredPermissions.forEach(permission => {
          choices[permission] = currentSettings[permission] === true;
        });
        
        setConsentChoices(choices);
      } catch (error) {
        console.error('Failed to load current privacy settings:', error);
      }
    };

    initializeChoices();
  }, [requiredPermissions]);

  /**
   * Handle step navigation
   */
  const handleNextStep = () => {
    if (currentStep < consentSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(consentSteps.length); // Move to permissions step
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Handle permission toggle
   */
  const handlePermissionToggle = (permission: PermissionType, enabled: boolean) => {
    setConsentChoices(prev => ({
      ...prev,
      [permission]: enabled,
    }));
  };

  /**
   * Handle privacy policy read confirmation
   */
  const handlePrivacyPolicyRead = () => {
    Alert.alert(
      'Privacy Policy',
      'EcoMind Privacy Policy\n\n' +
      '• We collect relationship interaction data to provide AI insights\n' +
      '• All data is encrypted and stored securely in Firebase\n' +
      '• AI processing is optional and can be disabled anytime\n' +
      '• You can export or delete your data at any time\n' +
      '• We never share your personal data with third parties\n\n' +
      'By continuing, you acknowledge that you have read and understand our privacy practices.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I Understand',
          onPress: () => setHasReadPrivacyPolicy(true),
        },
      ]
    );
  };

  /**
   * Handle consent completion
   */
  const handleCompleteConsent = async () => {
    if (!user) return;

    // Validate that privacy policy was read
    if (!hasReadPrivacyPolicy) {
      Alert.alert(
        'Privacy Policy Required',
        'Please read and acknowledge our privacy policy before proceeding.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      // Update privacy settings with consent choices
      for (const [permission, enabled] of Object.entries(consentChoices)) {
        await privacyManager.updateSetting(permission as PermissionType, enabled);
      }

      // Record consent timestamp and version
      await privacyManager.recordConsent('1.0.0', requiredPermissions);

      // Notify completion callback if provided
      if (onComplete) {
        const allGranted = requiredPermissions.every(p => consentChoices[p]);
        onComplete(allGranted);
      }

      // Navigate based on mode
      if (mode === 'initial') {
        // Navigate to main app
        navigation.replace('MainTabs');
      } else {
        // Return to previous screen
        navigation.goBack();
      }

      Alert.alert('Success', 'Your privacy preferences have been saved.');
    } catch (error) {
      console.error('Failed to save consent:', error);
      Alert.alert('Error', 'Failed to save your preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle skip AI features
   */
  const handleSkipAI = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Disable all AI-related permissions
      await privacyManager.updateSetting('ai_processing', false);
      await privacyManager.updateSetting('context_extraction', false);
      await privacyManager.updateSetting('prompt_generation', false);

      // Record consent refusal
      await privacyManager.recordConsent('1.0.0', [], false);

      if (onComplete) {
        onComplete(false);
      }

      // Navigate based on mode
      if (mode === 'initial') {
        navigation.replace('MainTabs');
      } else {
        navigation.goBack();
      }

      Alert.alert(
        'AI Features Disabled',
        'You can enable AI features later in Settings if you change your mind.'
      );
    } catch (error) {
      console.error('Failed to save consent refusal:', error);
      Alert.alert('Error', 'Failed to save your preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <GlassContainer style={styles.headerContainer}>
          <GlassText variant="h2" color="primary" weight="bold" style={styles.headerTitle}>
            {mode === 'initial' ? 'Welcome to EcoMind' : 'AI Feature Permissions'}
          </GlassText>
          <GlassText variant="body" color="secondary" style={styles.headerSubtitle}>
            Let's set up your privacy preferences
          </GlassText>
        </GlassContainer>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${((currentStep + 1) / (consentSteps.length + 1)) * 100}%` 
                }
              ]} 
            />
          </View>
          <GlassText variant="caption" color="secondary" style={styles.progressText}>
            Step {currentStep + 1} of {consentSteps.length + 1}
          </GlassText>
        </View>

        {/* Content */}
        {currentStep < consentSteps.length ? (
          /* Education Steps */
          <GlassContainer style={styles.stepContainer}>
            <View style={styles.stepContent}>
              <GlassText variant="h1" style={styles.stepIcon}>
                {consentSteps[currentStep].icon}
              </GlassText>
              <GlassText variant="h3" color="primary" weight="semibold" style={styles.stepTitle}>
                {consentSteps[currentStep].title}
              </GlassText>
              <GlassText variant="body" color="secondary" style={styles.stepDescription}>
                {consentSteps[currentStep].description}
              </GlassText>
            </View>

            <View style={styles.stepActions}>
              {currentStep > 0 && (
                <GlassButton
                  variant="secondary"
                  onPress={handlePreviousStep}
                  style={styles.stepButton}
                >
                  <GlassText variant="body" color="secondary" weight="medium">
                    Previous
                  </GlassText>
                </GlassButton>
              )}
              <GlassButton
                variant="primary"
                onPress={handleNextStep}
                style={[styles.stepButton, { flex: currentStep === 0 ? 1 : 0.6 }]}
              >
                <GlassText variant="body" color="white" weight="medium">
                  {currentStep === consentSteps.length - 1 ? 'Continue' : 'Next'}
                </GlassText>
              </GlassButton>
            </View>
          </GlassContainer>
        ) : (
          /* Permissions Selection */
          <View style={styles.permissionsContainer}>
            <GlassContainer style={styles.permissionsSection}>
              <GlassText variant="h3" color="primary" weight="semibold" style={styles.sectionTitle}>
                Choose Your Permissions
              </GlassText>
              <GlassText variant="body" color="secondary" style={styles.sectionDescription}>
                Select which AI features you'd like to enable. You can change these anytime in Settings.
              </GlassText>

              {requiredPermissions.map(permission => {
                const description = PERMISSION_DESCRIPTIONS[permission];
                const isEnabled = consentChoices[permission] === true;

                return (
                  <TouchableOpacity
                    key={permission}
                    onPress={() => handlePermissionToggle(permission, !isEnabled)}
                    style={[
                      styles.permissionItem,
                      isEnabled && styles.permissionItemEnabled,
                    ]}
                    accessible={true}
                    accessibilityLabel={`${description.title} permission`}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: isEnabled }}
                  >
                    <View style={styles.permissionInfo}>
                      <View style={styles.permissionHeader}>
                        <GlassText variant="body" color="primary" weight="medium">
                          {description.title}
                        </GlassText>
                        <View style={[
                          styles.impactBadge,
                          description.privacy_impact === 'high' && styles.impactHighBadge,
                          description.privacy_impact === 'medium' && styles.impactMediumBadge,
                          description.privacy_impact === 'low' && styles.impactLowBadge,
                        ]}>
                          <GlassText variant="caption" color="white" style={styles.impactBadgeText}>
                            {description.privacy_impact.toUpperCase()} IMPACT
                          </GlassText>
                        </View>
                      </View>
                      <GlassText variant="caption" color="secondary" style={styles.permissionDescription}>
                        {description.description}
                      </GlassText>
                      {description.required && (
                        <GlassText variant="caption" color="accent" style={styles.requiredText}>
                          Required for basic functionality
                        </GlassText>
                      )}
                    </View>
                    <View style={[
                      styles.permissionToggle,
                      isEnabled && styles.permissionToggleEnabled,
                    ]}>
                      <GlassText variant="caption" color={isEnabled ? 'white' : 'secondary'}>
                        {isEnabled ? '✓' : '○'}
                      </GlassText>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </GlassContainer>

            {/* Privacy Policy Acknowledgment */}
            <GlassContainer style={styles.privacySection}>
              <TouchableOpacity
                onPress={handlePrivacyPolicyRead}
                style={[
                  styles.privacyPolicyButton,
                  hasReadPrivacyPolicy && styles.privacyPolicyRead,
                ]}
                accessible={true}
                accessibilityLabel="Read privacy policy"
                accessibilityRole="button"
              >
                <View style={styles.privacyPolicyContent}>
                  <GlassText variant="body" color="primary" weight="medium">
                    {hasReadPrivacyPolicy ? '✓ Privacy Policy Read' : '📄 Read Privacy Policy'}
                  </GlassText>
                  <GlassText variant="caption" color="secondary">
                    Required before proceeding
                  </GlassText>
                </View>
              </TouchableOpacity>
            </GlassContainer>

            {/* Final Actions */}
            <View style={styles.finalActions}>
              <GlassButton
                variant="secondary"
                onPress={handleSkipAI}
                disabled={loading}
                style={styles.finalActionButton}
                testID="skip-ai-button"
              >
                <GlassText variant="body" color="secondary" weight="medium">
                  Skip AI Features
                </GlassText>
              </GlassButton>
              <GlassButton
                variant="primary"
                onPress={handleCompleteConsent}
                disabled={loading || !hasReadPrivacyPolicy}
                style={styles.finalActionButton}
                testID="complete-consent-button"
              >
                <GlassText variant="body" color="white" weight="medium">
                  {loading ? 'Saving...' : 'Complete Setup'}
                </GlassText>
              </GlassButton>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

/**
 * ConsentScreen Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND_PRIMARY,
  },

  scrollView: {
    flex: 1,
  },

  headerContainer: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
    marginTop: UI_CONSTANTS.SPACING.LG,
    marginBottom: UI_CONSTANTS.SPACING.MD,
    alignItems: 'center',
  },

  headerTitle: {
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },

  headerSubtitle: {
    textAlign: 'center',
  },

  progressContainer: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
    marginBottom: UI_CONSTANTS.SPACING.LG,
  },

  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },

  progressFill: {
    height: '100%',
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    borderRadius: 2,
  },

  progressText: {
    textAlign: 'center',
  },

  stepContainer: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
    marginBottom: UI_CONSTANTS.SPACING.LG,
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.XL,
  },

  stepContent: {
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.SPACING.XL,
  },

  stepIcon: {
    fontSize: 64,
    marginBottom: UI_CONSTANTS.SPACING.LG,
  },

  stepTitle: {
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },

  stepDescription: {
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },

  stepActions: {
    flexDirection: 'row',
    width: '100%',
    gap: UI_CONSTANTS.SPACING.MD,
  },

  stepButton: {
    flex: 0.4,
  },

  permissionsContainer: {
    gap: UI_CONSTANTS.SPACING.MD,
  },

  permissionsSection: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
  },

  sectionTitle: {
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },

  sectionDescription: {
    marginBottom: UI_CONSTANTS.SPACING.LG,
    lineHeight: 20,
  },

  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.MD,
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
    marginVertical: UI_CONSTANTS.SPACING.XS,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.MD,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },

  permissionItemEnabled: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },

  permissionInfo: {
    flex: 1,
    marginRight: UI_CONSTANTS.SPACING.MD,
  },

  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.SPACING.SM,
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },

  permissionDescription: {
    lineHeight: 18,
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },

  requiredText: {
    fontStyle: 'italic',
  },

  impactBadge: {
    paddingHorizontal: UI_CONSTANTS.SPACING.XS,
    paddingVertical: UI_CONSTANTS.SPACING.XS / 2,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
  },

  impactLowBadge: {
    backgroundColor: 'rgba(107, 114, 128, 0.8)',
  },

  impactMediumBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.8)',
  },

  impactHighBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },

  impactBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },

  permissionToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  permissionToggleEnabled: {
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    borderColor: UI_CONSTANTS.COLORS.PRIMARY,
  },

  privacySection: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
  },

  privacyPolicyButton: {
    paddingVertical: UI_CONSTANTS.SPACING.MD,
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.MD,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  privacyPolicyRead: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },

  privacyPolicyContent: {
    gap: UI_CONSTANTS.SPACING.XS,
  },

  finalActions: {
    flexDirection: 'row',
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
    gap: UI_CONSTANTS.SPACING.MD,
    marginTop: UI_CONSTANTS.SPACING.LG,
  },

  finalActionButton: {
    flex: 1,
  },

  bottomSpacing: {
    height: UI_CONSTANTS.SPACING.XL,
  },
});

export default ConsentScreen;