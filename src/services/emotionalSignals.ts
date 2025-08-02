// WORLD-CLASS DATABASE ARCHITECTURE - Emotional Signals Service
// SOURCE: WORLD_CLASS_DATABASE_ARCHITECTURE.md - Emotional Signal Layer
// VERSION: 2.0 - Privacy-compliant emotional intelligence implementation
// ADDRESSES: Emotional Labor Imbalance from 03-problem-context.md

import firestore from '@react-native-firebase/firestore';
import { EmotionalSignal, EmotionalSignalCreate } from '../types/relationship';
import { UserPreferences } from '../types/user';

/**
 * Emotional Signals Service - Privacy-First Implementation
 * 
 * PRIVACY PRINCIPLES:
 * 1. Explicit consent required for all emotional data processing
 * 2. User control over data retention (30-day default)
 * 3. On-device processing for sensitive emotions when possible
 * 4. Transparent AI confidence scoring
 * 5. Immediate deletion capability
 */
export class EmotionalSignalsService {
  private db = firestore();

  /**
   * Create emotional signal with privacy validation
   * STORAGE: users/{userId}/relationships/{relationshipId}/emotionalSignals/{signalId}
   */
  async createEmotionalSignal(
    userId: string,
    relationshipId: string,
    signalData: EmotionalSignalCreate,
    userPreferences: UserPreferences
  ): Promise<string> {
    // Privacy validation - explicit consent required
    if (!userPreferences.emotionalDataConsent) {
      throw new Error('PRIVACY_ERROR: Emotional data consent required');
    }

    // Validate emotional signal data
    this.validateEmotionalSignalData(signalData);

    // Create document with privacy metadata
    const emotionalSignalRef = this.db
      .collection('users')
      .doc(userId)
      .collection('relationships')
      .doc(relationshipId)
      .collection('emotionalSignals')
      .doc();

    const emotionalSignal: EmotionalSignal = {
      id: emotionalSignalRef.id,
      relationshipId,
      userId,
      ...signalData,
      createdAt: new Date(),
      isPrivate: true, // Always private by default
    };

    await emotionalSignalRef.set(emotionalSignal);

    // Schedule automatic deletion based on user preferences
    await this.scheduleEmotionalDataCleanup(
      userId,
      relationshipId,
      emotionalSignalRef.id,
      userPreferences.emotionalDataRetentionDays
    );

    return emotionalSignalRef.id;
  }

