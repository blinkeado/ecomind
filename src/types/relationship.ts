// SOURCE: IMPLEMENTATION_PLAN.md line 74 + 05-knowledge-graph.md relationship model
// VERIFIED: Data models based on EcoMind Personal Relationship Assistant specifications

import { Timestamp } from '@react-native-firebase/firestore';

/**
 * Core Person Document Interface
 * Represents an individual in the user's relationship network
 * SOURCE: 05-knowledge-graph.md PersonDocument specification
 */
export interface PersonDocument {
  // Core Identity
  id: string;
  displayName: string;
  nicknames: string[];
  
  // Relationship Context
  roles: RelationshipRole[];
  relationshipType: RelationshipType;
  relationshipIntensity: number; // 1-10 scale
  
  // Contact Information
  contactMethods: ContactMethod[];
  socialProfiles: SocialProfile[];
  
  // Physical & Contextual Information
  location?: LocationInfo;
  demographics?: Demographics;
  
  // Relationship Health & Analytics
  relationshipHealth: number; // 1-10 calculated score
  communicationFrequency: number; // Average days between contacts
  lastContact?: Date;
  nextContactSuggestion?: Date;
  
  // Metadata
  createdAt: Date;
  lastUpdated: Date;
  createdBy: string; // User ID
  
  // Privacy & Sharing
  isPrivate: boolean;
  sharedWith: string[]; // User IDs with access
  
  // System Fields
  version: number; // For data migration compatibility
  tags: string[]; // User-defined tags
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
 * Interaction Record
 * Tracks communications and meetings with a person
 */
export interface InteractionRecord {
  id: string;
  personId: string;
  userId: string;
  
  // Interaction Details
  type: InteractionType;
  timestamp: Date;
  duration?: number; // Minutes
  location?: string;
  
  // Content & Context
  notes?: string;
  topics?: string[];
  emotionalTone: EmotionalTone;
  interactionQuality: number; // 1-10 scale
  
  // Communication Method
  contactMethod?: ContactMethodType;
  initiatedBy: 'user' | 'other' | 'mutual';
  
  // Metadata
  isPrivate: boolean;
  attachments?: AttachmentReference[];
  createdAt: Date;
  lastUpdated: Date;
  
  // AI Processing
  aiExtractedContext?: AIExtractedContext;
  needsReview?: boolean; // If AI extraction needs user confirmation
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
 * AI Extracted Context
 * Information extracted from interaction notes by AI
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
  
  // Metadata
  model: string; // AI model used
  processingVersion: string;
}

/**
 * Life Event
 * Significant events in a person's life
 */
export interface LifeEvent {
  id: string;
  personId: string;
  
  // Event Details
  type: LifeEventType;
  title: string;
  description?: string;
  date: Date;
  isApproximate: boolean;
  
  // Significance
  importance: number; // 1-10 scale
  category: EventCategory;
  
  // Source Information
  source: 'user_input' | 'ai_extracted' | 'social_media' | 'calendar';
  sourceReference?: string;
  
  // Metadata
  createdAt: Date;
  lastUpdated: Date;
  isPrivate: boolean;
  
  // Reminders
  reminderDate?: Date;
  reminderSent: boolean;
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
 * Attachment Reference
 * References to files, photos, or other media
 */
export interface AttachmentReference {
  id: string;
  type: AttachmentType;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  description?: string;
}

export type AttachmentType = 
  | 'photo'
  | 'video'
  | 'audio'
  | 'document'
  | 'link'
  | 'other';

/**
 * Relationship Statistics
 * Computed analytics about the relationship
 */
export interface RelationshipStats {
  personId: string;
  userId: string;
  
  // Communication Metrics
  totalInteractions: number;
  interactionsThisMonth: number;
  interactionsThisYear: number;
  averageDaysBetweenContact: number;
  longestGapDays: number;
  
  // Interaction Quality
  averageInteractionQuality: number;
  emotionalToneDistribution: Record<EmotionalTone, number>;
  
  // Relationship Health
  relationshipHealthScore: number;
  healthTrend: 'improving' | 'stable' | 'declining';
  lastHealthCalculation: Date;
  
  // Engagement Patterns
  preferredContactMethods: ContactMethodType[];
  bestTimeToContact?: {
    dayOfWeek: number; // 0-6
    hourOfDay: number; // 0-23
  };
  
  // Lifecycle
  relationshipDuration: number; // Days since first interaction
  relationshipStage: RelationshipStage;
  
  // AI Insights
  aiGeneratedInsights?: string[];
  lastInsightGeneration?: Date;
  
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
 * Utility Types
 */
export type PersonDocumentUpdate = Partial<Omit<PersonDocument, 'id' | 'createdAt' | 'createdBy'>>;
export type InteractionRecordCreate = Omit<InteractionRecord, 'id' | 'createdAt' | 'lastUpdated'>;
export type LifeEventCreate = Omit<LifeEvent, 'id' | 'createdAt' | 'lastUpdated'>;

export default {
  isValidRelationshipType,
  isValidInteractionType,
  isValidEmotionalTone,
  DEFAULT_RELATIONSHIP_INTENSITY,
  DEFAULT_INTERACTION_QUALITY,
  DEFAULT_HEALTH_SCORE,
  RELATIONSHIP_HEALTH_THRESHOLDS,
  CONTACT_FREQUENCY_TARGETS,
};