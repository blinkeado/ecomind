// SOURCE: Phase 7 Testing - Comprehensive test suite for privacy controls
// VERIFIED: Unit tests for PrivacyManager and GDPR compliance features

import { 
  PrivacyManager, 
  getPrivacyManager, 
  hasPermission,
  DEFAULT_PRIVACY_SETTINGS,
  PERMISSION_DESCRIPTIONS,
  PermissionType,
  ConsentRecord,
  GDPRDataExport,
} from '../../src/utils/permissions';

// Mock React Native Alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn((title, message, buttons) => {
      // Simulate user accepting alerts for testing
      const confirmButton = buttons?.find((btn: any) => btn.text !== 'Cancel' && btn.text !== 'Decline');
      if (confirmButton?.onPress) {
        confirmButton.onPress();
      }
    }),
  },
  Platform: {
    OS: 'ios',
  },
  PermissionsAndroid: {
    request: jest.fn().mockResolvedValue('granted'),
    PERMISSIONS: {
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
      READ_CONTACTS: 'android.permission.READ_CONTACTS',
    },
    RESULTS: {
      GRANTED: 'granted',
      DENIED: 'denied',
    },
  },
}));

describe('PrivacyManager', () => {
  let privacyManager: PrivacyManager;

  beforeEach(() => {
    // Get fresh instance for each test
    privacyManager = getPrivacyManager();
    
    // Reset to default settings
    privacyManager['settings'] = { ...DEFAULT_PRIVACY_SETTINGS };
    privacyManager['consentHistory'] = [];
    privacyManager['auditLog'] = [];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const instance1 = getPrivacyManager();
      const instance2 = getPrivacyManager();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Default Settings', () => {
    test('should initialize with privacy-first defaults', () => {
      const settings = privacyManager.getSettings();
      
      // Core required permissions should be enabled
      expect(settings.data_collection).toBe(true);
      expect(settings.crash_reporting).toBe(true);
      expect(settings.data_export).toBe(true);
      
      // Optional permissions should be disabled by default
      expect(settings.ai_processing).toBe(false);
      expect(settings.analytics).toBe(false);
      expect(settings.marketing).toBe(false);
      expect(settings.location_access).toBe(false);
      expect(settings.contacts_access).toBe(false);
      expect(settings.data_sharing).toBe(false);
    });

    test('should have valid consent version and timestamp', () => {
      const settings = privacyManager.getSettings();
      expect(settings.consent_version).toBe('1.0.0');
      expect(settings.last_updated).toBeInstanceOf(Date);
    });
  });

  describe('Permission Management', () => {
    test('should grant permission correctly', async () => {
      const result = await privacyManager.updateSetting('ai_processing', true, false);
      expect(result).toBe(true);
      expect(privacyManager.isPermissionGranted('ai_processing')).toBe(true);
    });

    test('should revoke permission correctly', async () => {
      await privacyManager.updateSetting('ai_processing', true, false);
      const result = await privacyManager.updateSetting('ai_processing', false, false);
      expect(result).toBe(true);
      expect(privacyManager.isPermissionGranted('ai_processing')).toBe(false);
    });

    test('should update timestamp when changing settings', async () => {
      const originalTimestamp = privacyManager.getSettings().last_updated;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await privacyManager.updateSetting('analytics', true, false);
      const newTimestamp = privacyManager.getSettings().last_updated;
      
      expect(newTimestamp.getTime()).toBeGreaterThan(originalTimestamp.getTime());
    });

    test('should handle high-impact permission confirmation', async () => {
      // This will trigger the confirmation dialog (mocked to accept)
      const result = await privacyManager.updateSetting('location_access', true, true);
      expect(result).toBe(true);
      expect(privacyManager.isPermissionGranted('location_access')).toBe(true);
    });

    test('should handle required permissions correctly', () => {
      // Required permissions should not be revokable
      expect(PERMISSION_DESCRIPTIONS.data_collection.required).toBe(true);
      expect(PERMISSION_DESCRIPTIONS.ai_processing.required).toBe(false);
    });
  });

  describe('Consent Management', () => {
    test('should record consent correctly', async () => {
      const permissions: PermissionType[] = ['ai_processing', 'analytics'];
      await privacyManager.recordConsent('1.0.0', permissions, true);
      
      const consentHistory = privacyManager.getConsentHistory();
      expect(consentHistory).toHaveLength(1);
      
      const consent = consentHistory[0];
      expect(consent.version).toBe('1.0.0');
      expect(consent.permissions).toEqual(permissions);
      expect(consent.granted).toBe(true);
      expect(consent.timestamp).toBeInstanceOf(Date);
    });

    test('should record consent refusal', async () => {
      const permissions: PermissionType[] = ['ai_processing'];
      await privacyManager.recordConsent('1.0.0', permissions, false);
      
      const consentHistory = privacyManager.getConsentHistory();
      expect(consentHistory).toHaveLength(1);
      
      const consent = consentHistory[0];
      expect(consent.granted).toBe(false);
    });

    test('should validate consent age correctly', async () => {
      // Record fresh consent
      await privacyManager.recordConsent('1.0.0', ['ai_processing'], true);
      expect(privacyManager.hasValidConsent()).toBe(true);
      
      // Simulate old consent (over 2 years)
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 3);
      privacyManager['consentHistory'] = [{
        timestamp: oldDate,
        version: '1.0.0',
        permissions: ['ai_processing'],
        granted: true,
      }];
      
      expect(privacyManager.hasValidConsent()).toBe(false);
    });

    test('should handle multiple consent records', async () => {
      await privacyManager.recordConsent('1.0.0', ['ai_processing'], true);
      await privacyManager.recordConsent('1.0.0', ['analytics'], true);
      await privacyManager.recordConsent('1.0.0', ['ai_processing'], false);
      
      const consentHistory = privacyManager.getConsentHistory();
      expect(consentHistory).toHaveLength(3);
      
      // Should still have valid consent from analytics
      expect(privacyManager.hasValidConsent()).toBe(true);
    });
  });

  describe('Privacy Audit Logging', () => {
    test('should log privacy actions when analytics enabled', async () => {
      await privacyManager.updateSetting('analytics', true, false);
      
      await privacyManager.logPrivacyAction(
        'ai_processing',
        'ai_processing',
        'Test AI processing action',
        'test-user-123'
      );
      
      const auditLog = privacyManager['auditLog'];
      expect(auditLog).toHaveLength(1);
      
      const logEntry = auditLog[0];
      expect(logEntry.action).toBe('ai_processing');
      expect(logEntry.permission_used).toBe('ai_processing');
      expect(logEntry.details).toBe('Test AI processing action');
      expect(logEntry.user_id).toBe('test-user-123');
      expect(logEntry.timestamp).toBeInstanceOf(Date);
    });

    test('should not log when analytics disabled', async () => {
      await privacyManager.updateSetting('analytics', false, false);
      
      await privacyManager.logPrivacyAction(
        'ai_processing',
        'ai_processing',
        'Test action',
        'test-user-123'
      );
      
      const auditLog = privacyManager['auditLog'];
      expect(auditLog).toHaveLength(0);
    });

    test('should limit audit log size', async () => {
      await privacyManager.updateSetting('analytics', true, false);
      
      // Add 1001 log entries
      for (let i = 0; i < 1001; i++) {
        await privacyManager.logPrivacyAction(
          'data_access',
          'data_collection',
          `Test action ${i}`,
          'test-user-123'
        );
      }
      
      const auditLog = privacyManager['auditLog'];
      expect(auditLog).toHaveLength(1000); // Should be limited to 1000
    });
  });

  describe('GDPR Data Export', () => {
    test('should generate complete GDPR export', async () => {
      // Set up some data
      await privacyManager.updateSetting('ai_processing', true, false);
      await privacyManager.recordConsent('1.0.0', ['ai_processing'], true);
      await privacyManager.logPrivacyAction(
        'data_export',
        'data_export',
        'Export requested',
        'test-user-123'
      );
      
      const exportData = await privacyManager.exportGDPRData(
        'test-user-123',
        5, // relationships count
        25 // interactions count
      );
      
      expect(exportData.user_id).toBe('test-user-123');
      expect(exportData.export_timestamp).toBeInstanceOf(Date);
      expect(exportData.privacy_settings).toBeDefined();
      expect(exportData.consent_history).toHaveLength(1);
      expect(exportData.data_processing_log).toHaveLength(1);
      expect(exportData.relationships_count).toBe(5);
      expect(exportData.interactions_count).toBe(25);
    });

    test('should log export request', async () => {
      await privacyManager.updateSetting('analytics', true, false);
      
      await privacyManager.exportGDPRData('test-user-123', 0, 0);
      
      const auditLog = privacyManager['auditLog'];
      const exportLogEntry = auditLog.find(entry => entry.action === 'data_export');
      expect(exportLogEntry).toBeDefined();
      expect(exportLogEntry?.details).toBe('Full GDPR data export requested');
    });
  });

  describe('Data Deletion Requests', () => {
    test('should log data deletion request', async () => {
      await privacyManager.updateSetting('analytics', true, false);
      
      await privacyManager.requestDataDeletion('test-user-123', 'User requested account closure');
      
      const auditLog = privacyManager['auditLog'];
      const deletionLogEntry = auditLog.find(entry => entry.action === 'data_deletion');
      expect(deletionLogEntry).toBeDefined();
      expect(deletionLogEntry?.details).toContain('User requested account closure');
    });

    test('should handle deletion request without reason', async () => {
      await privacyManager.updateSetting('analytics', true, false);
      
      await privacyManager.requestDataDeletion('test-user-123');
      
      const auditLog = privacyManager['auditLog'];
      const deletionLogEntry = auditLog.find(entry => entry.action === 'data_deletion');
      expect(deletionLogEntry?.details).toContain('User request');
    });
  });

  describe('Privacy Impact Assessment', () => {
    test('should generate accurate impact summary', () => {
      const summary = privacyManager.getPrivacyImpactSummary();
      
      // With default settings
      expect(summary.low).toBe(2); // data_collection, crash_reporting
      expect(summary.medium).toBe(0);
      expect(summary.high).toBe(0);
      expect(summary.total_granted).toBe(3); // including data_export
    });

    test('should update impact summary when permissions change', async () => {
      await privacyManager.updateSetting('ai_processing', true, false);
      await privacyManager.updateSetting('location_access', true, false);
      await privacyManager.updateSetting('data_sharing', true, false);
      
      const summary = privacyManager.getPrivacyImpactSummary();
      expect(summary.medium).toBe(1); // ai_processing
      expect(summary.high).toBe(2); // location_access, data_sharing
      expect(summary.total_granted).toBe(6);
    });

    test('should generate comprehensive privacy assessment', async () => {
      await privacyManager.updateSetting('location_access', true, false);
      await privacyManager.recordConsent('1.0.0', ['location_access'], true);
      
      const assessment = privacyManager.generatePrivacyImpactAssessment();
      
      expect(assessment.summary).toBeDefined();
      expect(assessment.high_risk_permissions).toContain('Location Access');
      expect(assessment.recommendations).toContain('Consider if all high-impact permissions are necessary');
      expect(assessment.consent_status.has_valid_consent).toBe(true);
      expect(assessment.consent_status.consent_age_days).toBeGreaterThanOrEqual(0);
    });

    test('should recommend consent renewal for expired consent', () => {
      // Simulate expired consent
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 3);
      privacyManager['consentHistory'] = [{
        timestamp: oldDate,
        version: '1.0.0',
        permissions: ['ai_processing'],
        granted: true,
      }];
      
      const assessment = privacyManager.generatePrivacyImpactAssessment();
      expect(assessment.recommendations).toContain('Consent needs to be renewed - it may be expired');
    });
  });

  describe('Settings Reset', () => {
    test('should reset to defaults', async () => {
      // Change some settings
      await privacyManager.updateSetting('ai_processing', true, false);
      await privacyManager.updateSetting('analytics', true, false);
      
      // Reset
      await privacyManager.resetToDefaults();
      
      const settings = privacyManager.getSettings();
      expect(settings.ai_processing).toBe(DEFAULT_PRIVACY_SETTINGS.ai_processing);
      expect(settings.analytics).toBe(DEFAULT_PRIVACY_SETTINGS.analytics);
    });

    test('should update timestamp on reset', async () => {
      const originalTimestamp = privacyManager.getSettings().last_updated;
      
      await new Promise(resolve => setTimeout(resolve, 10));
      await privacyManager.resetToDefaults();
      
      const newTimestamp = privacyManager.getSettings().last_updated;
      expect(newTimestamp.getTime()).toBeGreaterThan(originalTimestamp.getTime());
    });
  });

  describe('System Permission Requests', () => {
    test('should handle location permission request', async () => {
      const status = await privacyManager.requestSystemPermission('location_access');
      expect(status).toBe('granted');
    });

    test('should handle contacts permission request', async () => {
      const status = await privacyManager.requestSystemPermission('contacts_access');
      expect(status).toBe('granted');
    });

    test('should handle app-level permissions', async () => {
      const status = await privacyManager.requestSystemPermission('ai_processing');
      expect(status).toBe('granted');
    });
  });

  describe('Event Listeners', () => {
    test('should notify listeners on setting changes', async () => {
      const mockListener = jest.fn();
      const unsubscribe = privacyManager.addListener(mockListener);
      
      await privacyManager.updateSetting('analytics', true, false);
      
      expect(mockListener).toHaveBeenCalledWith(expect.objectContaining({
        analytics: true,
      }));
      
      unsubscribe();
    });

    test('should unsubscribe listeners correctly', async () => {
      const mockListener = jest.fn();
      const unsubscribe = privacyManager.addListener(mockListener);
      
      unsubscribe();
      await privacyManager.updateSetting('analytics', true, false);
      
      expect(mockListener).not.toHaveBeenCalled();
    });

    test('should handle listener errors gracefully', async () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      privacyManager.addListener(errorListener);
      await privacyManager.updateSetting('analytics', true, false);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Privacy settings listener error:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
  });
});

