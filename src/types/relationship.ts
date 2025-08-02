// SOURCE: IMPLEMENTATION_PLAN.md line 74 + WORLD_CLASS_DATABASE_ARCHITECTURE.md
// VERIFIED: Updated for World-Class Database Architecture with Firebase subcollections
// MIGRATION: From nested arrays to Firestore subcollections for unlimited scaling
// VERSION: 2.0 - Updated for Phase 1 implementation with emotional signals and AI integration

import { Timestamp } from '@react-native-firebase/firestore';

/**
 * Core Person Document Interface - UPDATED for World-Class Architecture
 * Represents an individual in the user's relationship network
 * SOURCE: WORLD_CLASS_DATABASE_ARCHITECTURE.md - Firestore subcollections structure
 * MIGRATION: From nested arrays to subcollections for unlimited scaling
 */
export interface PersonDocument {
  // Core Identity
  id: string;
  displayName: string; // indexed, searchable
  nicknames: string[]; // indexed
  
  // Relationship Context
  roles: RelationshipRole[]; // indexed
  relationshipType: RelationshipType; // indexed
  relationshipIntensity: number; // 1-10 scale, indexed
  
  // Contact Information
  contactMethods: ContactMethod[];
  socialProfiles: SocialProfile[];
  
  // Physical & Contextual Information
  location?: LocationInfo;
  demographics?: Demographics;
  
  // Relationship Health & Analytics
  relationshipHealth: number; // 1-10 calculated score, indexed
  communicationFrequency: number; // Average days between contacts
  lastContact?: Date; // indexed
  nextContactSuggestion?: Date;
  
  // Search & Tagging - NEW for World-Class Architecture
  tags: string[]; // indexed
  searchKeywords: string[]; // full-text indexed for search optimization
  
  // Metadata
  createdAt: Date;
  lastUpdated: Date;
  createdBy: string; // User ID
  
  // Privacy & Sharing
  isPrivate: boolean;
  sharedWith: string[]; // User IDs with access
  
  // System Fields
  version: number; // For data migration compatibility
  
  // SUBCOLLECTION REFERENCES - Data now stored in subcollections for unlimited scaling
  // interactions: InteractionRecord[] -> users/{userId}/relationships/{id}/interactions/{interactionId}
  // lifeEvents: LifeEvent[] -> users/{userId}/relationships/{id}/lifeEvents/{eventId}
  // emotionalSignals: EmotionalSignal[] -> users/{userId}/relationships/{id}/emotionalSignals/{signalId}
  // attachments: AttachmentReference[] -> users/{userId}/relationships/{id}/attachments/{attachmentId}
  // contextThreads: ContextThread[] -> users/{userId}/relationships/{id}/contextThreads/{threadId}
}

/**
 * Relationship Types
 * SOURCE: Personal relationship categorization standards
 */
export type RelationshipType = 
  | 'family'
  | 'friend' 
  | 'romantic'
  | 'professional'
  | 'acquaintance'
  | 'mentor'
  | 'mentee'
  | 'neighbor'
  | 'service_provider'
  | 'other';

/**
 * Relationship Roles
 * More granular than relationship types
 */
export type RelationshipRole =
  // Family
  | 'parent' | 'child' | 'sibling' | 'spouse' | 'partner'
  | 'grandparent' | 'grandchild' | 'aunt' | 'uncle' | 'cousin'
  | 'in_law' | 'step_family' | 'extended_family'
  
  // Friends
  | 'best_friend' | 'close_friend' | 'friend' | 'old_friend'
  | 'college_friend' | 'childhood_friend' | 'online_friend'
  
  // Professional
  | 'colleague' | 'boss' | 'employee' | 'client' | 'vendor'
  | 'business_partner' | 'mentor' | 'mentee' | 'networking_contact'
  
  // Community
  | 'neighbor' | 'classmate' | 'teammate' | 'club_member'
  | 'volunteer_partner' | 'community_leader'
  
  // Service
  | 'doctor' | 'therapist' | 'trainer' | 'teacher' | 'advisor'
  | 'contractor' | 'service_provider'
  
  // Other
  | 'acquaintance' | 'contact' | 'other';

/**
 * Contact Method Information
 */