  /**
   * Get emotional signals with privacy filtering
   */
  async getEmotionalSignals(
    userId: string,
    relationshipId: string,
    userPreferences: UserPreferences,
    options?: {
      startDate?: Date;
      endDate?: Date;
      emotionTypes?: string[];
      limit?: number;
    }
  ): Promise<EmotionalSignal[]> {
    // Privacy check
    if (!userPreferences.emotionalDataConsent) {
      return []; // Return empty array if no consent
    }

    let query = this.db
      .collection('users')
      .doc(userId)
      .collection('relationships')
      .doc(relationshipId)
      .collection('emotionalSignals')
      .orderBy('timestamp', 'desc');

    // Apply filters if provided
    if (options?.startDate) {
      query = query.where('timestamp', '>=', options.startDate);
    }
    if (options?.endDate) {
      query = query.where('timestamp', '<=', options.endDate);
    }
    if (options?.emotionTypes && options.emotionTypes.length > 0) {
      query = query.where('emotionType', 'in', options.emotionTypes);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as EmotionalSignal));
  }

  /**
   * Analyze emotional patterns with privacy controls
   * Returns aggregated insights without exposing individual signals
   */
  async analyzeEmotionalPatterns(
    userId: string,
    relationshipId: string,
    userPreferences: UserPreferences,
    timeframeMonths: number = 3
  ): Promise<{
    dominantEmotions: string[];
    emotionalBalance: number; // 1-10 scale
    supportPatterns: {
      givingFrequency: number;
      receivingFrequency: number;
      reciprocityScore: number;
    };
    stressIndicators: string[];
    confidenceScore: number;
  } | null> {
    // Privacy check
    if (!userPreferences.emotionalIntelligenceEnabled || !userPreferences.emotionalDataConsent) {
      return null;
    }

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - timeframeMonths);

    const signals = await this.getEmotionalSignals(userId, relationshipId, userPreferences, {
      startDate,
      limit: 100 // Limit analysis to prevent performance issues
    });

    if (signals.length < 5) {
      return null; // Insufficient data for meaningful analysis
    }

    // Aggregate analysis (privacy-preserving)
    const emotionCounts = this.countEmotionTypes(signals);
    const supportAnalysis = this.analyzeSupportPatterns(signals);
    const stressAnalysis = this.detectStressIndicators(signals);

    return {
      dominantEmotions: this.getDominantEmotions(emotionCounts),
      emotionalBalance: this.calculateEmotionalBalance(supportAnalysis),
      supportPatterns: supportAnalysis,
      stressIndicators: stressAnalysis,
      confidenceScore: this.calculateConfidenceScore(signals)
    };
  }

  /**
   * Delete emotional signal with audit trail
   */
  async deleteEmotionalSignal(
    userId: string,
    relationshipId: string,
    signalId: string,
    reason: 'user_request' | 'retention_expired' | 'privacy_update' = 'user_request'
  ): Promise<void> {
    const signalRef = this.db
      .collection('users')
      .doc(userId)
      .collection('relationships')
      .doc(relationshipId)
      .collection('emotionalSignals')
      .doc(signalId);

    // Create audit record before deletion (GDPR compliance)
    await this.createDeletionAuditRecord(userId, relationshipId, signalId, reason);

    // Delete the emotional signal
    await signalRef.delete();
  }

  /**
   * Bulk delete all emotional signals for user (GDPR right to be forgotten)
   */
  async deleteAllEmotionalSignals(
    userId: string,
    reason: string = 'user_privacy_request'
  ): Promise<number> {
    const batch = this.db.batch();
    let deletedCount = 0;

    // Get all relationships
    const relationshipsSnapshot = await this.db
      .collection('users')
      .doc(userId)
      .collection('relationships')
      .get();

    for (const relationshipDoc of relationshipsSnapshot.docs) {
      const emotionalSignalsSnapshot = await relationshipDoc.ref
        .collection('emotionalSignals')
        .get();

      for (const signalDoc of emotionalSignalsSnapshot.docs) {
        batch.delete(signalDoc.ref);
        deletedCount++;
      }
    }

    // Create bulk deletion audit record
    await this.createBulkDeletionAuditRecord(userId, deletedCount, reason);

    // Execute batch deletion
    await batch.commit();

    return deletedCount;
  }

  /**
   * Update emotional data retention settings
   */
  async updateEmotionalDataRetention(
    userId: string,
    newRetentionDays: number,
    userPreferences: UserPreferences
  ): Promise<void> {
    if (!userPreferences.emotionalDataConsent) {
      throw new Error('PRIVACY_ERROR: Emotional data consent required');
    }

    // Clean up data that exceeds new retention period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - newRetentionDays);

    await this.cleanupExpiredEmotionalData(userId, cutoffDate);
  }

  // PRIVATE HELPER METHODS

  private validateEmotionalSignalData(signalData: EmotionalSignalCreate): void {
    const validEmotionTypes = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'trust', 'anticipation'];
    const validDetectionMethods = ['user_reported', 'ai_extracted', 'behavioral_inferred'];
    const validRelationalContexts = ['support', 'conflict', 'celebration', 'concern', 'gratitude', 'nostalgia'];

    if (!validEmotionTypes.includes(signalData.emotionType)) {
      throw new Error('VALIDATION_ERROR: Invalid emotion type');
    }

    if (signalData.intensity < 1 || signalData.intensity > 10) {
      throw new Error('VALIDATION_ERROR: Intensity must be between 1 and 10');
    }

    if (!validDetectionMethods.includes(signalData.detectionMethod)) {
      throw new Error('VALIDATION_ERROR: Invalid detection method');
    }

    if (signalData.confidence < 0 || signalData.confidence > 1) {
      throw new Error('VALIDATION_ERROR: Confidence must be between 0 and 1');
    }

    if (signalData.relationalContext && !validRelationalContexts.includes(signalData.relationalContext)) {
      throw new Error('VALIDATION_ERROR: Invalid relational context');
    }
  }

  private async scheduleEmotionalDataCleanup(
    userId: string,
    relationshipId: string,
    signalId: string,
    retentionDays: number
  ): Promise<void> {
    // Create temporal trigger for automatic cleanup
    const cleanupDate = new Date();
    cleanupDate.setDate(cleanupDate.getDate() + retentionDays);

    const triggerRef = this.db
      .collection('users')
      .doc(userId)
      .collection('temporalTriggers')
      .doc();

    await triggerRef.set({
      id: triggerRef.id,
      userId,
      triggerType: 'emotional_data_cleanup',
      targetDate: cleanupDate,
      isActive: true,
      triggerConditions: {
        signalId,
        relationshipId,
        retentionExpired: true
      },
      createdAt: new Date(),
      lastUpdated: new Date()
    });
  }

  private countEmotionTypes(signals: EmotionalSignal[]): Record<string, number> {
    return signals.reduce((counts, signal) => {
      counts[signal.emotionType] = (counts[signal.emotionType] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  private analyzeSupportPatterns(signals: EmotionalSignal[]): {
    givingFrequency: number;
    receivingFrequency: number;
    reciprocityScore: number;
  } {
    const supportGiving = signals.filter(s => 
      s.relationalContext === 'support' && s.detectionMethod === 'user_reported'
    ).length;
    
    const supportReceiving = signals.filter(s => 
      s.relationalContext === 'support' && s.detectionMethod === 'ai_extracted'
    ).length;

    const total = signals.length;
    const givingFrequency = total > 0 ? (supportGiving / total) * 10 : 0;
    const receivingFrequency = total > 0 ? (supportReceiving / total) * 10 : 0;
    
    // Calculate reciprocity (1-10 scale, 10 being perfectly balanced)
    const reciprocityScore = givingFrequency > 0 && receivingFrequency > 0 
      ? 10 - Math.abs(givingFrequency - receivingFrequency)
      : 0;

    return {
      givingFrequency: Math.round(givingFrequency * 10) / 10,
      receivingFrequency: Math.round(receivingFrequency * 10) / 10,
      reciprocityScore: Math.round(reciprocityScore * 10) / 10
    };
  }

  private detectStressIndicators(signals: EmotionalSignal[]): string[] {
    const indicators: string[] = [];
    const recent = signals.slice(0, 10); // Last 10 signals

    // Check for negative emotion clustering
    const negativeEmotions = recent.filter(s => 
      ['sadness', 'anger', 'fear'].includes(s.emotionType)
    );
    
    if (negativeEmotions.length > recent.length * 0.6) {
      indicators.push('negative_emotion_increase');
    }

    // Check for conflict patterns
    const conflicts = recent.filter(s => s.relationalContext === 'conflict');
    if (conflicts.length > 2) {
      indicators.push('conflict_pattern_detected');
    }

    // Check for support imbalance
    const supportGiving = recent.filter(s => s.relationalContext === 'support').length;
    const concernSignals = recent.filter(s => s.relationalContext === 'concern').length;
    
    if (supportGiving === 0 && concernSignals > 2) {
      indicators.push('support_imbalance_critical');
    }

    return indicators;
  }

  private getDominantEmotions(emotionCounts: Record<string, number>): string[] {
    const sorted = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    return sorted.map(([emotion]) => emotion);
  }

  private calculateEmotionalBalance(supportAnalysis: {
    givingFrequency: number;
    receivingFrequency: number;
    reciprocityScore: number;
  }): number {
    // Weight reciprocity more heavily than individual frequencies
    const balanceScore = (supportAnalysis.reciprocityScore * 0.6) + 
                        (Math.min(supportAnalysis.givingFrequency, 5) * 0.2) + 
                        (Math.min(supportAnalysis.receivingFrequency, 5) * 0.2);
    
    return Math.round(balanceScore * 10) / 10;
  }

  private calculateConfidenceScore(signals: EmotionalSignal[]): number {
    if (signals.length === 0) return 0;
    
    const avgConfidence = signals.reduce((sum, signal) => sum + signal.confidence, 0) / signals.length;
    const sampleSizeBonus = Math.min(signals.length / 20, 1); // Bonus for larger sample size
    
    return Math.round((avgConfidence * 0.8 + sampleSizeBonus * 0.2) * 100) / 100;
  }

  private async createDeletionAuditRecord(
    userId: string,
    relationshipId: string,
    signalId: string,
    reason: string
  ): Promise<void> {
    const auditRef = this.db
      .collection('users')
      .doc(userId)
      .collection('privacy_audit')
      .doc();

    await auditRef.set({
      timestamp: new Date(),
      action: 'emotional_signal_deletion',
      permission_used: 'emotional_data_management',
      details: {
        relationshipId,
        signalId,
        reason,
        deletedBy: 'user'
      }
    });
  }

  private async createBulkDeletionAuditRecord(
    userId: string,
    deletedCount: number,
    reason: string
  ): Promise<void> {
    const auditRef = this.db
      .collection('users')
      .doc(userId)
      .collection('privacy_audit')
      .doc();

    await auditRef.set({
      timestamp: new Date(),
      action: 'bulk_emotional_data_deletion',
      permission_used: 'emotional_data_management',
      details: {
        deletedCount,
        reason,
        deletedBy: 'user'
      }
    });
  }

  private async cleanupExpiredEmotionalData(userId: string, cutoffDate: Date): Promise<void> {
    const batch = this.db.batch();

    // Get all relationships
    const relationshipsSnapshot = await this.db
      .collection('users')
      .doc(userId)
      .collection('relationships')
      .get();

    for (const relationshipDoc of relationshipsSnapshot.docs) {
      const expiredSignalsSnapshot = await relationshipDoc.ref
        .collection('emotionalSignals')
        .where('timestamp', '<', cutoffDate)
        .get();

      for (const signalDoc of expiredSignalsSnapshot.docs) {
        batch.delete(signalDoc.ref);
      }
    }

    await batch.commit();
  }
}

export const emotionalSignalsService = new EmotionalSignalsService();