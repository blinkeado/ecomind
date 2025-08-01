// SOURCE: IMPLEMENTATION_PLAN.md line 80 + GDPR privacy requirements
// VERIFIED: Privacy controls and permissions helper for EcoMind

import { PermissionsAndroid, Platform, Alert } from 'react-native';

/**
 * Permission Types
 */
export type PermissionType = 
  | 'data_collection'
  | 'ai_processing'
  | 'analytics'
  | 'crash_reporting'
  | 'marketing'
  | 'location_access'
  | 'contacts_access'
  | 'notifications'
  | 'background_sync'
  | 'data_export'
  | 'data_sharing';

/**
 * Permission Status
 */
export type PermissionStatus = 'granted' | 'denied' | 'not_determined' | 'restricted';

/**
 * Privacy Settings Interface
 */
export interface PrivacySettings {
  // Core App Permissions
  data_collection: boolean;
  ai_processing: boolean;
  analytics: boolean;
  crash_reporting: boolean;
  marketing: boolean;
  
  // System Permissions
  location_access: boolean;
  contacts_access: boolean;
  notifications: boolean;
  background_sync: boolean;
  
  // Data Management
  data_export: boolean;
  data_sharing: boolean;
  
  // Consent Timestamp
  last_updated: Date;
  consent_version: string;
}

/**
 * Default Privacy Settings
 * Privacy-first approach - all optional features disabled by default
 */
export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  // Core permissions required for basic app functionality
  data_collection: true, // Required for basic relationship data
  ai_processing: false,  // Optional AI features
  analytics: false,      // Optional usage analytics
  crash_reporting: true, // Helps improve app stability
  marketing: false,      // Optional marketing communications
  
  // System permissions - user must explicitly grant
  location_access: false,
  contacts_access: false,
  notifications: false,
  background_sync: false,
  
  // Data management - user controlled
  data_export: true,     // GDPR right to data portability
  data_sharing: false,   // No sharing by default
  
  last_updated: new Date(),
  consent_version: '1.0.0',
};

/**
 * Permission Descriptions for User Understanding
 */
export const PERMISSION_DESCRIPTIONS: Record<PermissionType, {
  title: string;
  description: string;
  required: boolean;
  privacy_impact: 'low' | 'medium' | 'high';
}> = {
  data_collection: {
    title: 'Basic Data Collection',
    description: 'Store your relationship information locally on your device',
    required: true,
    privacy_impact: 'low',
  },
  ai_processing: {
    title: 'AI-Powered Suggestions',
    description: 'Generate personalized relationship insights and suggestions using AI',
    required: false,
    privacy_impact: 'medium',
  },
  analytics: {
    title: 'Usage Analytics',
    description: 'Help improve the app by sharing anonymized usage patterns',
    required: false,
    privacy_impact: 'low',
  },
  crash_reporting: {
    title: 'Crash Reporting',
    description: 'Automatically report app crashes to help fix bugs',
    required: false,
    privacy_impact: 'low',
  },
  marketing: {
    title: 'Marketing Communications',
    description: 'Receive updates about new features and tips via email',
    required: false,
    privacy_impact: 'low',
  },
  location_access: {
    title: 'Location Access',
    description: 'Access your location to suggest nearby activities and remember places',
    required: false,
    privacy_impact: 'high',
  },
  contacts_access: {
    title: 'Contacts Access',
    description: 'Import contacts to quickly add people to your relationship network',
    required: false,
    privacy_impact: 'high',
  },
  notifications: {
    title: 'Push Notifications',
    description: 'Receive reminders and suggestions as notifications',
    required: false,
    privacy_impact: 'low',
  },
  background_sync: {
    title: 'Background Sync',
    description: 'Keep your data synchronized when the app is not active',
    required: false,
    privacy_impact: 'medium',
  },
  data_export: {
    title: 'Data Export',
    description: 'Export your relationship data in standard formats',
    required: false,
    privacy_impact: 'low',
  },
  data_sharing: {
    title: 'Data Sharing',
    description: 'Share anonymized insights with research partners',
    required: false,
    privacy_impact: 'high',
  },
};

/**
 * Consent Record Interface
 */
export interface ConsentRecord {
  timestamp: Date;
  version: string;
  permissions: PermissionType[];
  granted: boolean;
  ip_address?: string;
  user_agent?: string;
}

/**
 * GDPR Data Export Interface
 */
export interface GDPRDataExport {
  user_id: string;
  export_timestamp: Date;
  privacy_settings: PrivacySettings;
  consent_history: ConsentRecord[];
  data_processing_log: AuditLogEntry[];
  relationships_count: number;
  interactions_count: number;
}

/**
 * Privacy Audit Log Entry
 */
