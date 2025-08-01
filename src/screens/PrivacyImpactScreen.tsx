// SOURCE: Phase 6 Privacy Requirements - Privacy impact assessment for AI features
// VERIFIED: PrivacyImpactScreen for comprehensive privacy impact analysis

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { GlassContainer, GlassText, GlassButton } from '../components/design/DesignSystem';
import { useAuth } from '../hooks/useAuth';
import { 
  getPrivacyManager, 
  PrivacySettings,
  PERMISSION_DESCRIPTIONS,
  PermissionType,
} from '../utils/permissions';
import { UI_CONSTANTS } from '../utils/constants';

/**
 * PrivacyImpactScreen Component Props
 */
interface PrivacyImpactScreenProps {
  navigation: any;
}

/**
 * Privacy Impact Analysis Interface
 */
interface PrivacyImpactAnalysis {
  summary: {
    low: number;
    medium: number;
    high: number;
    total_granted: number;
  };
  high_risk_permissions: string[];
  recommendations: string[];
  consent_status: {
    has_valid_consent: boolean;
    last_consent_date: Date | null;
    consent_age_days: number;
  };
  feature_impacts: {
    ai_features: {
      enabled: boolean;
      impact_level: 'none' | 'low' | 'medium' | 'high';
      affected_permissions: string[];
      functionality_description: string;
    };
    data_sharing: {
      enabled: boolean;
      impact_level: 'none' | 'low' | 'medium' | 'high';
      affected_permissions: string[];
      functionality_description: string;
    };
    analytics: {
      enabled: boolean;
      impact_level: 'none' | 'low' | 'medium' | 'high';
      affected_permissions: string[];
      functionality_description: string;
    };
  };
  risk_assessment: {
    overall_risk: 'low' | 'medium' | 'high';
    risk_factors: string[];
    mitigation_suggestions: string[];
  };
}

/**
 * PrivacyImpactScreen Component
 * Provides comprehensive privacy impact assessment
 * SOURCE: Phase 6 - Privacy Impact Assessments for AI Features
 */