export interface ContactMethod {
  type: ContactMethodType;
  value: string;
  label?: string; // e.g., "Work", "Personal", "Home"
  isPrimary: boolean;
  isVerified: boolean;
  lastUsed?: Date;
}

export type ContactMethodType = 
  | 'email'
  | 'phone'
  | 'text'
  | 'address'
  | 'social_media'
  | 'messaging_app'
  | 'video_call'
  | 'other';

/**
 * Social Media Profile
 */
export interface SocialProfile {
  platform: SocialPlatform;
  username: string;
  url?: string;
  isActive: boolean;
  lastChecked?: Date;
}

export type SocialPlatform = 
  | 'facebook'
  | 'instagram'
  | 'twitter'
  | 'linkedin'
  | 'github'
  | 'tiktok'
  | 'snapchat'
  | 'whatsapp'
  | 'telegram'
  | 'other';

/**
 * Location Information
 */
export interface LocationInfo {
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  isApproximate: boolean; // For privacy
}

/**
 * Demographic Information
 */
export interface Demographics {
  ageRange?: AgeRange;
  gender?: string;
  occupation?: string;
  industry?: string;
  education?: string;
  languages?: string[];
  interests?: string[];
}

export type AgeRange = 
  | 'under_18'
  | '18_25'
  | '26_35'
  | '36_45'
  | '46_55'
  | '56_65'
  | 'over_65'
  | 'unknown';

/**
 * Interaction Record - UPDATED for World-Class Architecture
 * Tracks communications and meetings with a person
 * STORAGE: users/{userId}/relationships/{relationshipId}/interactions/{interactionId}
 * SOURCE: WORLD_CLASS_DATABASE_ARCHITECTURE.md subcollection pattern
 */
export interface InteractionRecord {
  id: string;
  personId: string;
  userId: string;
  
  // Interaction Details
  type: InteractionType; // indexed
  timestamp: Date; // indexed for temporal queries
  duration?: number; // Minutes
  location?: string;
  
  // Content & Context
  notes?: string; // non-indexed for large text storage
  topics?: string[];
  emotionalTone: EmotionalTone; // indexed
  interactionQuality: number; // 1-10 scale, indexed
  
  // Communication Method
  contactMethod?: ContactMethodType; // indexed
  initiatedBy: 'user' | 'other' | 'mutual';
  
  // NEW: AI Processing Integration
  aiExtracted: boolean; // Whether AI processing was used
  aiExtractedContext?: AIExtractedContext;
  needsReview?: boolean; // If AI extraction needs user confirmation
  
  // Metadata
  isPrivate: boolean;
  createdAt: Date;
  lastUpdated: Date;
  
  // SUBCOLLECTION REFERENCES - Attachments moved to subcollection
  // attachments: AttachmentReference[] -> users/{userId}/relationships/{relationshipId}/attachments/{attachmentId}
}

export type InteractionType = 
  | 'conversation' // In-person chat
  | 'phone_call'
  | 'video_call'
  | 'text_message'
  | 'email'
  | 'social_media'
  | 'meeting' // Formal meeting
  | 'meal' // Lunch, dinner, coffee
  | 'activity' // Shared activity
  | 'event' // Party, wedding, etc.
  | 'help' // Giving or receiving help
  | 'conflict' // Disagreement or argument
  | 'celebration' // Birthday, achievement
  | 'support' // Emotional support
  | 'other';

export type EmotionalTone = 
  | 'very_positive'
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'very_negative'
  | 'mixed'
  | 'unknown';

/**
 * NEW: Emotional Signal Interface - World-Class Architecture Addition
 * Based on Emotional Schema Theory and Plutchik's Wheel
 * STORAGE: users/{userId}/relationships/{relationshipId}/emotionalSignals/{signalId}
 * SOURCE: WORLD_CLASS_DATABASE_ARCHITECTURE.md Emotional Signal Layer
 */
export interface EmotionalSignal {
  id: string;
  relationshipId: string;
  userId: string;
  
  // Core Emotional Dimensions (Plutchik's Wheel)
  emotionType: 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'trust' | 'anticipation'; // indexed
  intensity: number; // 1-10 scale, indexed
  
  // Relationship Context
  relationalContext: 'support' | 'conflict' | 'celebration' | 'concern' | 'gratitude' | 'nostalgia';
  