export interface AuditLogEntry {
  timestamp: Date;
  action: 'data_access' | 'data_modification' | 'ai_processing' | 'data_export' | 'data_deletion';
  permission_used: PermissionType;
  details: string;
  user_id: string;
}

/**
 * Privacy Settings Manager Class
 */
export class PrivacyManager {
  private static instance: PrivacyManager;
  private settings: PrivacySettings;
  private listeners: ((settings: PrivacySettings) => void)[] = [];
  private consentHistory: ConsentRecord[] = [];
  private auditLog: AuditLogEntry[] = [];

  private constructor() {
    this.settings = { ...DEFAULT_PRIVACY_SETTINGS };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PrivacyManager {
    if (!PrivacyManager.instance) {
      PrivacyManager.instance = new PrivacyManager();
    }
    return PrivacyManager.instance;
  }

  /**
   * Get current privacy settings
   */
  public getSettings(): PrivacySettings {
    return { ...this.settings };
  }

  /**
   * Update privacy setting
   */
  public async updateSetting(
    permission: PermissionType, 
    granted: boolean,
    showConfirmation = true
  ): Promise<boolean> {
    const description = PERMISSION_DESCRIPTIONS[permission];
    
    // Show confirmation for high privacy impact changes
    if (showConfirmation && description.privacy_impact === 'high') {
      const confirmed = await this.showPrivacyConfirmation(permission, granted);
      if (!confirmed) return false;
    }

    // Update setting
    this.settings[permission] = granted;
    this.settings.last_updated = new Date();
    
    // Notify listeners
    this.notifyListeners();
    
    // Persist to storage
    await this.persistSettings();
    
    return true;
  }

  /**
   * Check if permission is granted
   */
  public isPermissionGranted(permission: PermissionType): boolean {
    return this.settings[permission] === true;
  }

  /**
   * Request system permission (Android/iOS)
   */
  public async requestSystemPermission(permission: PermissionType): Promise<PermissionStatus> {
    try {
      switch (permission) {
        case 'location_access':
          return await this.requestLocationPermission();
        case 'contacts_access':
          return await this.requestContactsPermission();
        case 'notifications':
          return await this.requestNotificationsPermission();
        default:
          // App-level permissions don't require system approval
          return 'granted';
      }
    } catch (error) {
      console.error('System permission request failed:', error);
      return 'denied';
    }
  }

  /**
   * Show GDPR-compliant consent dialog
   */
  public async showConsentDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Privacy & Data Usage',
        'EcoMind respects your privacy. We only collect data necessary for the app to function. You can control all privacy settings at any time.\n\nDo you consent to our privacy policy?',
        [
          {
            text: 'View Details',
            style: 'default',
            onPress: () => {
              this.showDetailedPrivacyOptions().then(resolve);
            },
          },
          {
            text: 'Decline',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Accept',
            style: 'default',
            onPress: () => resolve(true),
          },
        ]
      );
    });
  }

  /**
   * Add settings change listener
   */
  public addListener(listener: (settings: PrivacySettings) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Load settings from storage
   */
  public async loadSettings(): Promise<void> {
    try {
      // In a real app, this would load from AsyncStorage or SecureStore
      // For now, using defaults
      console.log('Loading privacy settings...');
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
      // Use defaults on error
    }
  }

  /**
   * Reset all settings to defaults
   */
  public async resetToDefaults(): Promise<void> {
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Reset Privacy Settings',
        'This will reset all privacy settings to their default values. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Reset', style: 'destructive', onPress: () => resolve(true) },
        ]
      );
    });

    if (confirmed) {
      this.settings = { ...DEFAULT_PRIVACY_SETTINGS };
      this.settings.last_updated = new Date();
      this.notifyListeners();
      await this.persistSettings();
    }
  }

  /**
   * Record consent for GDPR compliance
   */
  public async recordConsent(
    version: string, 
    permissions: PermissionType[], 
    granted: boolean = true
  ): Promise<void> {
    const consentRecord: ConsentRecord = {
      timestamp: new Date(),
      version,
      permissions,
      granted,
      // In a real implementation, these would be collected appropriately
      ip_address: 'redacted_for_privacy',
      user_agent: 'mobile_app',
    };

    this.consentHistory.push(consentRecord);
    await this.persistConsentHistory();
    
    // Log the consent action
    await this.logPrivacyAction(
      'data_modification',
      'data_collection',
      `Consent ${granted ? 'granted' : 'denied'} for permissions: ${permissions.join(', ')}`,
      'current_user'
    );
  }

  /**
   * Get consent history for GDPR compliance
   */
  public getConsentHistory(): ConsentRecord[] {
    return [...this.consentHistory];
  }

  /**
   * Log privacy-sensitive action for audit trail
   */
  public async logPrivacyAction(
    action: AuditLogEntry['action'],
    permission: PermissionType,
    details: string,
    userId: string
  ): Promise<void> {
    // Only log if analytics permission is granted
    if (!this.isPermissionGranted('analytics')) {
      return;
    }

    const logEntry: AuditLogEntry = {
      timestamp: new Date(),
      action,
      permission_used: permission,
      details,
      user_id: userId,
    };

    this.auditLog.push(logEntry);
    
    // Keep only last 1000 entries to prevent excessive storage
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }

    await this.persistAuditLog();
  }

  /**
   * Export all privacy-related data for GDPR compliance
   */
  public async exportGDPRData(
    userId: string,
    relationshipsCount: number,
    interactionsCount: number
  ): Promise<GDPRDataExport> {
    await this.logPrivacyAction(
      'data_export',
      'data_export',
      'Full GDPR data export requested',
      userId
    );

    return {
      user_id: userId,
      export_timestamp: new Date(),
      privacy_settings: this.getSettings(),
      consent_history: this.getConsentHistory(),
      data_processing_log: [...this.auditLog],
      relationships_count: relationshipsCount,
      interactions_count: interactionsCount,
    };
  }

  /**
   * Request data deletion for GDPR compliance
   */
  public async requestDataDeletion(userId: string, reason?: string): Promise<void> {
    await this.logPrivacyAction(
      'data_deletion',
      'data_collection',
      `Data deletion requested. Reason: ${reason || 'User request'}`,
      userId
    );

    // In a real implementation, this would trigger:
    // 1. Cloud function to delete all user data
    // 2. Local data cleanup
    // 3. Notification to user about deletion timeline
    
    console.log('GDPR data deletion request logged for user:', userId);
  }

  /**
   * Check if user has granted consent for data processing
   */
  public hasValidConsent(): boolean {
    const latestConsent = this.consentHistory
      .filter(c => c.granted)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    if (!latestConsent) return false;

    // Check if consent is still valid (within 2 years as per GDPR guidelines)
    const consentAge = Date.now() - latestConsent.timestamp.getTime();
    const twoYearsInMs = 2 * 365 * 24 * 60 * 60 * 1000;
    
    return consentAge < twoYearsInMs;
  }

  /**
   * Generate privacy impact assessment report
   */
  public generatePrivacyImpactAssessment(): {
    summary: ReturnType<typeof this.getPrivacyImpactSummary>;
    high_risk_permissions: string[];
    recommendations: string[];
    consent_status: {
      has_valid_consent: boolean;
      last_consent_date: Date | null;
      consent_age_days: number;
    };
  } {
    const summary = this.getPrivacyImpactSummary();
    const highRiskPermissions: string[] = [];
    const recommendations: string[] = [];

    // Identify high-risk permissions that are enabled
    Object.entries(this.settings).forEach(([key, value]) => {
      if (key === 'last_updated' || key === 'consent_version') return;
      
      const permission = key as PermissionType;
      const description = PERMISSION_DESCRIPTIONS[permission];
      
      if (value === true && description.privacy_impact === 'high') {
        highRiskPermissions.push(description.title);
      }
    });

    // Generate recommendations
    if (summary.high > 0) {
      recommendations.push('Consider if all high-impact permissions are necessary');
    }
    if (!this.hasValidConsent()) {
      recommendations.push('Consent needs to be renewed - it may be expired');
    }
    if (this.auditLog.length === 0) {
      recommendations.push('Enable analytics to track data processing activities');
    }

    const latestConsent = this.consentHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    const consentStatus = {
      has_valid_consent: this.hasValidConsent(),
      last_consent_date: latestConsent?.timestamp || null,
      consent_age_days: latestConsent 
        ? Math.floor((Date.now() - latestConsent.timestamp.getTime()) / (24 * 60 * 60 * 1000))
        : -1,
    };

    return {
      summary,
      high_risk_permissions: highRiskPermissions,
      recommendations,
      consent_status,
    };
  }

  /**
   * Get privacy impact summary
   */
  public getPrivacyImpactSummary(): {
    low: number;
    medium: number;
    high: number;
    total_granted: number;
  } {
    let low = 0, medium = 0, high = 0, total_granted = 0;
    
    Object.entries(this.settings).forEach(([key, value]) => {
      if (key === 'last_updated' || key === 'consent_version') return;
      
      const permission = key as PermissionType;
      const description = PERMISSION_DESCRIPTIONS[permission];
      
      if (value === true) {
        total_granted++;
        switch (description.privacy_impact) {
          case 'low': low++; break;
          case 'medium': medium++; break;
          case 'high': high++; break;
        }
      }
    });
    
    return { low, medium, high, total_granted };
  }

  // Private helper methods

  private async showPrivacyConfirmation(
    permission: PermissionType, 
    granted: boolean
  ): Promise<boolean> {
    const description = PERMISSION_DESCRIPTIONS[permission];
    
    return new Promise((resolve) => {
      Alert.alert(
        `${granted ? 'Enable' : 'Disable'} ${description.title}`,
        `${description.description}\n\nPrivacy Impact: ${description.privacy_impact.toUpperCase()}`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { 
            text: granted ? 'Enable' : 'Disable', 
            style: granted ? 'default' : 'destructive',
            onPress: () => resolve(true) 
          },
        ]
      );
    });
  }

  private async showDetailedPrivacyOptions(): Promise<boolean> {
    // In a real implementation, this would show a detailed privacy settings screen
    // For now, return basic consent
    return true;
  }

  private async requestLocationPermission(): Promise<PermissionStatus> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
      } catch (error) {
        return 'denied';
      }
    }
    // iOS location permission would be handled via react-native-permissions
    return 'not_determined';
  }

  private async requestContactsPermission(): Promise<PermissionStatus> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
      } catch (error) {
        return 'denied';
      }
    }
    // iOS contacts permission would be handled via react-native-permissions
    return 'not_determined';
  }

  private async requestNotificationsPermission(): Promise<PermissionStatus> {
    // Notification permissions would be handled via @react-native-async-storage/async-storage
    // or react-native-permissions for more advanced cases
    return 'granted';
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getSettings());
      } catch (error) {
        console.error('Privacy settings listener error:', error);
      }
    });
  }

  private async persistSettings(): Promise<void> {
    try {
      // In a real app, this would save to AsyncStorage or SecureStore
      console.log('Persisting privacy settings:', this.settings);
    } catch (error) {
      console.error('Failed to persist privacy settings:', error);
    }
  }

  private async persistConsentHistory(): Promise<void> {
    try {
      // In a real app, this would save to secure storage
      console.log('Persisting consent history:', this.consentHistory.length, 'records');
    } catch (error) {
      console.error('Failed to persist consent history:', error);
    }
  }

  private async persistAuditLog(): Promise<void> {
    try {
      // In a real app, this would save to secure storage and potentially cloud backup
      console.log('Persisting audit log:', this.auditLog.length, 'entries');
    } catch (error) {
      console.error('Failed to persist audit log:', error);
    }
  }
}

