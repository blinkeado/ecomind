// WORLD-CLASS DATABASE ARCHITECTURE - Emotional Signals Hook
// SOURCE: WORLD_CLASS_DATABASE_ARCHITECTURE.md - Emotional Intelligence Layer
// VERSION: 2.0 - Privacy-compliant emotional intelligence React hook
// ADDRESSES: Emotional Labor Imbalance and relationship depth tracking

import { useState, useEffect, useCallback } from 'react';
import { EmotionalSignal, EmotionalSignalCreate } from '../types/relationship';
import { UserPreferences } from '../types/user';
import { emotionalSignalsService } from '../services/emotionalSignals';
import { useAuth } from './useAuth';

interface EmotionalSignalsState {
  signals: EmotionalSignal[];
  loading: boolean;
  error: string | null;
  patterns: {
    dominantEmotions: string[];
    emotionalBalance: number;
    supportPatterns: {
      givingFrequency: number;
      receivingFrequency: number;
      reciprocityScore: number;
    };
    stressIndicators: string[];
    confidenceScore: number;
  } | null;
}

interface EmotionalSignalsActions {
  createSignal: (relationshipId: string, signalData: EmotionalSignalCreate) => Promise<string | null>;
  getSignals: (relationshipId: string, options?: {
    startDate?: Date;
    endDate?: Date;
    emotionTypes?: string[];
    limit?: number;
  }) => Promise<void>;
  analyzePatterns: (relationshipId: string, timeframeMonths?: number) => Promise<void>;
  deleteSignal: (relationshipId: string, signalId: string) => Promise<void>;
  deleteAllSignals: () => Promise<number>;
  updateRetentionSettings: (newRetentionDays: number) => Promise<void>;
}

/**
 * Privacy-First Emotional Signals Hook
 * 
 * PRIVACY FEATURES:
 * - Automatic consent checking
 * - Client-side data validation
 * - Transparent error handling
 * - Audit trail support
 * - Retention management
 */
