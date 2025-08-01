// SOURCE: IMPLEMENTATION_PLAN.md line 76 + AI prompt generation requirements
// VERIFIED: Based on EcoMind Personal Relationship Assistant AI system specifications

/**
 * AI-Generated Prompt Types
 * Defines the structure for relationship prompts and suggestions
 * SOURCE: 04-system-context.md AI integration specifications
 */

import { RelationshipType, EmotionalTone } from './relationship';

/**
 * Relationship Prompt
 * AI-generated suggestions for relationship maintenance
 */
export interface RelationshipPrompt {
  id: string;
  userId: string;
  personId: string;
  
  // Prompt Content
  type: PromptType;
  title: string;
  description: string;
  suggestion: string;
  
  // Urgency & Priority
  urgency: PromptUrgency;
  priority: number; // 1-10 scale
  
  // Context Information
  context: PromptContext;
  reasoning?: string; // Why this prompt was generated
  
  // Timing
  createdAt: Date;
  scheduledFor?: Date;
  expiresAt?: Date;
  
  // User Interaction
  status: PromptStatus;
  userResponse?: PromptUserResponse;
  completedAt?: Date;
  dismissedAt?: Date;
  snoozeUntil?: Date;
  
  // AI Generation Metadata
  aiModel: string;
  confidence: number; // 0-1 scale
  generationVersion: string;
  
  // Personalization
  personalizationFactors: PersonalizationFactor[];
  relationshipStage: string;
  lastInteractionDays?: number;
  
  // Analytics
  viewCount: number;
  lastViewed?: Date;
  engagementScore?: number; // Calculated based on user interaction
}

/**
 * Prompt Types
 * Categories of relationship maintenance suggestions
 */
export type PromptType = 
  | 'check_in' // General check-in suggestion
  | 'birthday' // Birthday reminder
  | 'anniversary' // Anniversary reminder
  | 'follow_up' // Follow up on previous conversation
  | 'support' // Offer support during difficult time
  | 'celebrate' // Celebrate achievement or good news
  | 'reconnect' // Reconnect after long gap
  | 'activity_suggestion' // Suggest shared activity
  | 'gratitude' // Express gratitude or appreciation
  | 'apologize' // Suggest making amends
  | 'share_update' // Share personal update
  | 'ask_advice' // Seek advice or opinion
  | 'offer_help' // Offer assistance
  | 'holiday_greeting' // Holiday or special occasion greeting
  | 'milestone' // Acknowledge milestone or achievement
  | 'sympathy' // Express sympathy or condolences
  | 'congratulations' // Congratulate on success
  | 'thinking_of_you' // General thinking of you message
  | 'custom' // Custom AI-generated suggestion
  | 'other';

/**
 * Prompt Urgency Levels
 */
export type PromptUrgency = 
  | 'low' // Nice to do, no time pressure
  | 'medium' // Should do soon
  | 'high' // Important, time-sensitive
  | 'critical'; // Urgent, may damage relationship if ignored

/**
 * Prompt Status
 */
export type PromptStatus = 
  | 'active' // Currently shown to user
  | 'completed' // User acted on the prompt
  | 'dismissed' // User dismissed without action
  | 'snoozed' // User postponed
  | 'expired' // Passed expiration date
  | 'archived'; // Moved to archive

/**
 * Prompt Context
 * Information that influenced the prompt generation
 */
export interface PromptContext {
  // Relationship Context
  relationshipHealth: number;
  daysSinceLastContact: number;
  recentInteractionTone?: EmotionalTone;
  relationshipType: RelationshipType;
  
  // Life Events Context
  upcomingEvents?: LifeEventContext[];
  recentEvents?: LifeEventContext[];
  
  // Communication Patterns
  preferredContactMethod?: string;
  bestTimeToContact?: TimePreference;
  communicationStyle?: CommunicationStyle;
  
  // Seasonal/Temporal Context
  season?: Season;
  isHoliday?: boolean;
  dayOfWeek?: number; // 0-6
  timeOfDay?: TimeOfDay;
  
  // User Context
  userMood?: EmotionalTone;
  userAvailability?: AvailabilityLevel;
  
  // External Factors
  weatherInfluence?: boolean;
  socialMediaActivity?: boolean;
  mutualConnections?: string[]; // IDs of mutual contacts
}

/**
 * Life Event Context for Prompts
 */
