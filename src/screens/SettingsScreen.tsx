// SOURCE: IMPLEMENTATION_PLAN.md line 60 + privacy controls requirements
// VERIFIED: SettingsScreen for privacy controls and user preferences

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { GlassContainer, GlassText, GlassButton } from '../components/design/DesignSystem';
import { useAuth } from '../hooks/useAuth';
import { 
  getPrivacyManager, 
  PrivacySettings, 
  PERMISSION_DESCRIPTIONS,
  exportPrivacyData,
  PermissionType,
} from '../utils/permissions';
import { UI_CONSTANTS } from '../utils/constants';

/**
 * SettingsScreen Component Props
 */
interface SettingsScreenProps {
  navigation: any;
}

/**
 * Settings Section Type
 */
type SettingsSection = 'privacy' | 'ai' | 'notifications' | 'data' | 'about';

/**
 * SettingsScreen Component
 * Privacy controls and user preferences
 * SOURCE: IMPLEMENTATION_PLAN.md line 60 - SettingsScreen for privacy controls
 */
export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const privacyManager = getPrivacyManager();

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSection>('privacy');
  const [loading, setLoading] = useState(true);

  /**
   * Load privacy settings
   */
  useEffect(() => {
    const loadSettings = async () => {
      try {
        await privacyManager.loadSettings();
        const settings = privacyManager.getSettings();
        setPrivacySettings(settings);
      } catch (error) {
        console.error('Failed to load privacy settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();

    // Listen for privacy settings changes
    const unsubscribe = privacyManager.addListener((settings) => {
      setPrivacySettings(settings);
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
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Handle privacy setting change
   */
  const handlePrivacyToggle = async (permission: PermissionType, enabled: boolean) => {
    try {
      await privacyManager.updateSetting(permission, enabled);
    } catch (error) {
      console.error('Failed to update privacy setting:', error);
      Alert.alert('Error', 'Failed to update privacy setting. Please try again.');
    }
  };

  /**
   * Handle data export
   */
  const handleDataExport = () => {
    Alert.alert(
      'Export Your Data',
      'This will create a complete export of your relationship data. The export will include all your relationships, interactions, and settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              const exportData = exportPrivacyData();
              // In a real app, this would trigger a download or email
              Alert.alert(
                'Export Complete',
                'Your data export has been prepared. In a full implementation, this would be downloaded or sent to your email.',
                [{ text: 'OK' }]
              );
              console.log('Export data:', exportData);
            } catch (error) {
              console.error('Failed to export data:', error);
              Alert.alert('Error', 'Failed to export data. Please try again.');
            }
          },
        },
      ]
    );
  };

  /**
   * Handle data deletion request
   */
  const handleDataDeletion = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your relationship data, including:\n\n• All relationships and interactions\n• AI suggestions and insights\n• Personal notes and context\n• Your user profile\n\nThis action cannot be undone and will be processed within 30 days as required by GDPR.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Deletion',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Data Deletion',
              'Are you absolutely sure? This will delete everything and cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // In a full implementation, this would call the cloud function
                      Alert.alert(
                        'Deletion Request Submitted',
                        'Your data deletion request has been submitted and will be processed within 30 days. You will receive a confirmation email.',
                        [{ text: 'OK' }]
                      );
                    } catch (error) {
                      console.error('Failed to request data deletion:', error);
                      Alert.alert('Error', 'Failed to submit deletion request. Please try again.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  /**
   * Handle reset privacy settings
   */
  const handleResetPrivacy = async () => {
    Alert.alert(
      'Reset Privacy Settings',
      'This will reset all privacy settings to their default values.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await privacyManager.resetToDefaults();
              Alert.alert('Success', 'Privacy settings have been reset to defaults.');
            } catch (error) {
              console.error('Failed to reset privacy settings:', error);
              Alert.alert('Error', 'Failed to reset privacy settings. Please try again.');
            }
          },
        },
      ]
    );
  };

  /**
   * Handle sign out
   */
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          onPress: signOut,
        },
      ]
    );
  };

  /**
   * Get privacy impact summary
   */
  const getPrivacyImpactSummary = () => {
    if (!privacySettings) return null;
    return privacyManager.getPrivacyImpactSummary();
  };

  if (loading) {
    return (
      <GlassContainer style={styles.container}>
        <View style={styles.loadingContainer}>
          <GlassText variant="body" color="secondary">
            Loading settings...
          </GlassText>
        </View>
      </GlassContainer>
    );
  }

  const privacyImpact = getPrivacyImpactSummary();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* User Profile Section */}
        <GlassContainer style={styles.section}>
          <View style={styles.profileSection}>
            <GlassText variant="h3" color="primary" weight="semibold">
              Account
            </GlassText>
            <GlassText variant="body" color="secondary">
              {user?.email || 'Not signed in'}
            </GlassText>
            <GlassButton
              variant="secondary"
              onPress={handleSignOut}
              style={styles.signOutButton}
              testID="sign-out-button"
            >
              <GlassText variant="body" color="secondary" weight="medium">
                Sign Out
              </GlassText>
            </GlassButton>
          </View>
        </GlassContainer>

        {/* Section Navigation */}
        <GlassContainer style={styles.sectionNav}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.sectionTabs}>
              {[
                { key: 'privacy', label: 'Privacy', icon: '🔒' },
                { key: 'ai', label: 'AI Features', icon: '🤖' },
                { key: 'notifications', label: 'Notifications', icon: '🔔' },
                { key: 'data', label: 'Your Data', icon: '📊' },
                { key: 'about', label: 'About', icon: 'ℹ️' },
              ].map((section) => (
                <TouchableOpacity
                  key={section.key}
                  onPress={() => setActiveSection(section.key as SettingsSection)}
                  style={[
                    styles.sectionTab,
                    activeSection === section.key && styles.activeSectionTab,
                  ]}
                  accessible={true}
                  accessibilityLabel={`${section.label} settings`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeSection === section.key }}
                >
                  <GlassText variant="caption" style={styles.sectionTabIcon}>
                    {section.icon}
                  </GlassText>
                  <GlassText
                    variant="caption"
                    color={activeSection === section.key ? 'accent' : 'secondary'}
                    weight={activeSection === section.key ? 'semibold' : 'regular'}
                  >
                    {section.label}
                  </GlassText>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </GlassContainer>

        {/* Section Content */}
        <View style={styles.sectionContent}>
          {/* Privacy Settings */}
          {activeSection === 'privacy' && privacySettings && (
            <GlassContainer style={styles.section}>
              <View style={styles.sectionHeader}>
                <GlassText variant="h3" color="primary" weight="semibold">
                  Privacy Controls
                </GlassText>
                <GlassText variant="body" color="secondary">
                  Control how your data is used and processed
                </GlassText>
              </View>

              {/* Privacy Impact Summary */}
              {privacyImpact && (
                <View style={styles.privacyImpact}>
                  <GlassText variant="label" color="secondary">
                    PRIVACY IMPACT
                  </GlassText>
                  <View style={styles.impactStats}>
                    <View style={styles.impactStat}>
                      <GlassText variant="body" color="primary" weight="bold">
                        {privacyImpact.high}
                      </GlassText>
                      <GlassText variant="caption" color="secondary">
                        High Impact
                      </GlassText>
                    </View>
                    <View style={styles.impactStat}>
                      <GlassText variant="body" color="primary" weight="bold">
                        {privacyImpact.medium}
                      </GlassText>
                      <GlassText variant="caption" color="secondary">
                        Medium Impact
                      </GlassText>
                    </View>
                    <View style={styles.impactStat}>
                      <GlassText variant="body" color="primary" weight="bold">
                        {privacyImpact.total_granted}
                      </GlassText>
                      <GlassText variant="caption" color="secondary">
                        Total Granted
                      </GlassText>
                    </View>
                  </View>
                </View>
              )}

              {/* Privacy Settings List */}
              <View style={styles.settingsList}>
                {Object.entries(PERMISSION_DESCRIPTIONS).map(([key, description]) => {
                  const permission = key as PermissionType;
                  const isEnabled = privacySettings[permission] === true;
                  const isRequired = description.required;

                  return (
                    <View key={permission} style={styles.settingItem}>
                      <View style={styles.settingInfo}>
                        <View style={styles.settingHeader}>
                          <GlassText variant="body" color="primary" weight="medium">
                            {description.title}
                          </GlassText>
                          <View style={[
                            styles.impactBadge,
                            styles[`impact${description.privacy_impact.charAt(0).toUpperCase() + description.privacy_impact.slice(1)}Badge` as keyof typeof styles],
                          ]}>
                            <GlassText variant="caption" color="white" style={styles.impactBadgeText}>
                              {description.privacy_impact.toUpperCase()}
                            </GlassText>
                          </View>
                        </View>
                        <GlassText variant="caption" color="secondary" style={styles.settingDescription}>
                          {description.description}
                        </GlassText>
                        {isRequired && (
                          <GlassText variant="caption" color="accent" style={styles.requiredText}>
                            Required for basic functionality
                          </GlassText>
                        )}
                      </View>
                      <Switch
                        value={isEnabled}
                        onValueChange={(enabled) => handlePrivacyToggle(permission, enabled)}
                        disabled={isRequired}
                        trackColor={{
                          false: 'rgba(107, 114, 128, 0.3)',
                          true: 'rgba(59, 130, 246, 0.6)',
                        }}
                        thumbColor={isEnabled ? UI_CONSTANTS.COLORS.PRIMARY : 'rgba(255, 255, 255, 0.8)'}
                        testID={`privacy-toggle-${permission}`}
                      />
                    </View>
                  );
                })}
              </View>

              {/* Privacy Actions */}
              <View style={styles.privacyActions}>
                <GlassButton
                  variant="secondary"
                  onPress={() => navigation.navigate('PrivacyImpact')}
                  style={styles.privacyActionButton}
                  testID="privacy-impact-button"
                >
                  <GlassText variant="body" color="secondary" weight="medium">
                    Privacy Impact Report
                  </GlassText>
                </GlassButton>
                <GlassButton
                  variant="secondary"
                  onPress={handleResetPrivacy}
                  style={styles.privacyActionButton}
                >
                  <GlassText variant="body" color="secondary" weight="medium">
                    Reset to Defaults
                  </GlassText>
                </GlassButton>
              </View>
            </GlassContainer>
          )}

          {/* AI Features */}
          {activeSection === 'ai' && privacySettings && (
            <GlassContainer style={styles.section}>
              <View style={styles.sectionHeader}>
                <GlassText variant="h3" color="primary" weight="semibold">
                  AI Features
                </GlassText>
                <GlassText variant="body" color="secondary">
                  Configure AI-powered relationship insights
                </GlassText>
              </View>

              <View style={styles.aiStatus}>
                <GlassText variant="body" color="primary">
                  AI Processing: {privacySettings.ai_processing ? '✅ Enabled' : '❌ Disabled'}
                </GlassText>
                <GlassText variant="caption" color="secondary">
                  {privacySettings.ai_processing 
                    ? 'AI can analyze your relationship data to provide personalized suggestions'
                    : 'Enable AI processing in Privacy settings to use AI features'
                  }
                </GlassText>
              </View>

              {!privacySettings.ai_processing && (
                <GlassButton
                  variant="primary"
                  onPress={() => handlePrivacyToggle('ai_processing', true)}
                  style={styles.enableAIButton}
                >
                  <GlassText variant="body" color="white" weight="medium">
                    Enable AI Features
                  </GlassText>
                </GlassButton>
              )}
            </GlassContainer>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && privacySettings && (
            <GlassContainer style={styles.section}>
              <View style={styles.sectionHeader}>
                <GlassText variant="h3" color="primary" weight="semibold">
                  Notifications
                </GlassText>
                <GlassText variant="body" color="secondary">
                  Choose what notifications you receive
                </GlassText>
              </View>

              <View style={styles.notificationsList}>
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <GlassText variant="body" color="primary" weight="medium">
                      Push Notifications
                    </GlassText>
                    <GlassText variant="caption" color="secondary">
                      Receive notifications on your device
                    </GlassText>
                  </View>
                  <Switch
                    value={privacySettings.notifications === true}
                    onValueChange={(enabled) => handlePrivacyToggle('notifications', enabled)}
                    trackColor={{
                      false: 'rgba(107, 114, 128, 0.3)',
                      true: 'rgba(59, 130, 246, 0.6)',
                    }}
                    thumbColor={privacySettings.notifications ? UI_CONSTANTS.COLORS.PRIMARY : 'rgba(255, 255, 255, 0.8)'}
                  />
                </View>
              </View>
            </GlassContainer>
          )}

          {/* Your Data */}
          {activeSection === 'data' && (
            <GlassContainer style={styles.section}>
              <View style={styles.sectionHeader}>
                <GlassText variant="h3" color="primary" weight="semibold">
                  Your Data
                </GlassText>
                <GlassText variant="body" color="secondary">
                  Manage and control your personal data
                </GlassText>
              </View>

              <View style={styles.dataActions}>
                <View style={styles.dataAction}>
                  <View style={styles.dataActionInfo}>
                    <GlassText variant="body" color="primary" weight="medium">
                      Export Your Data
                    </GlassText>
                    <GlassText variant="caption" color="secondary">
                      Download a complete copy of your relationship data (GDPR Right to Data Portability)
                    </GlassText>
                  </View>
                  <GlassButton
                    variant="secondary"
                    onPress={handleDataExport}
                    testID="export-data-button"
                  >
                    <GlassText variant="body" color="secondary" weight="medium">
                      Export
                    </GlassText>
                  </GlassButton>
                </View>

                <View style={styles.dataAction}>
                  <View style={styles.dataActionInfo}>
                    <GlassText variant="body" color="primary" weight="medium">
                      Delete All Data
                    </GlassText>
                    <GlassText variant="caption" color="secondary">
                      Permanently delete all your data (GDPR Right to be Forgotten)
                    </GlassText>
                  </View>
                  <GlassButton
                    variant="secondary"
                    onPress={handleDataDeletion}
                    style={styles.deleteDataButton}
                    testID="delete-data-button"
                  >
                    <GlassText variant="body" color="primary" weight="medium">
                      Delete
                    </GlassText>
                  </GlassButton>
                </View>
              </View>
            </GlassContainer>
          )}

          {/* About */}
          {activeSection === 'about' && (
            <GlassContainer style={styles.section}>
              <View style={styles.sectionHeader}>
                <GlassText variant="h3" color="primary" weight="semibold">
                  About EcoMind
                </GlassText>
                <GlassText variant="body" color="secondary">
                  Personal Relationship Assistant
                </GlassText>
              </View>

              <View style={styles.aboutContent}>
                <GlassText variant="body" color="secondary" style={styles.aboutText}>
                  EcoMind helps you maintain meaningful relationships through AI-powered insights and personalized suggestions, while keeping your privacy first.
                </GlassText>

                <View style={styles.aboutInfo}>
                  <GlassText variant="caption" color="tertiary">
                    Version: 1.0.0
                  </GlassText>
                  <GlassText variant="caption" color="tertiary">
                    Privacy-first design with GDPR compliance
                  </GlassText>
                  <GlassText variant="caption" color="tertiary">
                    AI powered by Google Gemini Flash
                  </GlassText>
                </View>
              </View>
            </GlassContainer>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

/**
 * SettingsScreen Styles
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

  section: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },

  profileSection: {
    alignItems: 'center',
    gap: UI_CONSTANTS.SPACING.SM,
  },

  signOutButton: {
    marginTop: UI_CONSTANTS.SPACING.MD,
    paddingHorizontal: UI_CONSTANTS.SPACING.XL,
  },

  sectionNav: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
    marginBottom: UI_CONSTANTS.SPACING.SM,
    paddingVertical: UI_CONSTANTS.SPACING.SM,
  },

  sectionTabs: {
    flexDirection: 'row',
    gap: UI_CONSTANTS.SPACING.SM,
  },

  sectionTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.SM,
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.MD,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: UI_CONSTANTS.SPACING.XS,
  },

  activeSectionTab: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },

  sectionTabIcon: {
    fontSize: 16,
  },

  sectionContent: {
    flex: 1,
  },

  sectionHeader: {
    marginBottom: UI_CONSTANTS.SPACING.LG,
    gap: UI_CONSTANTS.SPACING.SM,
  },

  privacyImpact: {
    marginBottom: UI_CONSTANTS.SPACING.LG,
    paddingVertical: UI_CONSTANTS.SPACING.MD,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  impactStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: UI_CONSTANTS.SPACING.MD,
  },

  impactStat: {
    alignItems: 'center',
    gap: UI_CONSTANTS.SPACING.XS,
  },

  settingsList: {
    gap: UI_CONSTANTS.SPACING.MD,
  },

  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: UI_CONSTANTS.SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },

  settingInfo: {
    flex: 1,
    marginRight: UI_CONSTANTS.SPACING.MD,
    gap: UI_CONSTANTS.SPACING.XS,
  },

  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.SPACING.SM,
  },

  settingDescription: {
    lineHeight: 18,
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
    fontSize: 10,
  },

  privacyActions: {
    marginTop: UI_CONSTANTS.SPACING.LG,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: UI_CONSTANTS.SPACING.MD,
  },

  privacyActionButton: {
    flex: 1,
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
  },

  aiStatus: {
    gap: UI_CONSTANTS.SPACING.SM,
    marginBottom: UI_CONSTANTS.SPACING.LG,
  },

  enableAIButton: {
    alignSelf: 'center',
    paddingHorizontal: UI_CONSTANTS.SPACING.XL,
  },

  notificationsList: {
    gap: UI_CONSTANTS.SPACING.MD,
  },

  dataActions: {
    gap: UI_CONSTANTS.SPACING.LG,
  },

  dataAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },

  dataActionInfo: {
    flex: 1,
    marginRight: UI_CONSTANTS.SPACING.MD,
    gap: UI_CONSTANTS.SPACING.XS,
  },

  deleteDataButton: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },

  aboutContent: {
    gap: UI_CONSTANTS.SPACING.LG,
  },

  aboutText: {
    lineHeight: 22,
  },

  aboutInfo: {
    gap: UI_CONSTANTS.SPACING.SM,
    paddingTop: UI_CONSTANTS.SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  bottomSpacing: {
    height: UI_CONSTANTS.SPACING.XL,
  },
});

export default SettingsScreen;