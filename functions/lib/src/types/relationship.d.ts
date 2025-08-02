/**
 * Core Person Document Interface - UPDATED for World-Class Architecture
 * Represents an individual in the user's relationship network
 * SOURCE: WORLD_CLASS_DATABASE_ARCHITECTURE.md - Firestore subcollections structure
 * MIGRATION: From nested arrays to subcollections for unlimited scaling
 */
export interface PersonDocument {
    id: string;
    displayName: string;
    nicknames: string[];
    roles: RelationshipRole[];
    relationshipType: RelationshipType;
    relationshipIntensity: number;
    contactMethods: ContactMethod[];
    socialProfiles: SocialProfile[];
    location?: LocationInfo;
    demographics?: Demographics;
    relationshipHealth: number;
    communicationFrequency: number;
    lastContact?: Date;
    nextContactSuggestion?: Date;
    tags: string[];
    searchKeywords: string[];
    createdAt: Date;
    lastUpdated: Date;
    createdBy: string;
    isPrivate: boolean;
    sharedWith: string[];
    version: number;
}
/**
 * Relationship Types
 * SOURCE: Personal relationship categorization standards
 */
export type RelationshipType = 'family' | 'friend' | 'romantic' | 'professional' | 'acquaintance' | 'mentor' | 'mentee' | 'neighbor' | 'service_provider' | 'other';
/**
 * Relationship Roles
 * More granular than relationship types
 */
export type RelationshipRole = 'parent' | 'child' | 'sibling' | 'spouse' | 'partner' | 'grandparent' | 'grandchild' | 'aunt' | 'uncle' | 'cousin' | 'in_law' | 'step_family' | 'extended_family' | 'best_friend' | 'close_friend' | 'friend' | 'old_friend' | 'college_friend' | 'childhood_friend' | 'online_friend' | 'colleague' | 'boss' | 'employee' | 'client' | 'vendor' | 'business_partner' | 'mentor' | 'mentee' | 'networking_contact' | 'neighbor' | 'classmate' | 'teammate' | 'club_member' | 'volunteer_partner' | 'community_leader' | 'doctor' | 'therapist' | 'trainer' | 'teacher' | 'advisor' | 'contractor' | 'service_provider' | 'acquaintance' | 'contact' | 'other';
/**
 * Contact Method Information
 */
export interface ContactMethod {
    type: ContactMethodType;
    value: string;
    label?: string;
    isPrimary: boolean;
    isVerified: boolean;
    lastUsed?: Date;
}
export type ContactMethodType = 'email' | 'phone' | 'text' | 'address' | 'social_media' | 'messaging_app' | 'video_call' | 'other';
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
export type SocialPlatform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'github' | 'tiktok' | 'snapchat' | 'whatsapp' | 'telegram' | 'other';
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
    isApproximate: boolean;
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
export type AgeRange = 'under_18' | '18_25' | '26_35' | '36_45' | '46_55' | '56_65' | 'over_65' | 'unknown';
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
    type: InteractionType;
    timestamp: Date;
    duration?: number;
    location?: string;
    notes?: string;
    topics?: string[];
    emotionalTone: EmotionalTone;
    interactionQuality: number;
    contactMethod?: ContactMethodType;
    initiatedBy: 'user' | 'other' | 'mutual';
    aiExtracted: boolean;
    aiExtractedContext?: AIExtractedContext;
    needsReview?: boolean;
    isPrivate: boolean;
    createdAt: Date;
    lastUpdated: Date;
}
export type InteractionType = 'conversation' | 'phone_call' | 'video_call' | 'text_message' | 'email' | 'social_media' | 'meeting' | 'meal' | 'activity' | 'event' | 'help' | 'conflict' | 'celebration' | 'support' | 'other';
export type EmotionalTone = 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative' | 'mixed' | 'unknown';
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
    emotionType: 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'trust' | 'anticipation';
    intensity: number;
    relationalContext: 'support' | 'conflict' | 'celebration' | 'concern' | 'gratitude' | 'nostalgia';
    timestamp: Date;
    duration?: number;
    detectionMethod: 'user_reported' | 'ai_extracted' | 'behavioral_inferred';
    confidence: number;
    context?: string;
    triggerEvent?: string;
    relatedInteractionId?: string;
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
    topic: string;
    lastUpdate: Date;
    participants: string[];
    platform: string;
    threadType: string;
    priority: string;
    isActive: boolean;
    summary?: string;
    keyPoints?: string[];
    nextSteps?: string[];
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
    confidence: number;
    lifeEvents?: LifeEvent[];
    interests?: string[];
    preferences?: string[];
    relationships?: string[];
    locations?: string[];
    sentiment: EmotionalTone;
    sentimentScore: number;
    importantDates?: ImportantDate[];
    followUpSuggestions?: string[];
    model: string;
    processingVersion: string;
    apiProvider: 'firebase-ai-logic' | 'gemini-developer-api';
    processingTime?: number;
    rawTranscript?: string;
    structuredData?: Record<string, any>;
    contextEmbedding?: number[];
    embeddingMetadata?: {
        model: 'vertex-ai-text-embeddings' | 'gemini-text-embedding';
        generatedAt: Date;
        algorithm?: 'tree-ah';
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
    type: LifeEventType;
    title: string;
    description?: string;
    date: Date;
    isApproximate: boolean;
    importance: number;
    category: EventCategory;
    source: 'user_input' | 'ai_extracted' | 'social_media' | 'calendar';
    sourceReference?: string;
    reminderDate?: Date;
    reminderSent: boolean;
    isRecurring: boolean;
    recurrencePattern?: RecurrencePattern;
    emotionalSignificance?: number;
    relatedEmotionalSignals?: string[];
    createdAt: Date;
    lastUpdated: Date;
    isPrivate: boolean;
}
export type LifeEventType = 'birthday' | 'anniversary' | 'wedding' | 'graduation' | 'job_change' | 'promotion' | 'relocation' | 'birth' | 'death' | 'illness' | 'recovery' | 'achievement' | 'milestone' | 'travel' | 'hobby_start' | 'relationship_start' | 'relationship_end' | 'other';
export type EventCategory = 'personal' | 'professional' | 'family' | 'health' | 'achievement' | 'transition' | 'celebration' | 'loss' | 'other';
/**
 * Important Date
 * Recurring or significant dates related to a person
 */
