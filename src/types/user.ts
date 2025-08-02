// SOURCE: IMPLEMENTATION_PLAN.md line 75 + WORLD_CLASS_DATABASE_ARCHITECTURE.md
// URL: https://rnfirebase.io/auth/usage#user-objects
// VERIFIED: Updated for World-Class Database Architecture with emotional profiles
// VERSION: 2.0 - Enhanced for Firebase AI Logic and emotional intelligence

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
 * User Preferences and Privacy Settings - ENHANCED for World-Class Architecture
 * SOURCE: WORLD_CLASS_DATABASE_ARCHITECTURE.md privacy-first design
 */
export interface UserPreferences {
  // Privacy Control Levels
  privacyLevel: PrivacyLevel;
  
  // AI Processing Consent - ENHANCED for Firebase AI Logic
  aiProcessingConsent: boolean;
  aiDataRetentionDays: number; // How long to keep AI processing data
  emotionalDataConsent: boolean; // NEW: Explicit consent for emotional data
  emotionalDataRetentionDays: number; // NEW: Shorter retention for sensitive data (default 30 days)
  
  // NEW: Firebase AI Logic Preferences
  aiModelPreference: 'gemini-1.5-flash' | 'gemini-1.5-pro' | 'vertex-ai-gemini' | 'auto';
  aiProcessingLocation: 'on_device' | 'cloud' | 'hybrid'; // Processing location preference
  vectorSearchEnabled: boolean; // Enable semantic similarity search
  
  // Notification Settings
  notificationSettings: NotificationSettings;
  
  // Data Management Preferences
  dataExportFormat: 'json' | 'csv';
  backupEnabled: boolean;
  offlineSyncEnabled: boolean; // NEW: Multi-device offline sync
  conflictResolutionPreference: 'manual' | 'automatic' | 'ai_assisted'; // NEW: Conflict handling
  
  // UI/UX Preferences
  theme: 'light' | 'dark' | 'system';
  glassmorphismIntensity: 'subtle' | 'moderate' | 'intense';
  
  // Relationship Management Settings
  defaultRelationshipPrivacy: 'private' | 'shared';
  reminderFrequency: 'daily' | 'weekly' | 'monthly' | 'off';
  
  // NEW: Emotional Intelligence Settings
  emotionalIntelligenceEnabled: boolean;
  emotionalBalanceTracking: boolean;
  supportDetectionSensitivity: 'low' | 'medium' | 'high';
  stressIndicatorAlerts: boolean;
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
 * Notification Settings - ENHANCED for World-Class Architecture
 * Controls when and how users receive prompts and reminders
 * SOURCE: WORLD_CLASS_DATABASE_ARCHITECTURE.md - Temporal triggers integration
 */
export interface NotificationSettings {
  // Relationship Prompts
  prompts: boolean;
  promptTiming: 'morning' | 'afternoon' | 'evening' | 'smart'; // AI-optimized timing
  promptUrgencyFiltering: boolean; // Filter by urgency level
  
  // Relationship Reminders
  reminders: boolean;
  reminderAdvanceNotice: number; // Days before important dates
  temporalTriggersEnabled: boolean; // NEW: Automated temporal triggers
  
  // AI Insights and Suggestions
  insights: boolean;
  weeklyInsights: boolean;
  monthlyReports: boolean;
  
  // NEW: Emotional Intelligence Notifications
  emotionalInsights: boolean;
  supportOpportunityAlerts: boolean;
  relationshipHealthAlerts: boolean;
  emotionalBalanceReports: boolean;
  
  // NEW: Conflict Resolution Notifications
  conflictDetectionAlerts: boolean;
  syncConflictNotifications: boolean;
  
  // Social Features (future)
  sharedRelationshipUpdates: boolean;
  connectionRequests: boolean;
  
  // System Notifications
  securityAlerts: boolean;
  dataExportReady: boolean;
  backupReminders: boolean;
  aiProcessingAlerts: boolean; // NEW: AI processing status notifications
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
 * NEW: User Emotional Profile Interface
 * STORAGE: users/{userId}/emotionalProfile/{profileId}
 * SOURCE: WORLD_CLASS_DATABASE_ARCHITECTURE.md - Emotional Signal Layer
 */
export interface UserEmotionalProfile {
  id: string;
  userId: string; // indexed
  
  // Emotional Patterns
  dominantEmotions: string[]; // indexed - most common emotional states
  stressIndicators: string[]; // Warning signs of emotional stress
  supportPatterns: {
    givingStyle: 'proactive' | 'reactive' | 'minimal' | 'overwhelming';
    receivingComfort: 'high' | 'medium' | 'low';
    preferredSupportTypes: string[]; // Types of support user prefers
  };
  
  // Communication Patterns
  communicationStyle: string; // indexed - 'formal' | 'casual' | 'intimate' | 'supportive'
  empathyLevel: number; // 1-10 scale
  conflictResolutionStyle: 'collaborative' | 'competitive' | 'accommodating' | 'avoiding' | 'compromising';
  
  // Relationship Preferences
  idealRelationshipBalance: {
    emotionalGiving: number; // 1-10 preferred level of support giving
    emotionalReceiving: number; // 1-10 preferred level of support receiving
    communicationFrequency: Record<string, number>; // Preferred frequency by relationship type
  };
  