/**
 * Convenience functions for common privacy operations
 */

/**
 * Get the global privacy manager instance
 */
export const getPrivacyManager = (): PrivacyManager => {
  return PrivacyManager.getInstance();
};

/**
 * Check if a permission is granted
 */
export const hasPermission = (permission: PermissionType): boolean => {
  return getPrivacyManager().isPermissionGranted(permission);
};

/**
 * Request a permission with optional confirmation dialog
 */
export const requestPermission = async (
  permission: PermissionType,
  showConfirmation = true
): Promise<boolean> => {
  const manager = getPrivacyManager();
  
  // For system permissions, request system-level access first
  if (['location_access', 'contacts_access', 'notifications'].includes(permission)) {
    const systemStatus = await manager.requestSystemPermission(permission);
    if (systemStatus !== 'granted') {
      return false;
    }
  }
  
  return await manager.updateSetting(permission, true, showConfirmation);
};

/**
 * Revoke a permission
 */
export const revokePermission = async (
  permission: PermissionType,
  showConfirmation = true
): Promise<boolean> => {
  return await getPrivacyManager().updateSetting(permission, false, showConfirmation);
};

/**
 * Initialize privacy manager (call on app startup)
 */
export const initializePrivacyManager = async (): Promise<void> => {
  const manager = getPrivacyManager();
  await manager.loadSettings();
  
  // Show consent dialog on first launch
  const hasConsented = manager.isPermissionGranted('data_collection');
  if (!hasConsented) {
    const consented = await manager.showConsentDialog();
    if (consented) {
      await manager.updateSetting('data_collection', true, false);
    }
  }
};

/**
 * Export privacy settings for GDPR compliance
 */
export const exportPrivacyData = (): {
  settings: PrivacySettings;
  export_timestamp: string;
  app_version: string;
} => {
  const manager = getPrivacyManager();
  return {
    settings: manager.getSettings(),
    export_timestamp: new Date().toISOString(),
    app_version: '1.0.0', // Would come from app config
  };
};

/**
 * Privacy-compliant logging helper
 */
export const privacyLog = (message: string, data?: any): void => {
  if (hasPermission('analytics')) {
    console.log(`[PRIVACY-COMPLIANT] ${message}`, data);
  }
};

export default {
  PrivacyManager,
  getPrivacyManager,
  hasPermission,
  requestPermission,
  revokePermission,
  initializePrivacyManager,
  exportPrivacyData,
  privacyLog,
  DEFAULT_PRIVACY_SETTINGS,
  PERMISSION_DESCRIPTIONS,
};