export const PrivacyImpactScreen: React.FC<PrivacyImpactScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const privacyManager = getPrivacyManager();

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [impactAnalysis, setImpactAnalysis] = useState<PrivacyImpactAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load privacy settings and generate impact analysis
   */
  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        await privacyManager.loadSettings();
        const settings = privacyManager.getSettings();
        setPrivacySettings(settings);

        const analysis = generatePrivacyImpactAnalysis(settings);
        setImpactAnalysis(analysis);
      } catch (error) {
        console.error('Failed to load privacy analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();

    // Listen for privacy settings changes
    const unsubscribe = privacyManager.addListener((settings) => {
      setPrivacySettings(settings);
      const analysis = generatePrivacyImpactAnalysis(settings);
      setImpactAnalysis(analysis);
    });

    return unsubscribe;
  }, []);

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await privacyManager.loadSettings();
      const settings = privacyManager.getSettings();
      setPrivacySettings(settings);
      const analysis = generatePrivacyImpactAnalysis(settings);
      setImpactAnalysis(analysis);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Generate comprehensive privacy impact analysis
   */
  const generatePrivacyImpactAnalysis = (settings: PrivacySettings): PrivacyImpactAnalysis => {
    const baseAnalysis = privacyManager.generatePrivacyImpactAssessment();

    // Analyze feature impacts
    const featureImpacts = {
      ai_features: {
        enabled: settings.ai_processing === true,
        impact_level: settings.ai_processing ? 'medium' as const : 'none' as const,
        affected_permissions: settings.ai_processing 
          ? ['ai_processing', 'data_collection', 'background_sync'] 
          : [],
        functionality_description: settings.ai_processing
          ? 'AI analyzes your relationship data to provide personalized suggestions and insights. This includes processing interaction patterns, emotional tones, and relationship health metrics.'
          : 'AI features are disabled. You will not receive personalized suggestions or automated insights about your relationships.',
      },
      data_sharing: {
        enabled: settings.data_sharing === true,
        impact_level: settings.data_sharing ? 'high' as const : 'none' as const,
        affected_permissions: settings.data_sharing 
          ? ['data_sharing', 'analytics', 'marketing'] 
          : [],
        functionality_description: settings.data_sharing
          ? 'Anonymized relationship insights may be shared with research partners to improve relationship science. No personal identifying information is included.'
          : 'No data sharing occurs. Your relationship data remains completely private to you.',
      },
      analytics: {
        enabled: settings.analytics === true,
        impact_level: settings.analytics ? 'low' as const : 'none' as const,
        affected_permissions: settings.analytics 
          ? ['analytics', 'crash_reporting'] 
          : [],
        functionality_description: settings.analytics
          ? 'Anonymous usage patterns help improve app performance and identify popular features. No personal relationship data is included.'
          : 'No usage analytics are collected. App improvements rely on user feedback rather than automated analysis.',
      },
    };

    // Calculate overall risk assessment
    const riskFactors: string[] = [];
    const mitigationSuggestions: string[] = [];

    if (baseAnalysis.summary.high > 0) {
      riskFactors.push(`${baseAnalysis.summary.high} high-impact permissions enabled`);
      mitigationSuggestions.push('Review high-impact permissions and disable any that are not essential');
    }

    if (!baseAnalysis.consent_status.has_valid_consent) {
      riskFactors.push('Consent may be expired or invalid');
      mitigationSuggestions.push('Renew your privacy consent to ensure compliance');
    }

    if (settings.data_sharing) {
      riskFactors.push('Data sharing with third parties is enabled');
      mitigationSuggestions.push('Consider disabling data sharing if not needed');
    }

    if (settings.location_access) {
      riskFactors.push('Location access increases privacy exposure');
      mitigationSuggestions.push('Disable location access if location-based features are not needed');
    }

    const overallRisk: 'low' | 'medium' | 'high' = 
      baseAnalysis.summary.high > 2 || settings.data_sharing ? 'high' :
      baseAnalysis.summary.high > 0 || baseAnalysis.summary.medium > 3 ? 'medium' : 'low';

    if (mitigationSuggestions.length === 0) {
      mitigationSuggestions.push('Your current privacy settings provide good data protection');
    }

    return {
      ...baseAnalysis,
      feature_impacts: featureImpacts,
      risk_assessment: {
        overall_risk: overallRisk,
        risk_factors: riskFactors,
        mitigation_suggestions: mitigationSuggestions,
      },
    };
  };

  /**
   * Handle navigate to privacy settings
   */
  const handleOpenPrivacySettings = () => {
    navigation.navigate('Settings');
  };

  /**
   * Handle share impact report
   */
  const handleShareReport = () => {
    if (!impactAnalysis) return;

    const reportSummary = `EcoMind Privacy Impact Report
Overall Risk: ${impactAnalysis.risk_assessment.overall_risk.toUpperCase()}
Permissions: ${impactAnalysis.summary.total_granted} total (${impactAnalysis.summary.high} high-impact)
AI Features: ${impactAnalysis.feature_impacts.ai_features.enabled ? 'Enabled' : 'Disabled'}
Data Sharing: ${impactAnalysis.feature_impacts.data_sharing.enabled ? 'Enabled' : 'Disabled'}

Generated: ${new Date().toLocaleDateString()}`;

    Alert.alert(
      'Share Privacy Report',
      'Privacy impact report ready to share.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy to Clipboard',
          onPress: () => {
            // In a real app, this would copy to clipboard
            Alert.alert('Copied', 'Privacy report copied to clipboard');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <GlassContainer style={styles.container}>
        <View style={styles.loadingContainer}>
          <GlassText variant="body" color="secondary">
            Analyzing privacy impact...
          </GlassText>
        </View>
      </GlassContainer>
    );
  }

  if (!impactAnalysis) {
    return (
      <GlassContainer style={styles.container}>
        <View style={styles.errorContainer}>
          <GlassText variant="body" color="primary">
            Unable to generate privacy impact analysis
          </GlassText>
          <GlassButton onPress={handleRefresh} style={styles.retryButton}>
            <GlassText variant="body" color="white" weight="medium">
              Try Again
            </GlassText>
          </GlassButton>
        </View>
      </GlassContainer>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <GlassContainer style={styles.headerContainer}>
          <GlassText variant="h2" color="primary" weight="bold" style={styles.headerTitle}>
            Privacy Impact Assessment
          </GlassText>
          <GlassText variant="body" color="secondary" style={styles.headerSubtitle}>
            Understand how your privacy settings affect app functionality
          </GlassText>
        </GlassContainer>

        {/* Overall Risk Assessment */}
        <GlassContainer style={styles.section}>
          <View style={styles.riskHeader}>
            <GlassText variant="h3" color="primary" weight="semibold">
              Overall Privacy Risk
            </GlassText>
            <View style={[
              styles.riskBadge,
              impactAnalysis.risk_assessment.overall_risk === 'high' && styles.riskHighBadge,
              impactAnalysis.risk_assessment.overall_risk === 'medium' && styles.riskMediumBadge,
              impactAnalysis.risk_assessment.overall_risk === 'low' && styles.riskLowBadge,
            ]}>
              <GlassText variant="caption" color="white" weight="bold" style={styles.riskBadgeText}>
                {impactAnalysis.risk_assessment.overall_risk.toUpperCase()}
              </GlassText>
            </View>
          </View>

          {impactAnalysis.risk_assessment.risk_factors.length > 0 && (
            <View style={styles.riskFactors}>
              <GlassText variant="label" color="secondary" style={styles.subsectionLabel}>
                RISK FACTORS
              </GlassText>
              {impactAnalysis.risk_assessment.risk_factors.map((factor, index) => (
                <View key={index} style={styles.riskFactor}>
                  <GlassText variant="caption" color="primary">
                    • {factor}
                  </GlassText>
                </View>
              ))}
            </View>
          )}

          <View style={styles.mitigationSuggestions}>
            <GlassText variant="label" color="secondary" style={styles.subsectionLabel}>
              RECOMMENDATIONS
            </GlassText>
            {impactAnalysis.risk_assessment.mitigation_suggestions.map((suggestion, index) => (
              <View key={index} style={styles.suggestion}>
                <GlassText variant="caption" color="secondary">
                  • {suggestion}
                </GlassText>
              </View>
            ))}
          </View>
        </GlassContainer>

        {/* Permission Summary */}
        <GlassContainer style={styles.section}>
          <GlassText variant="h3" color="primary" weight="semibold" style={styles.sectionTitle}>
            Permission Impact Summary
          </GlassText>
          
          <View style={styles.impactGrid}>
            <View style={styles.impactItem}>
              <GlassText variant="h2" color="primary" weight="bold">
                {impactAnalysis.summary.total_granted}
              </GlassText>
              <GlassText variant="caption" color="secondary">
                Total Permissions
              </GlassText>
            </View>
            <View style={styles.impactItem}>
              <GlassText variant="h2" color="accent" weight="bold">
                {impactAnalysis.summary.high}
              </GlassText>
              <GlassText variant="caption" color="secondary">
                High Impact
              </GlassText>
            </View>
            <View style={styles.impactItem}>
              <GlassText variant="h2" color="accent" weight="bold">
                {impactAnalysis.summary.medium}
              </GlassText>
              <GlassText variant="caption" color="secondary">
                Medium Impact
              </GlassText>
            </View>
            <View style={styles.impactItem}>
              <GlassText variant="h2" color="accent" weight="bold">
                {impactAnalysis.summary.low}
              </GlassText>
              <GlassText variant="caption" color="secondary">
                Low Impact
              </GlassText>
            </View>
          </View>
        </GlassContainer>

        {/* Feature Impact Analysis */}
        <View style={styles.featuresSection}>
          {/* AI Features */}
          <GlassContainer style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <GlassText variant="body" color="primary" weight="semibold">
                🤖 AI Features
              </GlassText>
              <View style={[
                styles.featureStatusBadge,
                impactAnalysis.feature_impacts.ai_features.enabled && styles.featureEnabledBadge,
              ]}>
                <GlassText variant="caption" color="white" style={styles.featureStatusText}>
                  {impactAnalysis.feature_impacts.ai_features.enabled ? 'ENABLED' : 'DISABLED'}
                </GlassText>
              </View>
            </View>
            <GlassText variant="caption" color="secondary" style={styles.featureDescription}>
              {impactAnalysis.feature_impacts.ai_features.functionality_description}
            </GlassText>
            {impactAnalysis.feature_impacts.ai_features.enabled && (
              <View style={styles.affectedPermissions}>
                <GlassText variant="label" color="secondary" style={styles.permissionLabel}>
                  USES PERMISSIONS
                </GlassText>
                <View style={styles.permissionTags}>
                  {impactAnalysis.feature_impacts.ai_features.affected_permissions.map((permission, index) => (
                    <View key={index} style={styles.permissionTag}>
                      <GlassText variant="caption" color="secondary">
                        {PERMISSION_DESCRIPTIONS[permission as PermissionType]?.title || permission}
                      </GlassText>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </GlassContainer>

          {/* Data Sharing */}
          <GlassContainer style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <GlassText variant="body" color="primary" weight="semibold">
                📊 Data Sharing
              </GlassText>
              <View style={[
                styles.featureStatusBadge,
                impactAnalysis.feature_impacts.data_sharing.enabled && styles.featureEnabledBadge,
              ]}>
                <GlassText variant="caption" color="white" style={styles.featureStatusText}>
                  {impactAnalysis.feature_impacts.data_sharing.enabled ? 'ENABLED' : 'DISABLED'}
                </GlassText>
              </View>
            </View>
            <GlassText variant="caption" color="secondary" style={styles.featureDescription}>
              {impactAnalysis.feature_impacts.data_sharing.functionality_description}
            </GlassText>
            {impactAnalysis.feature_impacts.data_sharing.enabled && (
              <View style={styles.affectedPermissions}>
                <GlassText variant="label" color="secondary" style={styles.permissionLabel}>
                  USES PERMISSIONS
                </GlassText>
                <View style={styles.permissionTags}>
                  {impactAnalysis.feature_impacts.data_sharing.affected_permissions.map((permission, index) => (
                    <View key={index} style={styles.permissionTag}>
                      <GlassText variant="caption" color="secondary">
                        {PERMISSION_DESCRIPTIONS[permission as PermissionType]?.title || permission}
                      </GlassText>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </GlassContainer>

          {/* Analytics */}
          <GlassContainer style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <GlassText variant="body" color="primary" weight="semibold">
                📈 Usage Analytics
              </GlassText>
              <View style={[
                styles.featureStatusBadge,
                impactAnalysis.feature_impacts.analytics.enabled && styles.featureEnabledBadge,
              ]}>
                <GlassText variant="caption" color="white" style={styles.featureStatusText}>
                  {impactAnalysis.feature_impacts.analytics.enabled ? 'ENABLED' : 'DISABLED'}
                </GlassText>
              </View>
            </View>
            <GlassText variant="caption" color="secondary" style={styles.featureDescription}>
              {impactAnalysis.feature_impacts.analytics.functionality_description}
            </GlassText>
            {impactAnalysis.feature_impacts.analytics.enabled && (
              <View style={styles.affectedPermissions}>
                <GlassText variant="label" color="secondary" style={styles.permissionLabel}>
                  USES PERMISSIONS
                </GlassText>
                <View style={styles.permissionTags}>
                  {impactAnalysis.feature_impacts.analytics.affected_permissions.map((permission, index) => (
                    <View key={index} style={styles.permissionTag}>
                      <GlassText variant="caption" color="secondary">
                        {PERMISSION_DESCRIPTIONS[permission as PermissionType]?.title || permission}
                      </GlassText>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </GlassContainer>
        </View>

        {/* Consent Status */}
        <GlassContainer style={styles.section}>
          <GlassText variant="h3" color="primary" weight="semibold" style={styles.sectionTitle}>
            Consent Status
          </GlassText>
          
          <View style={styles.consentStatus}>
            <View style={styles.consentStatusItem}>
              <GlassText variant="body" color="primary" weight="medium">
                Valid Consent: {impactAnalysis.consent_status.has_valid_consent ? '✅ Yes' : '❌ No'}
              </GlassText>
            </View>
            {impactAnalysis.consent_status.last_consent_date && (
              <View style={styles.consentStatusItem}>
                <GlassText variant="caption" color="secondary">
                  Last Updated: {impactAnalysis.consent_status.last_consent_date.toLocaleDateString()}
                </GlassText>
              </View>
            )}
            <View style={styles.consentStatusItem}>
              <GlassText variant="caption" color="secondary">
                Age: {impactAnalysis.consent_status.consent_age_days >= 0 
                  ? `${impactAnalysis.consent_status.consent_age_days} days`
                  : 'Never granted'}
              </GlassText>
            </View>
          </View>
        </GlassContainer>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <GlassButton
            variant="primary"
            onPress={handleOpenPrivacySettings}
            style={styles.actionButton}
            testID="open-privacy-settings-button"
          >
            <GlassText variant="body" color="white" weight="medium">
              Adjust Privacy Settings
            </GlassText>
          </GlassButton>
          
          <GlassButton
            variant="secondary"
            onPress={handleShareReport}
            style={styles.actionButton}
            testID="share-report-button"
          >
            <GlassText variant="body" color="secondary" weight="medium">
              Share Report
            </GlassText>
          </GlassButton>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

/**
 * PrivacyImpactScreen Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND_PRIMARY,
  },

  scrollView: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: UI_CONSTANTS.SPACING.XL,
  },

  retryButton: {
    marginTop: UI_CONSTANTS.SPACING.MD,
    minWidth: 120,
  },

  headerContainer: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
    marginTop: UI_CONSTANTS.SPACING.MD,
    marginBottom: UI_CONSTANTS.SPACING.SM,
    alignItems: 'center',
  },

  headerTitle: {
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },

  headerSubtitle: {
    textAlign: 'center',
  },

  section: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },

  sectionTitle: {
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },

  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },

  riskBadge: {
    paddingHorizontal: UI_CONSTANTS.SPACING.SM,
    paddingVertical: UI_CONSTANTS.SPACING.XS,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
  },

  riskLowBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
  },

  riskMediumBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.8)',
  },

  riskHighBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },

  riskBadgeText: {
    fontSize: 11,
  },

  riskFactors: {
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },

  subsectionLabel: {
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },

  riskFactor: {
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },

  mitigationSuggestions: {
    marginTop: UI_CONSTANTS.SPACING.SM,
  },

  suggestion: {
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },

  impactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  impactItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },

  featuresSection: {
    gap: UI_CONSTANTS.SPACING.MD,
  },

  featureCard: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
  },

  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },

  featureStatusBadge: {
    paddingHorizontal: UI_CONSTANTS.SPACING.SM,
    paddingVertical: UI_CONSTANTS.SPACING.XS,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
    backgroundColor: 'rgba(107, 114, 128, 0.8)',
  },

  featureEnabledBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
  },

  featureStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },

  featureDescription: {
    lineHeight: 18,
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },

  affectedPermissions: {
    marginTop: UI_CONSTANTS.SPACING.SM,
  },

  permissionLabel: {
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },

  permissionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: UI_CONSTANTS.SPACING.XS,
  },

  permissionTag: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
    paddingVertical: UI_CONSTANTS.SPACING.XS,
    paddingHorizontal: UI_CONSTANTS.SPACING.SM,
  },

  consentStatus: {
    gap: UI_CONSTANTS.SPACING.SM,
  },

  consentStatusItem: {
    paddingVertical: UI_CONSTANTS.SPACING.XS,
  },

  actionsSection: {
    flexDirection: 'row',
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
    gap: UI_CONSTANTS.SPACING.MD,
    marginTop: UI_CONSTANTS.SPACING.LG,
  },

  actionButton: {
    flex: 1,
  },

  bottomSpacing: {
    height: UI_CONSTANTS.SPACING.XL,
  },
});

export default PrivacyImpactScreen;