  // Temporal Context
  timestamp: Date; // indexed
  duration?: number; // How long the emotion lasted (minutes)
  
  // Source Detection
  detectionMethod: 'user_reported' | 'ai_extracted' | 'behavioral_inferred';
  confidence: number; // 0-1 for AI-detected emotions
  
  // Context Information
  context?: string; // non-indexed descriptive text
  triggerEvent?: string;
  relatedInteractionId?: string;
  
  // Metadata
  createdAt: Date;
  isPrivate: boolean;
}

/**
 * NEW: Context Thread Interface - Conversation Continuity
 * STORAGE: users/{userId}/relationships/{relationshipId}/contextThreads/{threadId} 
 * SOURCE: WORLD_CLASS_DATABASE_ARCHITECTURE.md - Addresses Context Switching Overload
 */
export interface ContextThread {
  id: string;
  relationshipId: string;
  userId: string;
  
  // Thread Information
  topic: string; // indexed
  lastUpdate: Date; // indexed
  participants: string[]; // indexed
  platform: string; // indexed - 'iMessage' | 'WhatsApp' | 'email' | 'in-person'
  threadType: string; // indexed - 'ongoing_conversation' | 'project' | 'life_event' | 'support'
  priority: string; // indexed - 'low' | 'medium' | 'high'
  isActive: boolean; // indexed
  
  // Content Summary
  summary?: string; // non-indexed
  keyPoints?: string[]; // Important discussion points
  nextSteps?: string[]; // Agreed upon follow-up actions
  
  // Metadata
  createdAt: Date;
  lastUpdated: Date;
}

/**
 * AI Extracted Context - ENHANCED for Firebase AI Logic integration
 * Information extracted from interaction notes by AI
 * SOURCE: WORLD_CLASS_DATABASE_ARCHITECTURE.md - Firebase AI Logic (Vertex AI)
 */
export interface AIExtractedContext {
  extractedAt: Date;
  confidence: number; // 0-1 scale
  
  // Extracted Information
  lifeEvents?: LifeEvent[];
  interests?: string[];
  preferences?: string[];
  relationships?: string[]; // Mentions of other people
  locations?: string[];
  
  // Sentiment Analysis
  sentiment: EmotionalTone;
  sentimentScore: number; // -1 to 1
  
  // Important Dates
  importantDates?: ImportantDate[];
  
  // Follow-up Suggestions
  followUpSuggestions?: string[];
  
  // NEW: Firebase AI Logic Integration (2025)
  model: string; // AI model used: 'gemini-1.5-flash' | 'vertex-ai-gemini-api'
  processingVersion: string;
  apiProvider: 'firebase-ai-logic' | 'gemini-developer-api'; // Technology source
  processingTime?: number; // milliseconds for performance monitoring
  
  // NEW: Dual Storage Pattern - Raw + Structured
  rawTranscript?: string; // non-indexed, original text
  structuredData?: Record<string, any>; // AI-processed structured information
  
  // NEW: Vector Embeddings for Semantic Search
  contextEmbedding?: number[]; // 768-dim vector for semantic similarity
  embeddingMetadata?: {
    model: 'vertex-ai-text-embeddings' | 'gemini-text-embedding';
    generatedAt: Date;
    algorithm?: 'tree-ah'; // Approximate Hamming for KNN
    distanceMeasure?: 'COSINE';
  };
}

/**
 * Life Event - UPDATED for World-Class Architecture
 * Significant events in a person's life
 * STORAGE: users/{userId}/relationships/{relationshipId}/lifeEvents/{eventId}
 * SOURCE: WORLD_CLASS_DATABASE_ARCHITECTURE.md - Addresses Forgotten Moment Problem
 */
export interface LifeEvent {
  id: string;
  personId: string;
  userId: string;
  
  // Event Details
  type: LifeEventType; // indexed
  title: string; // indexed
  description?: string; // non-indexed for large text
  date: Date; // indexed for temporal queries
  isApproximate: boolean;
  
  // Significance
  importance: number; // 1-10 scale, indexed
  category: EventCategory; // indexed
  
  // Source Information
  source: 'user_input' | 'ai_extracted' | 'social_media' | 'calendar';
  sourceReference?: string;
  