  // Privacy Controls for Emotional Data
  emotionalDataSharing: {
    allowAIAnalysis: boolean;
    allowPatternDetection: boolean;
    allowSupportSuggestions: boolean;
    dataRetentionDays: number; // Separate retention for emotional data
  };
  
  // Metadata
  lastUpdated: Date; // indexed
  version: string;
  aiGeneratedInsights?: string[]; // AI-detected patterns
  lastInsightGeneration?: Date;
}

/**
 * NEW: Multi-Device Sync Status Interface
 * Tracks synchronization across user's devices
 */
export interface UserSyncStatus {
  userId: string;
  
  // Device Information
  devices: {
    deviceId: string;
    deviceName: string;
    platform: 'ios' | 'android' | 'web';
    lastSyncAt: Date;
    syncStatus: 'synced' | 'pending' | 'conflict' | 'offline';
  }[];
  
  // Sync Statistics
  totalSyncConflicts: number;
  resolvedConflicts: number;
  pendingConflicts: number;
  lastFullSync: Date;
  
  // Sync Preferences
  syncPreferences: {
    autoResolveConflicts: boolean;
    priorityDevice?: string; // Device ID for conflict resolution priority
    offlineSyncEnabled: boolean;
    backgroundSyncEnabled: boolean;
  };
}

/**
 * Default User Preferences - UPDATED for World-Class Architecture
 * Conservative defaults prioritizing user privacy and emotional data protection
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  privacyLevel: 'strict',
  aiProcessingConsent: false,
  aiDataRetentionDays: 30,
  emotionalDataConsent: false, // NEW: Explicit consent required
  emotionalDataRetentionDays: 30, // NEW: Shorter retention for sensitive data
  aiModelPreference: 'auto', // NEW: Let system choose optimal model
  aiProcessingLocation: 'hybrid', // NEW: Balance privacy and functionality
  vectorSearchEnabled: false, // NEW: Disabled by default for privacy
  offlineSyncEnabled: true, // NEW: Enable offline functionality
  conflictResolutionPreference: 'manual', // NEW: User control over conflicts
  emotionalIntelligenceEnabled: false, // NEW: Opt-in for emotional features
  emotionalBalanceTracking: false, // NEW: Disabled by default
  supportDetectionSensitivity: 'medium', // NEW: Balanced detection
  stressIndicatorAlerts: false, // NEW: Disabled by default for privacy
  notificationSettings: {
    prompts: true,
    promptTiming: 'smart',
    promptUrgencyFiltering: true, // NEW: Filter low-priority prompts
    reminders: true,
    reminderAdvanceNotice: 3,
    temporalTriggersEnabled: false, // NEW: Disabled by default
    insights: false,
    weeklyInsights: false,
    monthlyReports: false,
    emotionalInsights: false, // NEW: Emotional insights disabled
    supportOpportunityAlerts: false, // NEW: Support alerts disabled
    relationshipHealthAlerts: false, // NEW: Health alerts disabled
    emotionalBalanceReports: false, // NEW: Balance reports disabled
    conflictDetectionAlerts: true, // NEW: Important for data integrity
    syncConflictNotifications: true, // NEW: Important for user awareness
    sharedRelationshipUpdates: false,
    connectionRequests: false,
    securityAlerts: true,
    dataExportReady: true,
    backupReminders: true,
    aiProcessingAlerts: true, // NEW: Keep users informed of AI usage
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

// NEW: World-Class Architecture Type Guards
export const isValidAIModel = (model: string): model is UserPreferences['aiModelPreference'] => {
  return ['gemini-1.5-flash', 'gemini-1.5-pro', 'vertex-ai-gemini', 'auto'].includes(model);
};

export const isValidProcessingLocation = (location: string): location is UserPreferences['aiProcessingLocation'] => {
  return ['on_device', 'cloud', 'hybrid'].includes(location);
};

export const isValidConflictResolution = (resolution: string): resolution is UserPreferences['conflictResolutionPreference'] => {
  return ['manual', 'automatic', 'ai_assisted'].includes(resolution);
};

export const isValidSupportSensitivity = (sensitivity: string): sensitivity is UserPreferences['supportDetectionSensitivity'] => {
  return ['low', 'medium', 'high'].includes(sensitivity);
};

// NEW: Privacy-compliant emotional data validation
export const isValidEmotionalProfile = (data: any): data is UserEmotionalProfile => {
  return (
    data &&
    typeof data.userId === 'string' &&
    Array.isArray(data.dominantEmotions) &&
    typeof data.empathyLevel === 'number' &&
    data.empathyLevel >= 1 && data.empathyLevel <= 10 &&
    data.emotionalDataSharing &&
    typeof data.emotionalDataSharing.allowAIAnalysis === 'boolean'
  );
};

export default {
  DEFAULT_USER_PREFERENCES,
  isValidUserProfile,
  isValidPrivacyLevel,
  isValidOnboardingStep,
  isValidAIModel,
  isValidProcessingLocation,
  isValidConflictResolution,
  isValidSupportSensitivity,
  isValidEmotionalProfile,
};