export function useEmotionalSignals(userPreferences: UserPreferences): EmotionalSignalsState & EmotionalSignalsActions {
  const { user } = useAuth();
  const [state, setState] = useState<EmotionalSignalsState>({
    signals: [],
    loading: false,
    error: null,
    patterns: null,
  });

  // Check privacy permissions
  const hasEmotionalDataPermission = useCallback(() => {
    return userPreferences.emotionalDataConsent && userPreferences.emotionalIntelligenceEnabled;
  }, [userPreferences.emotionalDataConsent, userPreferences.emotionalIntelligenceEnabled]);

  // Create emotional signal with privacy validation
  const createSignal = useCallback(async (
    relationshipId: string, 
    signalData: EmotionalSignalCreate
  ): Promise<string | null> => {
    if (!user?.uid) {
      setState(prev => ({ ...prev, error: 'Authentication required' }));
      return null;
    }

    if (!hasEmotionalDataPermission()) {
      setState(prev => ({ 
        ...prev, 
        error: 'Emotional data processing requires user consent. Please enable in privacy settings.' 
      }));
      return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const signalId = await emotionalSignalsService.createEmotionalSignal(
        user.uid,
        relationshipId,
        signalData,
        userPreferences
      );

      setState(prev => ({ 
        ...prev, 
        loading: false,
        error: null 
      }));

      return signalId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create emotional signal';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return null;
    }
  }, [user?.uid, userPreferences, hasEmotionalDataPermission]);

  // Get emotional signals with privacy filtering
  const getSignals = useCallback(async (
    relationshipId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      emotionTypes?: string[];
      limit?: number;
    }
  ): Promise<void> => {
    if (!user?.uid) {
      setState(prev => ({ ...prev, error: 'Authentication required' }));
      return;
    }

    if (!hasEmotionalDataPermission()) {
      setState(prev => ({ 
        ...prev, 
        signals: [],
        error: null // Don't show error for privacy choice
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const signals = await emotionalSignalsService.getEmotionalSignals(
        user.uid,
        relationshipId,
        userPreferences,
        options
      );

      setState(prev => ({ 
        ...prev, 
        signals,
        loading: false,
        error: null 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load emotional signals';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
    }
  }, [user?.uid, userPreferences, hasEmotionalDataPermission]);

  // Analyze emotional patterns with privacy controls
  const analyzePatterns = useCallback(async (
    relationshipId: string,
    timeframeMonths: number = 3
  ): Promise<void> => {
    if (!user?.uid) {
      setState(prev => ({ ...prev, error: 'Authentication required' }));
      return;
    }

    if (!hasEmotionalDataPermission()) {
      setState(prev => ({ 
        ...prev, 
        patterns: null,
        error: null // Don't show error for privacy choice
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const patterns = await emotionalSignalsService.analyzeEmotionalPatterns(
        user.uid,
        relationshipId,
        userPreferences,
        timeframeMonths
      );

      setState(prev => ({ 
        ...prev, 
        patterns,
        loading: false,
        error: null 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze emotional patterns';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
    }
  }, [user?.uid, userPreferences, hasEmotionalDataPermission]);

  // Delete specific emotional signal
  const deleteSignal = useCallback(async (
    relationshipId: string,
    signalId: string
  ): Promise<void> => {
    if (!user?.uid) {
      setState(prev => ({ ...prev, error: 'Authentication required' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await emotionalSignalsService.deleteEmotionalSignal(
        user.uid,
        relationshipId,
        signalId,
        'user_request'
      );

      // Remove from local state
      setState(prev => ({ 
        ...prev, 
        signals: prev.signals.filter(signal => signal.id !== signalId),
        loading: false,
        error: null 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete emotional signal';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
    }
  }, [user?.uid]);

  // Delete all emotional signals (GDPR right to be forgotten)
  const deleteAllSignals = useCallback(async (): Promise<number> => {
    if (!user?.uid) {
      setState(prev => ({ ...prev, error: 'Authentication required' }));
      return 0;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const deletedCount = await emotionalSignalsService.deleteAllEmotionalSignals(
        user.uid,
        'user_privacy_request'
      );

      setState(prev => ({ 
        ...prev, 
        signals: [],
        patterns: null,
        loading: false,
        error: null 
      }));

      return deletedCount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete emotional signals';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return 0;
    }
  }, [user?.uid]);

  // Update emotional data retention settings
  const updateRetentionSettings = useCallback(async (newRetentionDays: number): Promise<void> => {
    if (!user?.uid) {
      setState(prev => ({ ...prev, error: 'Authentication required' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await emotionalSignalsService.updateEmotionalDataRetention(
        user.uid,
        newRetentionDays,
        userPreferences
      );

      setState(prev => ({ 
        ...prev, 
        loading: false,
        error: null 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update retention settings';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
    }
  }, [user?.uid, userPreferences]);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Effect to monitor privacy settings changes
  useEffect(() => {
    if (!hasEmotionalDataPermission()) {
      setState(prev => ({ 
        ...prev, 
        signals: [],
        patterns: null,
        error: null
      }));
    }
  }, [hasEmotionalDataPermission]);

  return {
    ...state,
    createSignal,
    getSignals,
    analyzePatterns,
    deleteSignal,
    deleteAllSignals,
    updateRetentionSettings,
    clearError,
  };
}

/**
 * Helper hook for emotional signal creation with common patterns
 */
export function useEmotionalSignalCreation(
  userPreferences: UserPreferences
): {
  createUserReportedSignal: (relationshipId: string, emotionType: string, intensity: number, context?: string) => Promise<string | null>;
  createAIExtractedSignal: (relationshipId: string, emotionType: string, intensity: number, confidence: number, context?: string) => Promise<string | null>;
  createBehavioralSignal: (relationshipId: string, emotionType: string, intensity: number, triggerEvent: string) => Promise<string | null>;
} {
  const { createSignal } = useEmotionalSignals(userPreferences);

  const createUserReportedSignal = useCallback(async (
    relationshipId: string,
    emotionType: string,
    intensity: number,
    context?: string
  ): Promise<string | null> => {
    return createSignal(relationshipId, {
      relationshipId,
      userId: '', // Will be set by service
      emotionType: emotionType as any,
      intensity,
      relationalContext: 'support', // Default context
      timestamp: new Date(),
      detectionMethod: 'user_reported',
      confidence: 1.0, // User reported = 100% confidence
      context,
    });
  }, [createSignal]);

  const createAIExtractedSignal = useCallback(async (
    relationshipId: string,
    emotionType: string,
    intensity: number,
    confidence: number,
    context?: string
  ): Promise<string | null> => {
    return createSignal(relationshipId, {
      relationshipId,
      userId: '', // Will be set by service
      emotionType: emotionType as any,
      intensity,
      relationalContext: 'support', // Default context
      timestamp: new Date(),
      detectionMethod: 'ai_extracted',
      confidence,
      context,
    });
  }, [createSignal]);

  const createBehavioralSignal = useCallback(async (
    relationshipId: string,
    emotionType: string,
    intensity: number,
    triggerEvent: string
  ): Promise<string | null> => {
    return createSignal(relationshipId, {
      relationshipId,
      userId: '', // Will be set by service
      emotionType: emotionType as any,
      intensity,
      relationalContext: 'support', // Default context
      timestamp: new Date(),
      detectionMethod: 'behavioral_inferred',
      confidence: 0.7, // Moderate confidence for behavioral signals
      triggerEvent,
    });
  }, [createSignal]);

  return {
    createUserReportedSignal,
    createAIExtractedSignal,
    createBehavioralSignal,
  };
}