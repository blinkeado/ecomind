// SOURCE: IMPLEMENTATION_PLAN.md line 78 + EcoMind app-wide configuration requirements
// VERIFIED: App constants based on system specifications

/**
 * EcoMind Personal Relationship Assistant - App Constants
 * Centralized configuration and constant values
 */

/**
 * App Information
 */
export const APP_INFO = {
  NAME: 'EcoMind',
  VERSION: '1.0.0',
  BUILD_NUMBER: 1,
  DESCRIPTION: 'Personal Relationship Assistant',
  DEVELOPER: 'EcoMind Team',
  SUPPORT_EMAIL: 'support@ecomind.app',
  PRIVACY_URL: 'https://ecomind.app/privacy',
  TERMS_URL: 'https://ecomind.app/terms',
} as const;

/**
 * Firebase Configuration
 */
export const FIREBASE_CONFIG = {
  // Collection Names
  COLLECTIONS: {
    USERS: 'users',
    RELATIONSHIPS: 'relationships',
    INTERACTIONS: 'interactions',
    PROMPTS: 'prompts',
    LIFE_EVENTS: 'lifeEvents',
    TIMELINE: 'timeline',
    INSTITUTIONS: 'institutions',
    SHARED_RELATIONSHIPS: 'sharedRelationships',
    SYSTEM_CONFIG: 'systemConfig',
    TEMPLATES: 'templates',
    ANALYTICS: 'analytics',
  },
  
  // Cache Settings
  CACHE_SIZE_MB: 100,
  OFFLINE_PERSISTENCE: true,
  
  // Emulator Settings (Development)
  EMULATORS: {
    AUTH_PORT: 9099,
    FIRESTORE_PORT: 8080,
    FUNCTIONS_PORT: 5001,
  },
} as const;

/**
 * Relationship Constants
 * SOURCE: relationship.ts type definitions
 */
export const RELATIONSHIP_CONSTANTS = {
  // Health Score Thresholds
  HEALTH_THRESHOLDS: {
    EXCELLENT: 8,
    GOOD: 6,
    AVERAGE: 4,
    NEEDS_ATTENTION: 2,
    CRITICAL: 0,
  },
  
  // Default Values
  DEFAULT_HEALTH_SCORE: 7,
  DEFAULT_INTERACTION_QUALITY: 5,
  DEFAULT_RELATIONSHIP_INTENSITY: 5,
  
  // Contact Frequency Targets (days)
  CONTACT_FREQUENCY: {
    family: 7,
    friend: 14,
    romantic: 1,
    professional: 30,
    acquaintance: 90,
    mentor: 14,
    mentee: 14,
    neighbor: 30,
    service_provider: 180,
    other: 60,
  },
  
  // Relationship Health Calculation
  HEALTH_CALCULATION: {
    FREQUENCY_WEIGHT: 0.4,
    QUALITY_WEIGHT: 0.3,
    RECENCY_WEIGHT: 0.3,
    MAX_DAYS_CONSIDERED: 365,
  },
} as const;

/**
 * AI & Prompt Constants
 * SOURCE: prompt.ts type definitions + 04-system-context.md
 */
export const AI_CONSTANTS = {
  // Prompt Generation
  DEFAULT_MAX_PROMPTS: 10,
  DEFAULT_PROMPT_EXPIRY_DAYS: 7,
  DEFAULT_PROMPT_PRIORITY: 5,
  
  // Response Time Requirements
  PROMPT_GENERATION_TIMEOUT_MS: 300, // 300ms requirement
  CONTEXT_EXTRACTION_TIMEOUT_MS: 1000,
  
  // AI Models
  PRIMARY_MODEL: 'gemini-flash',
  FALLBACK_MODEL: 'claude',
  
  // Confidence Thresholds
  MIN_CONFIDENCE_THRESHOLD: 0.6,
  HIGH_CONFIDENCE_THRESHOLD: 0.8,
  
  // Processing Limits
  MAX_CONTEXT_LENGTH: 4000, // characters
  MAX_RELATIONSHIPS_PER_BATCH: 50,
  
  // Urgency Priority Mapping
  URGENCY_PRIORITY: {
    low: 3,
    medium: 5,
    high: 8,
    critical: 10,
  },
} as const;