export interface LifeEventContext {
  eventId: string;
  type: string;
  title: string;
  date: Date;
  importance: number;
  daysUntil?: number;
  daysSince?: number;
}

/**
 * Time Preference
 */
export interface TimePreference {
  dayOfWeek: number; // 0-6 (Sunday to Saturday)
  hourRange: {
    start: number; // 0-23
    end: number; // 0-23
  };
  timezone?: string;
}

/**
 * Communication Style
 */
export type CommunicationStyle = 
  | 'formal' // Professional, structured
  | 'casual' // Friendly, relaxed
  | 'intimate' // Close, personal
  | 'playful' // Humorous, light-hearted
  | 'supportive' // Caring, empathetic
  | 'brief' // Concise, to-the-point
  | 'detailed' // Thorough, comprehensive
  | 'mixed'; // Varies by context

/**
 * Seasonal Context
 */
export type Season = 'spring' | 'summer' | 'fall' | 'winter';

/**
 * Time of Day Context
 */
export type TimeOfDay = 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night';

/**
 * Availability Level
 */
export type AvailabilityLevel = 'very_busy' | 'busy' | 'moderate' | 'available' | 'very_available';

/**
 * User Response to Prompt
 */
export interface PromptUserResponse {
  action: PromptAction;
  timestamp: Date;
  
  // Response Details
  contactMethod?: string; // How they reached out
  interactionId?: string; // Reference to created interaction
  feedback?: PromptFeedback;
  customNote?: string; // User's note about the action taken
  
  // Outcome
  wasHelpful: boolean;
  satisfactionRating?: number; // 1-5 scale
  suggestedImprovements?: string;
}

/**
 * Prompt Actions
 */
export type PromptAction = 
  | 'contacted_person' // User reached out to the person
  | 'scheduled_contact' // User scheduled future contact
  | 'noted_reminder' // User noted to remember for later
  | 'modified_prompt' // User modified the suggestion
  | 'declined' // User chose not to act
  | 'not_applicable' // Prompt no longer relevant
  | 'other';

/**
 * Prompt Feedback
 */
export interface PromptFeedback {
  accuracy: number; // 1-5 scale - How accurate was the prompt?
  relevance: number; // 1-5 scale - How relevant was the prompt?
  timing: number; // 1-5 scale - Was the timing appropriate?
  helpfulness: number; // 1-5 scale - How helpful was the suggestion?
  
  // Qualitative Feedback
  liked?: string[]; // What user liked about the prompt
  disliked?: string[]; // What user didn't like
  suggestions?: string[]; // Suggestions for improvement
  
  // Overall Rating
  overallRating: number; // 1-5 scale
}

/**
 * Personalization Factors
 * Factors that influenced prompt personalization
 */
export type PersonalizationFactor = 
  | 'relationship_history' // Based on past interactions
  | 'communication_pattern' // Based on typical communication
  | 'life_events' // Based on known life events
  | 'seasonal_pattern' // Based on seasonal behavior
  | 'emotional_context' // Based on recent emotional tone
  | 'user_preferences' // Based on user settings
  | 'relationship_health' // Based on relationship health score
  | 'time_sensitivity' // Based on time-sensitive factors
  | 'mutual_connections' // Based on shared relationships
  | 'external_events' // Based on external factors
  | 'ai_learning' // Based on AI learning from user behavior
  | 'other';

/**
 * Prompt Template
 * Templates used for generating prompts
 */
export interface PromptTemplate {
  id: string;
  type: PromptType;
  name: string;
  
  // Template Content
  titleTemplate: string;
  descriptionTemplate: string;
  suggestionTemplate: string;
  
  // Context Requirements
  requiredContext: string[]; // Required context fields
  optionalContext: string[]; // Optional context fields
  
  // Personalization
  personalizationVariables: string[]; // Variables that can be personalized
  
  // Conditions
  applicableRelationshipTypes: RelationshipType[];
  minRelationshipHealth?: number;
  maxDaysSinceContact?: number;
  minDaysSinceContact?: number;
  
  // Template Metadata
  createdAt: Date;
  lastUpdated: Date;
  version: string;
  isActive: boolean;
  usageCount: number;
  averageRating?: number;
}

/**
 * Prompt Generation Request
 * Request structure for AI prompt generation
 */
export interface PromptGenerationRequest {
  userId: string;
  personId?: string; // If null, generate for all people
  