describe('Permission Helper Functions', () => {
  beforeEach(() => {
    const privacyManager = getPrivacyManager();
    privacyManager['settings'] = { ...DEFAULT_PRIVACY_SETTINGS };
  });

  test('hasPermission should return correct status', () => {
    expect(hasPermission('data_collection')).toBe(true);
    expect(hasPermission('ai_processing')).toBe(false);
  });

  test('should validate permission descriptions', () => {
    Object.entries(PERMISSION_DESCRIPTIONS).forEach(([key, description]) => {
      expect(description.title).toBeTruthy();
      expect(description.description).toBeTruthy();
      expect(['low', 'medium', 'high']).toContain(description.privacy_impact);
      expect(typeof description.required).toBe('boolean');
    });
  });

  test('should have all permission types covered', () => {
    const permissionTypes: PermissionType[] = [
      'data_collection',
      'ai_processing',
      'analytics',
      'crash_reporting',
      'marketing',
      'location_access',
      'contacts_access',
      'notifications',
      'background_sync',
      'data_export',
      'data_sharing'
    ];

    permissionTypes.forEach(permission => {
      expect(PERMISSION_DESCRIPTIONS[permission]).toBeDefined();
      expect(DEFAULT_PRIVACY_SETTINGS[permission]).toBeDefined();
    });
  });
});