/**
 * UI/UX Constants
 */
export const UI_CONSTANTS = {
  // Colors (iOS Design System)
  COLORS: {
    PRIMARY: '#3B82F6', // Blue
    SECONDARY: '#6B7280', // Gray
    SUCCESS: '#10B981', // Green
    WARNING: '#F59E0B', // Amber
    ERROR: '#EF4444', // Red
    
    // Text Colors
    TEXT_PRIMARY: '#1F2937',
    TEXT_SECONDARY: '#6B7280',
    TEXT_TERTIARY: '#9CA3AF',
    
    // Background Colors
    BACKGROUND_PRIMARY: '#FFFFFF',
    BACKGROUND_SECONDARY: '#F9FAFB',
    BACKGROUND_TERTIARY: '#F3F4F6',
    
    // Glassmorphism
    GLASS_BACKGROUND: 'rgba(255, 255, 255, 0.25)',
    GLASS_BORDER: 'rgba(255, 255, 255, 0.18)',
  },
  
  // Typography
  TYPOGRAPHY: {
    FONT_SIZES: {
      XS: 12,
      SM: 14,
      MD: 16,
      LG: 18,
      XL: 20,
      '2XL': 24,
      '3XL': 28,
      '4XL': 32,
    },
    
    FONT_WEIGHTS: {
      LIGHT: '300',
      REGULAR: '400',
      MEDIUM: '500',
      SEMIBOLD: '600',
      BOLD: '700',
    },
    
    LINE_HEIGHTS: {
      TIGHT: 1.25,
      NORMAL: 1.5,
      RELAXED: 1.75,
    },
  },
  
  // Spacing
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 12,
    LG: 16,
    XL: 20,
    '2XL': 24,
    '3XL': 32,
    '4XL': 40,
    '5XL': 48,
    '6XL': 64,
  },
  
  // Border Radius
  BORDER_RADIUS: {
    SM: 4,
    MD: 8,
    LG: 12,
    XL: 16,
    '2XL': 20,
    FULL: 9999,
  },
  
  // Shadows (iOS-style)
  SHADOWS: {
    SM: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    MD: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    LG: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    XL: {
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  // Animation Durations
  ANIMATION: {
    FAST: 150,
    NORMAL: 250,
    SLOW: 350,
    SPRING_CONFIG: {
      tension: 300,
      friction: 35,
    },
  },
} as const;

/**
 * Performance Constants
 * SOURCE: personal-relationship-assistant.md performance requirements
 */
export const PERFORMANCE_CONSTANTS = {
  // Response Time Targets (milliseconds)
  PROMPT_GENERATION_TARGET: 300,
  RELATIONSHIP_LOADING_TARGET: 200,
  SEARCH_RESULTS_TARGET: 150,
  ECOMAP_RENDERING_TARGET: 500,
  ECOMAP_UPDATE_TARGET: 100,
  
  // Memory Limits (MB)
  RELATIONSHIP_CACHE_LIMIT: 50,
  IMAGE_CACHE_LIMIT: 20,
  TOTAL_APP_MEMORY_LIMIT_IOS: 150,
  TOTAL_APP_MEMORY_LIMIT_ANDROID: 200,
  
  // Network & Sync
  OFFLINE_CACHE_DAYS: 7,
  SYNC_BATCH_SIZE: 25,
  MAX_CONCURRENT_REQUESTS: 3,
  REQUEST_TIMEOUT_MS: 10000,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  INFINITE_SCROLL_THRESHOLD: 0.8,
} as const;

/**
 * Privacy & Security Constants
 */
export const PRIVACY_CONSTANTS = {
  // Data Retention (days)
  DEFAULT_AI_DATA_RETENTION: 30,
  MAX_AI_DATA_RETENTION: 365,
  ANALYTICS_RETENTION: 90,
  
  // Encryption
  ENCRYPTION_KEY_SIZE: 256,
  HASH_ROUNDS: 12,
  
  // Privacy Levels
  PRIVACY_LEVELS: {
    STRICT: 'strict',
    MODERATE: 'moderate',
    OPEN: 'open',
  },
  
  // GDPR Compliance
  DATA_DELETION_GRACE_PERIOD_DAYS: 30,
  DATA_EXPORT_FORMAT: 'json',
  
  // Rate Limiting
  MAX_WRITES_PER_HOUR: 100,
  MAX_READS_PER_MINUTE: 60,
} as const;

/**
 * Notification Constants
 */
export const NOTIFICATION_CONSTANTS = {
  // Types
  TYPES: {
    PROMPT: 'relationship_prompt',
    REMINDER: 'important_date_reminder',
    HEALTH_ALERT: 'relationship_health_alert',
    INSIGHT: 'ai_insight',
    SYSTEM: 'system_notification',
  },
  
  // Timing
  DEFAULT_REMINDER_DAYS_BEFORE: 3,
  QUIET_HOURS_START: 22, // 10 PM
  QUIET_HOURS_END: 8, // 8 AM
  
  // Limits
  MAX_DAILY_PROMPTS: 5,
  MAX_WEEKLY_INSIGHTS: 3,
  
  // Channels (for Android)
  CHANNELS: {
    PROMPTS: 'relationship_prompts',
    REMINDERS: 'important_reminders',
    INSIGHTS: 'ai_insights',
    SYSTEM: 'system_notifications',
  },
} as const;

/**
 * Development Constants
 */
export const DEV_CONSTANTS = {
  // Debugging
  ENABLE_LOGS: __DEV__,
  ENABLE_PERFORMANCE_MONITORING: __DEV__,
  ENABLE_CRASH_REPORTING: !__DEV__,
  
  // Testing
  TEST_USER_PREFIX: 'test_user_',
  MOCK_DATA_ENABLED: __DEV__,
  
  // Feature Flags
  FEATURES: {
    AI_PROCESSING: true,
    SHARED_RELATIONSHIPS: false, // Future feature
    SOCIAL_INTEGRATION: false, // Future feature
    ADVANCED_ANALYTICS: false, // Future feature
    VOICE_NOTES: false, // Future feature
    CALENDAR_INTEGRATION: false, // Future feature
  },
} as const;

/**
 * Validation Constants
 */
export const VALIDATION_CONSTANTS = {
  // Input Limits
  DISPLAY_NAME_MAX_LENGTH: 100,
  DISPLAY_NAME_MIN_LENGTH: 1,
  NOTES_MAX_LENGTH: 2000,
  EMAIL_MAX_LENGTH: 254,
  PHONE_MAX_LENGTH: 20,
  
  // File Limits
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain'],
  
  // Relationship Limits
  MAX_RELATIONSHIPS_PER_USER: 1000,
  MAX_INTERACTIONS_PER_RELATIONSHIP: 10000,
  MAX_LIFE_EVENTS_PER_RELATIONSHIP: 100,
  MAX_TAGS_PER_RELATIONSHIP: 10,
  
  // Search
  MIN_SEARCH_QUERY_LENGTH: 2,
  MAX_SEARCH_RESULTS: 50,
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  // Authentication
  AUTH_REQUIRED: 'Authentication required',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_DISABLED: 'Account has been disabled',
  
  // Network
  NETWORK_ERROR: 'Network connection error',
  TIMEOUT_ERROR: 'Request timed out',
  SERVER_ERROR: 'Server error occurred',
  
  // Validation
  INVALID_EMAIL: 'Please enter a valid email address',
  PASSWORD_TOO_WEAK: 'Password must be at least 8 characters',
  REQUIRED_FIELD: 'This field is required',
  
  // Relationship
  RELATIONSHIP_NOT_FOUND: 'Relationship not found',
  CANNOT_DELETE_RELATIONSHIP: 'Cannot delete this relationship',
  RELATIONSHIP_LIMIT_EXCEEDED: 'Maximum number of relationships reached',
  
  // General
  UNKNOWN_ERROR: 'An unexpected error occurred',
  PERMISSION_DENIED: 'Permission denied',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
} as const;

/**
 * Export all constants as default
 */
export default {
  APP_INFO,
  FIREBASE_CONFIG,
  RELATIONSHIP_CONSTANTS,
  AI_CONSTANTS,
  UI_CONSTANTS,
  PERFORMANCE_CONSTANTS,
  PRIVACY_CONSTANTS,
  NOTIFICATION_CONSTANTS,
  DEV_CONSTANTS,
  VALIDATION_CONSTANTS,
  ERROR_MESSAGES,
};