  // Generation Parameters
  maxPrompts: number;
  urgencyFilter?: PromptUrgency[];
  typeFilter?: PromptType[];
  
  // Context Override
  contextOverride?: Partial<PromptContext>;
  
  // Personalization
  personalizationLevel: 'low' | 'medium' | 'high';
  includeExperimental?: boolean; // Include experimental prompt types
  
  // Timing
  scheduleFor?: Date; // When prompts should be active
  
  // Metadata
  requestId: string;
  requestedAt: Date;
  clientVersion: string;
}

/**
 * Prompt Generation Response
 */
export interface PromptGenerationResponse {
  requestId: string;
  generatedAt: Date;
  
  // Generated Prompts
  prompts: RelationshipPrompt[];
  
  // Generation Metadata
  totalGenerated: number;
  processingTime: number; // milliseconds
  aiModel: string;
  version: string;
  
  // Quality Metrics
  averageConfidence: number;
  qualityScore: number; // Internal AI quality assessment
  
  // Errors or Warnings
  warnings?: string[];
  errors?: string[];
  
  // Context Used
  contextSummary: PromptContextSummary;
}

/**
 * Prompt Context Summary
 * Summary of context used in generation
 */
export interface PromptContextSummary {
  relationshipsAnalyzed: number;
  lifeEventsConsidered: number;
  interactionsAnalyzed: number;
  timeframeDays: number;
  
  // Context Quality
  dataCompletenessScore: number; // 0-1 scale
  contextRelevanceScore: number; // 0-1 scale
  
  // Generation Insights
  primaryInfluencingFactors: PersonalizationFactor[];
  seasonalFactorsApplied: boolean;
  emergencyFactorsDetected: boolean;
}

/**
 * Prompt Analytics
 * Analytics data for prompt performance
 */
export interface PromptAnalytics {
  promptId: string;
  
  // Engagement Metrics
  viewCount: number;
  clickThroughRate: number; // CTR
  completionRate: number;
  dismissalRate: number;
  snoozeRate: number;
  
  // Quality Metrics
  averageRating: number;
  feedbackCount: number;
  reportCount: number; // Number of times reported as inappropriate
  
  // Timing Metrics
  averageTimeToAction: number; // Minutes
  averageTimeVisible: number; // Minutes
  
  // Outcome Metrics
  successRate: number; // Percentage that led to contact
  satisfactionScore: number;
  
  // Metadata
  lastCalculated: Date;
  sampleSize: number;
}

/**
 * Type Guards
 */
export const isValidPromptType = (type: string): type is PromptType => {
  return ['check_in', 'birthday', 'anniversary', 'follow_up', 'support', 
          'celebrate', 'reconnect', 'activity_suggestion', 'gratitude', 
          'apologize', 'share_update', 'ask_advice', 'offer_help', 
          'holiday_greeting', 'milestone', 'sympathy', 'congratulations',
          'thinking_of_you', 'custom', 'other'].includes(type);
};

export const isValidPromptUrgency = (urgency: string): urgency is PromptUrgency => {
  return ['low', 'medium', 'high', 'critical'].includes(urgency);
};

export const isValidPromptStatus = (status: string): status is PromptStatus => {
  return ['active', 'completed', 'dismissed', 'snoozed', 'expired', 'archived'].includes(status);
};

/**
 * Default Values
 */
export const DEFAULT_PROMPT_EXPIRY_DAYS = 7;
export const DEFAULT_PROMPT_PRIORITY = 5;
export const DEFAULT_MAX_PROMPTS_PER_REQUEST = 10;

export const PROMPT_URGENCY_PRIORITY_MAP = {
  low: 3,
  medium: 5,
  high: 8,
  critical: 10,
} as const;

/**
 * Utility Types
 */
export type PromptCreate = Omit<RelationshipPrompt, 'id' | 'createdAt' | 'viewCount' | 'lastViewed'>;
export type PromptUpdate = Partial<Pick<RelationshipPrompt, 'status' | 'userResponse' | 'completedAt' | 'dismissedAt' | 'snoozeUntil'>>;

export default {
  isValidPromptType,
  isValidPromptUrgency,
  isValidPromptStatus,
  DEFAULT_PROMPT_EXPIRY_DAYS,
  DEFAULT_PROMPT_PRIORITY,
  DEFAULT_MAX_PROMPTS_PER_REQUEST,
  PROMPT_URGENCY_PRIORITY_MAP,
};