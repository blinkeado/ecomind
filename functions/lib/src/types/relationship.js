"use strict";
// SOURCE: IMPLEMENTATION_PLAN.md line 74 + WORLD_CLASS_DATABASE_ARCHITECTURE.md
// VERIFIED: Updated for World-Class Database Architecture with Firebase subcollections
// MIGRATION: From nested arrays to Firestore subcollections for unlimited scaling
// VERSION: 2.0 - Updated for Phase 1 implementation with emotional signals and AI integration
Object.defineProperty(exports, "__esModule", { value: true });
exports.RELATIONSHIP_HEALTH_CALCULATION = exports.AI_CONFIDENCE_THRESHOLDS = exports.EMOTIONAL_INTENSITY_SCALE = exports.isValidDetectionMethod = exports.isValidRelationalContext = exports.isValidEmotionType = exports.CONTACT_FREQUENCY_TARGETS = exports.RELATIONSHIP_HEALTH_THRESHOLDS = exports.DEFAULT_HEALTH_SCORE = exports.DEFAULT_INTERACTION_QUALITY = exports.DEFAULT_RELATIONSHIP_INTENSITY = exports.isValidEmotionalTone = exports.isValidInteractionType = exports.isValidRelationshipType = void 0;
/**
 * Type Guards for Validation
 */
const isValidRelationshipType = (type) => {
    return ['family', 'friend', 'romantic', 'professional', 'acquaintance',
        'mentor', 'mentee', 'neighbor', 'service_provider', 'other'].includes(type);
};
exports.isValidRelationshipType = isValidRelationshipType;
const isValidInteractionType = (type) => {
    return ['conversation', 'phone_call', 'video_call', 'text_message', 'email',
        'social_media', 'meeting', 'meal', 'activity', 'event', 'help',
        'conflict', 'celebration', 'support', 'other'].includes(type);
};
exports.isValidInteractionType = isValidInteractionType;
const isValidEmotionalTone = (tone) => {
    return ['very_positive', 'positive', 'neutral', 'negative', 'very_negative',
        'mixed', 'unknown'].includes(tone);
};
exports.isValidEmotionalTone = isValidEmotionalTone;
/**
 * Default Values and Constants
 */
exports.DEFAULT_RELATIONSHIP_INTENSITY = 5;
exports.DEFAULT_INTERACTION_QUALITY = 5;
exports.DEFAULT_HEALTH_SCORE = 7;
exports.RELATIONSHIP_HEALTH_THRESHOLDS = {
    EXCELLENT: 8,
    GOOD: 6,
    AVERAGE: 4,
    NEEDS_ATTENTION: 2,
    CRITICAL: 0,
};
exports.CONTACT_FREQUENCY_TARGETS = {
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
};
// NEW: World-Class Architecture Type Guards
const isValidEmotionType = (emotion) => {
    return ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'trust', 'anticipation'].includes(emotion);
};
exports.isValidEmotionType = isValidEmotionType;
const isValidRelationalContext = (context) => {
    return ['support', 'conflict', 'celebration', 'concern', 'gratitude', 'nostalgia'].includes(context);
};
exports.isValidRelationalContext = isValidRelationalContext;
const isValidDetectionMethod = (method) => {
    return ['user_reported', 'ai_extracted', 'behavioral_inferred'].includes(method);
};
exports.isValidDetectionMethod = isValidDetectionMethod;
// NEW: World-Class Architecture Constants
exports.EMOTIONAL_INTENSITY_SCALE = {
    MIN: 1,
    MAX: 10,
    DEFAULT: 5,
};
exports.AI_CONFIDENCE_THRESHOLDS = {
    HIGH: 0.8,
    MEDIUM: 0.5,
    LOW: 0.3,
};
exports.RELATIONSHIP_HEALTH_CALCULATION = {
    WEIGHTS: {
        communicationFrequency: 0.3,
        interactionQuality: 0.25,
        emotionalBalance: 0.25,
        reciprocity: 0.2,
    },
    RECALCULATION_INTERVAL_DAYS: 7,
};
exports.default = {
    isValidRelationshipType: exports.isValidRelationshipType,
    isValidInteractionType: exports.isValidInteractionType,
    isValidEmotionalTone: exports.isValidEmotionalTone,
    isValidEmotionType: exports.isValidEmotionType,
    isValidRelationalContext: exports.isValidRelationalContext,
    isValidDetectionMethod: exports.isValidDetectionMethod,
    DEFAULT_RELATIONSHIP_INTENSITY: exports.DEFAULT_RELATIONSHIP_INTENSITY,
    DEFAULT_INTERACTION_QUALITY: exports.DEFAULT_INTERACTION_QUALITY,
    DEFAULT_HEALTH_SCORE: exports.DEFAULT_HEALTH_SCORE,
    RELATIONSHIP_HEALTH_THRESHOLDS: exports.RELATIONSHIP_HEALTH_THRESHOLDS,
    CONTACT_FREQUENCY_TARGETS: exports.CONTACT_FREQUENCY_TARGETS,
    EMOTIONAL_INTENSITY_SCALE: exports.EMOTIONAL_INTENSITY_SCALE,
    AI_CONFIDENCE_THRESHOLDS: exports.AI_CONFIDENCE_THRESHOLDS,
    RELATIONSHIP_HEALTH_CALCULATION: exports.RELATIONSHIP_HEALTH_CALCULATION,
};
//# sourceMappingURL=relationship.js.map