  // Reminders
  reminderDate?: Date; // indexed for temporal triggers
  reminderSent: boolean;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  
  // NEW: Emotional Significance Tracking
  emotionalSignificance?: number; // 1-10 scale for importance to relationship
  relatedEmotionalSignals?: string[]; // IDs of related emotional signals
  
  // Metadata
  createdAt: Date;
  lastUpdated: Date;
  isPrivate: boolean;
}

export type LifeEventType = 
  | 'birthday'
  | 'anniversary'
  | 'wedding'
  | 'graduation'
  | 'job_change'
  | 'promotion'
  | 'relocation'
  | 'birth'
  | 'death'
  | 'illness'
  | 'recovery'
  | 'achievement'
  | 'milestone'
  | 'travel'
  | 'hobby_start'
  | 'relationship_start'
  | 'relationship_end'
  | 'other';

export type EventCategory = 
  | 'personal'
  | 'professional'
  | 'family'
  | 'health'
  | 'achievement'
  | 'transition'
  | 'celebration'
  | 'loss'
  | 'other';

/**
 * Important Date
 * Recurring or significant dates related to a person
 */
export interface ImportantDate {
  id: string;
  personId: string;
  
  // Date Information
  type: ImportantDateType;
  date: Date;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  
  // Display Information
  title: string;
  description?: string;
  category: EventCategory;
  
  // Reminder Settings
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  customReminderMessage?: string;
  
  // Metadata
  createdAt: Date;
  lastUpdated: Date;
  source: 'user_input' | 'ai_extracted';
}

export type ImportantDateType = 
  | 'birthday'
  | 'anniversary'
  | 'work_anniversary'
  | 'holiday'
  | 'custom'
  | 'deadline'
  | 'appointment'
  | 'celebration'
  | 'memorial'
  | 'other';

/**
 * Recurrence Pattern
 */
export interface RecurrencePattern {
  frequency: 'yearly' | 'monthly' | 'weekly' | 'daily' | 'custom';
  interval: number; // Every N frequency units
  endDate?: Date;
  exceptions?: Date[]; // Dates to skip
}

/**
 * Attachment Reference - UPDATED for World-Class Architecture
 * References to files, photos, or other media
 * STORAGE: users/{userId}/relationships/{relationshipId}/attachments/{attachmentId}
 * SOURCE: WORLD_CLASS_DATABASE_ARCHITECTURE.md subcollection pattern
 */
export interface AttachmentReference {
  id: string;
  relationshipId: string;
  userId: string;
  
  // File Information
  type: AttachmentType; // indexed
  filename: string;
  storageUrl: string; // Firebase Storage URL
  size: number; // File size in bytes
  mimeType: string;
  uploadedAt: Date; // indexed
  
  // Context
  description?: string;
  relatedEventId?: string; // Link to life event if applicable
  relatedInteractionId?: string; // Link to interaction if applicable
  
  // Metadata
  isPrivate: boolean;
  tags?: string[]; // User-defined tags for organization
}

export type AttachmentType = 
  | 'photo'
  | 'video'
  | 'audio'
  | 'document'
  | 'link'
  | 'other';

/**
 * Relationship Health Analytics - UPDATED for World-Class Architecture
 * Computed analytics about the relationship
 * STORAGE: users/{userId}/relationshipHealth/{healthId}
 * SOURCE: WORLD_CLASS_DATABASE_ARCHITECTURE.md - Addresses Emotional Labor Imbalance
 */
export interface RelationshipHealthAnalytics {
  id: string;
  personId: string; // indexed
  userId: string;
  calculatedAt: Date; // indexed
  
  // Overall Health Score
  overallScore: number; // 1-10, indexed
  trend: 'improving' | 'stable' | 'declining'; // indexed
  
  // Health Factors (NEW: Detailed breakdown)
  factors: {
    communicationFrequency: number; // 1-10 score
    interactionQuality: number; // 1-10 score
    emotionalBalance: number; // 1-10 score based on emotional signals
    reciprocity: number; // 1-10 score for mutual investment
  };
  
  // Communication Metrics
  totalInteractions: number;
  interactionsThisMonth: number;
  interactionsThisYear: number;
  averageDaysBetweenContact: number;
  longestGapDays: number;
  
