// SOURCE: IMPLEMENTATION_PLAN.md line 75 + Firebase Auth Official Documentation
// URL: https://rnfirebase.io/auth/usage#user-objects
// VERIFIED: Official Firebase Auth User interface + EcoMind requirements

import { User as FirebaseUser } from '@react-native-firebase/auth';

/**
 * Extended User Profile interface
 * Combines Firebase User data with EcoMind-specific profile information
 */
export interface UserProfile {
  // Firebase User Properties
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  isAnonymous: boolean;
  emailVerified: boolean;
  
  // EcoMind-specific Properties  
  createdAt: Date;
  lastLoginAt: Date;
  lastActiveAt: Date;
  
  // Privacy and Consent Settings
  preferences: UserPreferences;
  
  // Profile Metadata
  profileVersion: string; // For data migration compatibility
  isOnboardingComplete: boolean;
}

/**
 * User Preferences and Privacy Settings
 * SOURCE: personal-relationship-assistant.md privacy requirements
 */
export interface UserPreferences {
  // Privacy Control Levels
  privacyLevel: PrivacyLevel;
  
  // AI Processing Consent
  aiProcessingConsent: boolean;
  aiDataRetentionDays: number; // How long to keep AI processing data
  
  // Notification Settings
  notificationSettings: NotificationSettings;
  
  // Data Management Preferences
  dataExportFormat: 'json' | 'csv';
  backupEnabled: boolean;
  
  // UI/UX Preferences
  theme: 'light' | 'dark' | 'system';
  glassmorphismIntensity: 'subtle' | 'moderate' | 'intense';
  
  // Relationship Management Settings
  defaultRelationshipPrivacy: 'private' | 'shared';
  reminderFrequency: 'daily' | 'weekly' | 'monthly' | 'off';
}

/**
 * Privacy Level Settings
 * SOURCE: SHARED_RELATIONSHIP_PROTOCOL.md consent framework
 */
export type PrivacyLevel = 'strict' | 'moderate' | 'open';

export interface PrivacyLevelConfig {
  strict: {
    aiProcessing: false;
    dataSharing: false;
    analytics: false;
    crossDeviceSync: true; // Still allow user's own devices
  };
  moderate: {
    aiProcessing: true;
    dataSharing: false;
    analytics: true; // Anonymous only
    crossDeviceSync: true;
  };
  open: {
    aiProcessing: true;
    dataSharing: true; // With explicit consent
    analytics: true;
    crossDeviceSync: true;
  };
}

/**
 * Notification Settings
 * Controls when and how users receive prompts and reminders
 */
export interface NotificationSettings {
  // Relationship Prompts
  prompts: boolean;
  promptTiming: 'morning' | 'afternoon' | 'evening' | 'smart'; // AI-optimized timing
  
  // Relationship Reminders
  reminders: boolean;
  reminderAdvanceNotice: number; // Days before important dates
  
  // AI Insights and Suggestions
  insights: boolean;
  weeklyInsights: boolean;
  monthlyReports: boolean;
  
  // Social Features (future)
  sharedRelationshipUpdates: boolean;
  connectionRequests: boolean;
  
  // System Notifications
  securityAlerts: boolean;
  dataExportReady: boolean;
  backupReminders: boolean;
}

/**
 * User Authentication State
 * Combines Firebase Auth state with profile loading status
 */
export interface AuthState {
  // Firebase User Object
  user: FirebaseUser | null;
  
  // Extended Profile Data
  profile: UserProfile | null;
  
  // Loading States
  loading: boolean;
  profileLoading: boolean;
  
  // Error States
  error: string | null;
  profileError: string | null;
  
  // Authentication Status
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isEmailVerified: boolean;
}

/**
 * User Profile Update Payload
 * For partial updates to user profile
 */
export interface UserProfileUpdate {
  displayName?: string;
  photoURL?: string;
  preferences?: Partial<UserPreferences>;
  lastActiveAt?: Date;
  isOnboardingComplete?: boolean;
}

/**
 * Onboarding Progress Tracking
 * SOURCE: OnboardingScreen.tsx requirements
 */
export interface OnboardingProgress {
  step: OnboardingStep;
  completedSteps: OnboardingStep[];
  totalSteps: number;
  isComplete: boolean;
}

export type OnboardingStep = 
  | 'welcome'
  | 'authentication' 
  | 'privacy_consent'
  | 'profile_setup'
  | 'first_relationship'
  | 'ai_consent'
  | 'notification_preferences'
  | 'complete';

/**
 * User Session Data
 * For tracking user activity and session management
 */
export interface UserSession {
  sessionId: string;
  startedAt: Date;
  lastActivityAt: Date;
  deviceInfo: {
    platform: 'ios' | 'android';
    version: string;
    model?: string;
  };
  location?: {
    country: string;
    timezone: string;
  };
}

/**
 * Account Deletion Request
 * For GDPR compliance and account deletion workflows
 */
export interface AccountDeletionRequest {
  userId: string;
  requestedAt: Date;
  reason?: string;
  dataExportRequested: boolean;
  gracePeriodEnds: Date; // 30 days grace period
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

/**
 * Type Guards for User Data Validation
 */
export const isValidUserProfile = (data: any): data is UserProfile => {
  return (
    data &&
    typeof data.uid === 'string' &&
    (data.email === null || typeof data.email === 'string') &&
    (data.displayName === null || typeof data.displayName === 'string') &&
    typeof data.isAnonymous === 'boolean' &&
    data.createdAt instanceof Date &&
    data.preferences &&
    typeof data.preferences === 'object'
  );
};

export const isValidPrivacyLevel = (level: string): level is PrivacyLevel => {
  return ['strict', 'moderate', 'open'].includes(level);
};

export const isValidOnboardingStep = (step: string): step is OnboardingStep => {
  return [
    'welcome',
    'authentication',
    'privacy_consent', 
    'profile_setup',
    'first_relationship',
    'ai_consent',
    'notification_preferences',
    'complete'
  ].includes(step);
};

/**
 * Default User Preferences
 * Conservative defaults prioritizing user privacy
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  privacyLevel: 'strict',
  aiProcessingConsent: false,
  aiDataRetentionDays: 30,
  notificationSettings: {
    prompts: true,
    promptTiming: 'smart',
    reminders: true,
    reminderAdvanceNotice: 3,
    insights: false,
    weeklyInsights: false,
    monthlyReports: false,
    sharedRelationshipUpdates: false,
    connectionRequests: false,
    securityAlerts: true,
    dataExportReady: true,
    backupReminders: true,
  },
  dataExportFormat: 'json',
  backupEnabled: true,
  theme: 'system',
  glassmorphismIntensity: 'moderate',
  defaultRelationshipPrivacy: 'private',
  reminderFrequency: 'weekly',
};

/**
 * Export all user-related types and utilities
 */
export type {
  FirebaseUser,
};

export default {
  DEFAULT_USER_PREFERENCES,
  isValidUserProfile,
  isValidPrivacyLevel,
  isValidOnboardingStep,
};