describe('Privacy Manager Edge Cases', () => {
  let privacyManager: PrivacyManager;

  beforeEach(() => {
    privacyManager = getPrivacyManager();
    privacyManager['settings'] = { ...DEFAULT_PRIVACY_SETTINGS };
    privacyManager['consentHistory'] = [];
    privacyManager['auditLog'] = [];
  });

  test('should handle concurrent permission updates', async () => {
    const promises = [
      privacyManager.updateSetting('ai_processing', true, false),
      privacyManager.updateSetting('analytics', true, false),
      privacyManager.updateSetting('marketing', true, false),
    ];

    const results = await Promise.all(promises);
    expect(results.every(result => result === true)).toBe(true);

    const settings = privacyManager.getSettings();
    expect(settings.ai_processing).toBe(true);
    expect(settings.analytics).toBe(true);
    expect(settings.marketing).toBe(true);
  });

  test('should handle empty consent history gracefully', () => {
    expect(privacyManager.hasValidConsent()).toBe(false);
    expect(privacyManager.getConsentHistory()).toEqual([]);
  });

  test('should handle malformed consent records', async () => {
    // Add malformed consent record
    privacyManager['consentHistory'] = [
      {
        timestamp: new Date(),
        version: '1.0.0',
        permissions: ['ai_processing'],
        granted: false, // This consent was denied
      }
    ];

    expect(privacyManager.hasValidConsent()).toBe(false);
  });

  test('should handle storage errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Mock storage failure
    const originalPersistSettings = privacyManager['persistSettings'];
    privacyManager['persistSettings'] = jest.fn().mockRejectedValue(new Error('Storage error'));

    // Should not throw, but should log error
    const result = await privacyManager.updateSetting('analytics', true, false);
    expect(result).toBe(true); // Operation should still succeed

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to persist privacy settings:', expect.any(Error));

    // Restore
    privacyManager['persistSettings'] = originalPersistSettings;
    consoleErrorSpy.mockRestore();
  });
});