  // Interaction Quality
  averageInteractionQuality: number;
  emotionalToneDistribution: Record<EmotionalTone, number>;
  
  // NEW: Emotional Intelligence Metrics
  emotionalGiving: number; // Support provided to others (1-10)
  emotionalReceiving: number; // Support received from others (1-10)
  emotionalReciprocity: number; // Balance between giving/receiving (1-10)
  stressResponsePattern: 'avoidant' | 'supportive' | 'demanding' | 'balanced';
  supportOfferingStyle: 'proactive' | 'reactive' | 'minimal' | 'overwhelming';
  
  // Engagement Patterns
  preferredContactMethods: ContactMethodType[];
  bestTimeToContact?: {
    dayOfWeek: number; // 0-6
    hourOfDay: number; // 0-23
  };
  
  // Lifecycle
  relationshipDuration: number; // Days since first interaction
  relationshipStage: RelationshipStage;
  
  // AI Insights (Enhanced for Firebase AI Logic)
  recommendations: string[]; // AI-generated improvement suggestions
  aiGeneratedInsights?: string[];
  lastInsightGeneration?: Date;
  insightModel?: string; // AI model used for insights
  
  // Metadata
  lastCalculated: Date;
  version: number;
}

export type RelationshipStage = 
  | 'new' // < 30 days
  | 'developing' // 30-90 days
  | 'established' // 90 days - 1 year
  | 'mature' // 1+ years
  | 'declining' // Reduced contact frequency
  | 'dormant' // No contact > 6 months
  | 'reconnecting' // Recent contact after gap
  | 'ended'; // Explicitly marked as ended

/**
 * Type Guards for Validation
 */
export const isValidRelationshipType = (type: string): type is RelationshipType => {
  return ['family', 'friend', 'romantic', 'professional', 'acquaintance', 
          'mentor', 'mentee', 'neighbor', 'service_provider', 'other'].includes(type);
};

export const isValidInteractionType = (type: string): type is InteractionType => {
  return ['conversation', 'phone_call', 'video_call', 'text_message', 'email',
          'social_media', 'meeting', 'meal', 'activity', 'event', 'help',
          'conflict', 'celebration', 'support', 'other'].includes(type);
};

export const isValidEmotionalTone = (tone: string): tone is EmotionalTone => {
  return ['very_positive', 'positive', 'neutral', 'negative', 'very_negative',
          'mixed', 'unknown'].includes(tone);
};

/**
 * Default Values and Constants
 */
export const DEFAULT_RELATIONSHIP_INTENSITY = 5;
export const DEFAULT_INTERACTION_QUALITY = 5;
export const DEFAULT_HEALTH_SCORE = 7;

export const RELATIONSHIP_HEALTH_THRESHOLDS = {
  EXCELLENT: 8,
  GOOD: 6,
  AVERAGE: 4,
  NEEDS_ATTENTION: 2,
  CRITICAL: 0,
} as const;

export const CONTACT_FREQUENCY_TARGETS = {
  family: 7, // Days
  friend: 14,
  romantic: 1,
  professional: 30,
  acquaintance: 90,
  mentor: 14,
  mentee: 14,
  neighbor: 30,
  service_provider: 180,
  other: 60,
} as const;

/**
 * NEW: Temporal Trigger Interface - Automated Relationship Maintenance
 * STORAGE: users/{userId}/temporalTriggers/{triggerId}
 * SOURCE: WORLD_CLASS_DATABASE_ARCHITECTURE.md - Addresses Forgotten Moment Problem
 */
export interface TemporalTrigger {
  id: string;
  userId: string;
  
  // Trigger Configuration
  triggerType: string; // indexed - 'birthday' | 'anniversary' | 'follow_up' | 'check_in'
  targetDate: Date; // indexed - when trigger should fire
  personId?: string; // indexed - specific person (optional for general triggers)
  eventId?: string; // related life event
  isActive: boolean; // indexed
  
  // Recurrence
  repeatInterval?: string; // 'yearly' | 'monthly' | 'weekly' | 'days:N'
  lastFired?: Date;
  nextFireDate?: Date; // indexed for efficient querying
  
  // Trigger Conditions
  triggerConditions: {
    daysBefore?: number; // Fire N days before target date
    relationshipHealthThreshold?: number; // Only fire if health score below this
    lastContactDays?: number; // Only fire if no contact for N days
  };
  