export interface ImportantDate {
    id: string;
    personId: string;
    type: ImportantDateType;
    date: Date;
    isRecurring: boolean;
    recurrencePattern?: RecurrencePattern;
    title: string;
    description?: string;
    category: EventCategory;
    reminderEnabled: boolean;
    reminderDaysBefore: number;
    customReminderMessage?: string;
    createdAt: Date;
    lastUpdated: Date;
    source: 'user_input' | 'ai_extracted';
}
export type ImportantDateType = 'birthday' | 'anniversary' | 'work_anniversary' | 'holiday' | 'custom' | 'deadline' | 'appointment' | 'celebration' | 'memorial' | 'other';
/**
 * Recurrence Pattern
 */
export interface RecurrencePattern {
    frequency: 'yearly' | 'monthly' | 'weekly' | 'daily' | 'custom';
    interval: number;
    endDate?: Date;
    exceptions?: Date[];
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
    type: AttachmentType;
    filename: string;
    storageUrl: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
    description?: string;
    relatedEventId?: string;
    relatedInteractionId?: string;
    isPrivate: boolean;
    tags?: string[];
}
export type AttachmentType = 'photo' | 'video' | 'audio' | 'document' | 'link' | 'other';
/**
 * Relationship Health Analytics - UPDATED for World-Class Architecture
 * Computed analytics about the relationship
 * STORAGE: users/{userId}/relationshipHealth/{healthId}
 * SOURCE: WORLD_CLASS_DATABASE_ARCHITECTURE.md - Addresses Emotional Labor Imbalance
 */
export interface RelationshipHealthAnalytics {
    id: string;
    personId: string;
    userId: string;
    calculatedAt: Date;
    overallScore: number;
    trend: 'improving' | 'stable' | 'declining';
    factors: {
        communicationFrequency: number;
        interactionQuality: number;
        emotionalBalance: number;
        reciprocity: number;
    };
    totalInteractions: number;
    interactionsThisMonth: number;
    interactionsThisYear: number;
    averageDaysBetweenContact: number;
    longestGapDays: number;
    averageInteractionQuality: number;
    emotionalToneDistribution: Record<EmotionalTone, number>;
    emotionalGiving: number;
    emotionalReceiving: number;
    emotionalReciprocity: number;
    stressResponsePattern: 'avoidant' | 'supportive' | 'demanding' | 'balanced';
    supportOfferingStyle: 'proactive' | 'reactive' | 'minimal' | 'overwhelming';
    preferredContactMethods: ContactMethodType[];
    bestTimeToContact?: {
        dayOfWeek: number;
        hourOfDay: number;
    };
    relationshipDuration: number;
    relationshipStage: RelationshipStage;
    recommendations: string[];
    aiGeneratedInsights?: string[];
    lastInsightGeneration?: Date;
    insightModel?: string;
    lastCalculated: Date;
    version: number;
}
export type RelationshipStage = 'new' | 'developing' | 'established' | 'mature' | 'declining' | 'dormant' | 'reconnecting' | 'ended';
/**
 * Type Guards for Validation
 */
export declare const isValidRelationshipType: (type: string) => type is RelationshipType;
export declare const isValidInteractionType: (type: string) => type is InteractionType;
export declare const isValidEmotionalTone: (tone: string) => tone is EmotionalTone;
/**
 * Default Values and Constants
 */