  // Generated Content
  generatedPromptId?: string; // Link to generated prompt when fired
  
  // Metadata
  createdAt: Date;
  lastUpdated: Date;
}

/**
 * NEW: Conflict Resolution Interface - Multi-User Synchronization
 * STORAGE: users/{userId}/conflictResolution/{conflictId}
 * SOURCE: WORLD_CLASS_DATABASE_ARCHITECTURE.md - Multi-User Sync & Conflict Resolution
 */
export interface ConflictResolution {
  id: string;
  userId: string;
  
  // Conflict Information
  documentPath: string; // indexed - path to conflicted document
  conflictType: string; // indexed - 'interaction_merge' | 'relationship_health_conflict' | 'temporal_event_conflict'
  detectedAt: Date; // indexed
  
  // Conflict Data
  localVersion: Record<string, any>; // User's local version
  serverVersion: Record<string, any>; // Server version
  
  // Resolution
  resolution?: string; // 'keep_local' | 'use_server' | 'merge' | 'manual_resolve'
  resolvedAt?: Date;
  resolvedBy?: string; // 'system' | 'user' | 'ai'
  
  // Resolution Details
  mergedResult?: Record<string, any>; // Final merged data if applicable
  userChoice?: string; // User's resolution choice for future similar conflicts
  
  // Metadata
  status: 'pending' | 'resolved' | 'ignored';
}

/**
 * Utility Types - UPDATED for World-Class Architecture
 */
export type PersonDocumentUpdate = Partial<Omit<PersonDocument, 'id' | 'createdAt' | 'createdBy'>>;
export type InteractionRecordCreate = Omit<InteractionRecord, 'id' | 'createdAt' | 'lastUpdated'>;
export type LifeEventCreate = Omit<LifeEvent, 'id' | 'createdAt' | 'lastUpdated' | 'userId'>;
export type EmotionalSignalCreate = Omit<EmotionalSignal, 'id' | 'createdAt'>;
export type ContextThreadCreate = Omit<ContextThread, 'id' | 'createdAt' | 'lastUpdated'>;
export type AttachmentReferenceCreate = Omit<AttachmentReference, 'id' | 'uploadedAt'>;
export type TemporalTriggerCreate = Omit<TemporalTrigger, 'id' | 'createdAt' | 'lastUpdated'>;

// NEW: World-Class Architecture Type Guards
export const isValidEmotionType = (emotion: string): emotion is EmotionalSignal['emotionType'] => {
  return ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'trust', 'anticipation'].includes(emotion);
};

export const isValidRelationalContext = (context: string): context is EmotionalSignal['relationalContext'] => {
  return ['support', 'conflict', 'celebration', 'concern', 'gratitude', 'nostalgia'].includes(context);
};

export const isValidDetectionMethod = (method: string): method is EmotionalSignal['detectionMethod'] => {
  return ['user_reported', 'ai_extracted', 'behavioral_inferred'].includes(method);
};

// NEW: World-Class Architecture Constants
export const EMOTIONAL_INTENSITY_SCALE = {
  MIN: 1,
  MAX: 10,
  DEFAULT: 5,
} as const;

export const AI_CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.5,
  LOW: 0.3,
} as const;

export const RELATIONSHIP_HEALTH_CALCULATION = {
  WEIGHTS: {
    communicationFrequency: 0.3,
    interactionQuality: 0.25,
    emotionalBalance: 0.25,
    reciprocity: 0.2,
  },
  RECALCULATION_INTERVAL_DAYS: 7,
} as const;

export default {
  isValidRelationshipType,
  isValidInteractionType,
  isValidEmotionalTone,
  isValidEmotionType,
  isValidRelationalContext,
  isValidDetectionMethod,
  DEFAULT_RELATIONSHIP_INTENSITY,
  DEFAULT_INTERACTION_QUALITY,
  DEFAULT_HEALTH_SCORE,
  RELATIONSHIP_HEALTH_THRESHOLDS,
  CONTACT_FREQUENCY_TARGETS,
  EMOTIONAL_INTENSITY_SCALE,
  AI_CONFIDENCE_THRESHOLDS,
  RELATIONSHIP_HEALTH_CALCULATION,
};