export declare const DEFAULT_RELATIONSHIP_INTENSITY = 5;
export declare const DEFAULT_INTERACTION_QUALITY = 5;
export declare const DEFAULT_HEALTH_SCORE = 7;
export declare const RELATIONSHIP_HEALTH_THRESHOLDS: {
    readonly EXCELLENT: 8;
    readonly GOOD: 6;
    readonly AVERAGE: 4;
    readonly NEEDS_ATTENTION: 2;
    readonly CRITICAL: 0;
};
export declare const CONTACT_FREQUENCY_TARGETS: {
    readonly family: 7;
    readonly friend: 14;
    readonly romantic: 1;
    readonly professional: 30;
    readonly acquaintance: 90;
    readonly mentor: 14;
    readonly mentee: 14;
    readonly neighbor: 30;
    readonly service_provider: 180;
    readonly other: 60;
};
/**
 * NEW: Temporal Trigger Interface - Automated Relationship Maintenance
 * STORAGE: users/{userId}/temporalTriggers/{triggerId}
 * SOURCE: WORLD_CLASS_DATABASE_ARCHITECTURE.md - Addresses Forgotten Moment Problem
 */
export interface TemporalTrigger {
    id: string;
    userId: string;
    triggerType: string;
    targetDate: Date;
    personId?: string;
    eventId?: string;
    isActive: boolean;
    repeatInterval?: string;
    lastFired?: Date;
    nextFireDate?: Date;
    triggerConditions: {
        daysBefore?: number;
        relationshipHealthThreshold?: number;
        lastContactDays?: number;
    };
    generatedPromptId?: string;
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
    documentPath: string;
    conflictType: string;
    detectedAt: Date;
    localVersion: Record<string, any>;
    serverVersion: Record<string, any>;
    resolution?: string;
    resolvedAt?: Date;
    resolvedBy?: string;
    mergedResult?: Record<string, any>;
    userChoice?: string;
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
export declare const isValidEmotionType: (emotion: string) => emotion is "joy" | "sadness" | "anger" | "fear" | "surprise" | "disgust" | "trust" | "anticipation";
export declare const isValidRelationalContext: (context: string) => context is "conflict" | "celebration" | "support" | "concern" | "gratitude" | "nostalgia";
export declare const isValidDetectionMethod: (method: string) => method is "user_reported" | "ai_extracted" | "behavioral_inferred";
export declare const EMOTIONAL_INTENSITY_SCALE: {
    readonly MIN: 1;
    readonly MAX: 10;
    readonly DEFAULT: 5;
};
export declare const AI_CONFIDENCE_THRESHOLDS: {
    readonly HIGH: 0.8;
    readonly MEDIUM: 0.5;
    readonly LOW: 0.3;
};
export declare const RELATIONSHIP_HEALTH_CALCULATION: {
    readonly WEIGHTS: {
        readonly communicationFrequency: 0.3;
        readonly interactionQuality: 0.25;
        readonly emotionalBalance: 0.25;
        readonly reciprocity: 0.2;
    };
    readonly RECALCULATION_INTERVAL_DAYS: 7;
};
declare const _default: {
    isValidRelationshipType: (type: string) => type is RelationshipType;
    isValidInteractionType: (type: string) => type is InteractionType;
    isValidEmotionalTone: (tone: string) => tone is EmotionalTone;
    isValidEmotionType: (emotion: string) => emotion is "joy" | "sadness" | "anger" | "fear" | "surprise" | "disgust" | "trust" | "anticipation";
    isValidRelationalContext: (context: string) => context is "conflict" | "celebration" | "support" | "concern" | "gratitude" | "nostalgia";
    isValidDetectionMethod: (method: string) => method is "user_reported" | "ai_extracted" | "behavioral_inferred";
    DEFAULT_RELATIONSHIP_INTENSITY: number;
    DEFAULT_INTERACTION_QUALITY: number;
    DEFAULT_HEALTH_SCORE: number;
    RELATIONSHIP_HEALTH_THRESHOLDS: {
        readonly EXCELLENT: 8;
        readonly GOOD: 6;
        readonly AVERAGE: 4;
        readonly NEEDS_ATTENTION: 2;
        readonly CRITICAL: 0;
    };
    CONTACT_FREQUENCY_TARGETS: {
        readonly family: 7;
        readonly friend: 14;
        readonly romantic: 1;
        readonly professional: 30;
        readonly acquaintance: 90;
        readonly mentor: 14;
        readonly mentee: 14;
        readonly neighbor: 30;
        readonly service_provider: 180;
        readonly other: 60;
    };
    EMOTIONAL_INTENSITY_SCALE: {
        readonly MIN: 1;
        readonly MAX: 10;
        readonly DEFAULT: 5;
    };
    AI_CONFIDENCE_THRESHOLDS: {
        readonly HIGH: 0.8;
        readonly MEDIUM: 0.5;
        readonly LOW: 0.3;
    };
    RELATIONSHIP_HEALTH_CALCULATION: {
        readonly WEIGHTS: {
            readonly communicationFrequency: 0.3;
            readonly interactionQuality: 0.25;
            readonly emotionalBalance: 0.25;
            readonly reciprocity: 0.2;
        };
        readonly RECALCULATION_INTERVAL_DAYS: 7;
    };
};
export default _default;
//# sourceMappingURL=relationship.d.ts.map