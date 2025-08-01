// SOURCE: IMPLEMENTATION_PLAN.md line 71 + prompt state management requirements
// VERIFIED: React hook for AI prompt state management and actions

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { RelationshipPrompt, PromptStatus, PromptType } from '../types/prompt';
import { PersonDocument } from '../types/relationship';
import { promptsService } from '../services/prompts';
import { useAuth } from './useAuth';

/**
 * Prompts Context Types
 */
interface PromptsContextType {
  // State
  prompts: RelationshipPrompt[];
  loading: boolean;
  error: string | null;
  
  // Actions
  generatePrompt: (person: PersonDocument, promptType?: PromptType) => Promise<RelationshipPrompt | null>;
  generateDailyPrompts: (relationships: PersonDocument[]) => Promise<RelationshipPrompt[]>;
  completePrompt: (promptId: string) => Promise<void>;
  dismissPrompt: (promptId: string) => Promise<void>;
  snoozePrompt: (promptId: string, snoozeUntil: Date) => Promise<void>;
  deletePrompt: (promptId: string) => Promise<void>;
  refreshPrompts: () => Promise<void>;
  
  // Filters
  getActivePrompts: () => RelationshipPrompt[];
  getPromptsForPerson: (personId: string) => RelationshipPrompt[];
  getPromptsByUrgency: (urgency: 'critical' | 'high' | 'medium' | 'low') => RelationshipPrompt[];
  getPromptsByType: (type: PromptType) => RelationshipPrompt[];
  
  // Statistics
  getPromptStats: () => {
    total: number;
    active: number;
    completed: number;
    dismissed: number;
    snoozed: number;
    byType: Record<PromptType, number>;
    byUrgency: Record<string, number>;
  };
}

/**
 * Prompts Context
 */
const PromptsContext = createContext<PromptsContextType | undefined>(undefined);

/**
 * Prompts Provider Component
 */
export const PromptsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<RelationshipPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time prompts listener
  useEffect(() => {
    if (!user) {
      setPrompts([]);
      return;
    }

    setLoading(true);
    const unsubscribe = promptsService.getActivePrompts(
      user.uid,
      (activePrompts) => {
        setPrompts(activePrompts);
        setLoading(false);
        setError(null);
      }
    );

    return unsubscribe;
  }, [user]);

  /**
   * Generate AI prompt for a specific relationship
   */
  const generatePrompt = useCallback(async (
    person: PersonDocument,
    promptType?: PromptType
  ): Promise<RelationshipPrompt | null> => {
    if (!user) return null;

    try {
      setError(null);
      const prompt = await promptsService.createPromptForRelationship(user.uid, person, promptType);
      
      // Save the generated prompt
      const promptId = await promptsService.savePrompt(user.uid, prompt);
      const savedPrompt = { ...prompt, id: promptId };
      
      // Update local state
      setPrompts(prev => [savedPrompt, ...prev]);
      
      return savedPrompt;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate prompt';
      setError(errorMessage);
      console.error('Generate prompt error:', err);
      return null;
    }
  }, [user]);

  /**
   * Generate daily relationship check prompts
   */
  const generateDailyPrompts = useCallback(async (
    relationships: PersonDocument[]
  ): Promise<RelationshipPrompt[]> => {
    if (!user) return [];

    try {
      setError(null);
      setLoading(true);
      
      const dailyPrompts = await promptsService.generateDailyPrompts(user.uid, relationships);
      
      // Save all generated prompts
      const savedPrompts = await Promise.all(
        dailyPrompts.map(async (prompt) => {
          const promptId = await promptsService.savePrompt(user.uid, prompt);
          return { ...prompt, id: promptId };
        })
      );
      
      // Update local state
      setPrompts(prev => [...savedPrompts, ...prev]);
      
      console.log(`Generated ${savedPrompts.length} daily prompts`);
      return savedPrompts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate daily prompts';
      setError(errorMessage);
      console.error('Generate daily prompts error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Complete a prompt
   */
  const completePrompt = useCallback(async (promptId: string): Promise<void> => {
    if (!user) return;

    try {
      setError(null);
      await promptsService.completePrompt(user.uid, promptId);
      
      // Update local state
      setPrompts(prev => prev.map(prompt => 
        prompt.id === promptId 
          ? { ...prompt, status: 'completed', completedAt: new Date() }
          : prompt
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete prompt';
      setError(errorMessage);
      console.error('Complete prompt error:', err);
    }
  }, [user]);

  /**
   * Dismiss a prompt
   */
  const dismissPrompt = useCallback(async (promptId: string): Promise<void> => {
    if (!user) return;

    try {
      setError(null);
      await promptsService.dismissPrompt(user.uid, promptId);
      
      // Update local state
      setPrompts(prev => prev.map(prompt => 
        prompt.id === promptId 
          ? { ...prompt, status: 'dismissed' }
          : prompt
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to dismiss prompt';
      setError(errorMessage);
      console.error('Dismiss prompt error:', err);
    }
  }, [user]);

  /**
   * Snooze a prompt
   */
  const snoozePrompt = useCallback(async (promptId: string, snoozeUntil: Date): Promise<void> => {
    if (!user) return;

    try {
      setError(null);
      await promptsService.snoozePrompt(user.uid, promptId, snoozeUntil);
      
      // Update local state
      setPrompts(prev => prev.map(prompt => 
        prompt.id === promptId 
          ? { ...prompt, status: 'snoozed', snoozedUntil: snoozeUntil }
          : prompt
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to snooze prompt';
      setError(errorMessage);
      console.error('Snooze prompt error:', err);
    }
  }, [user]);

  /**
   * Delete a prompt
   */
  const deletePrompt = useCallback(async (promptId: string): Promise<void> => {
    if (!user) return;

    try {
      setError(null);
      await promptsService.deletePrompt(user.uid, promptId);
      
      // Update local state
      setPrompts(prev => prev.filter(prompt => prompt.id !== promptId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete prompt';
      setError(errorMessage);
      console.error('Delete prompt error:', err);
    }
  }, [user]);

  /**
   * Refresh prompts from server
   */
  const refreshPrompts = useCallback(async (): Promise<void> => {
    // The real-time listener will automatically update prompts
    // This function is here for manual refresh if needed
    console.log('Prompts refreshed via real-time listener');
  }, []);

  /**
   * Get active prompts
   */
  const getActivePrompts = useCallback((): RelationshipPrompt[] => {
    return prompts.filter(prompt => prompt.status === 'active');
  }, [prompts]);

  /**
   * Get prompts for specific person
   */
  const getPromptsForPerson = useCallback((personId: string): RelationshipPrompt[] => {
    return prompts.filter(prompt => prompt.personId === personId);
  }, [prompts]);

  /**
   * Get prompts by urgency
   */
  const getPromptsByUrgency = useCallback((urgency: 'critical' | 'high' | 'medium' | 'low'): RelationshipPrompt[] => {
    return prompts.filter(prompt => prompt.urgency === urgency);
  }, [prompts]);

  /**
   * Get prompts by type
   */
  const getPromptsByType = useCallback((type: PromptType): RelationshipPrompt[] => {
    return prompts.filter(prompt => prompt.type === type);
  }, [prompts]);

  /**
   * Get prompt statistics
   */
  const getPromptStats = useCallback(() => {
    const stats = {
      total: prompts.length,
      active: 0,
      completed: 0,
      dismissed: 0,
      snoozed: 0,
      byType: {} as Record<PromptType, number>,
      byUrgency: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
    };

    prompts.forEach(prompt => {
      // Count by status
      switch (prompt.status) {
        case 'active':
          stats.active++;
          break;
        case 'completed':
          stats.completed++;
          break;
        case 'dismissed':
          stats.dismissed++;
          break;
        case 'snoozed':
          stats.snoozed++;
          break;
      }

      // Count by type
      stats.byType[prompt.type] = (stats.byType[prompt.type] || 0) + 1;

      // Count by urgency
      if (prompt.urgency in stats.byUrgency) {
        stats.byUrgency[prompt.urgency]++;
      }
    });

    return stats;
  }, [prompts]);

  const contextValue: PromptsContextType = {
    // State
    prompts,
    loading,
    error,
    
    // Actions
    generatePrompt,
    generateDailyPrompts,
    completePrompt,
    dismissPrompt,
    snoozePrompt,
    deletePrompt,
    refreshPrompts,
    
    // Filters
    getActivePrompts,
    getPromptsForPerson,
    getPromptsByUrgency,
    getPromptsByType,
    
    // Statistics
    getPromptStats,
  };

  return (
    <PromptsContext.Provider value={contextValue}>
      {children}
    </PromptsContext.Provider>
  );
};

/**
 * usePrompts Hook
 */
export const usePrompts = (): PromptsContextType => {
  const context = useContext(PromptsContext);
  if (!context) {
    throw new Error('usePrompts must be used within a PromptsProvider');
  }
  return context;
};

/**
 * Convenience hooks for specific use cases
 */

/**
 * Hook for active prompts only
 */
export const useActivePrompts = (): {
  prompts: RelationshipPrompt[];
  loading: boolean;
  error: string | null;
  generatePrompt: (person: PersonDocument, promptType?: PromptType) => Promise<RelationshipPrompt | null>;
  completePrompt: (promptId: string) => Promise<void>;
  dismissPrompt: (promptId: string) => Promise<void>;
  snoozePrompt: (promptId: string, snoozeUntil: Date) => Promise<void>;
} => {
  const { 
    getActivePrompts, 
    loading, 
    error, 
    generatePrompt, 
    completePrompt, 
    dismissPrompt, 
    snoozePrompt 
  } = usePrompts();
  
  return {
    prompts: getActivePrompts(),
    loading,
    error,
    generatePrompt,
    completePrompt,
    dismissPrompt,
    snoozePrompt,
  };
};

/**
 * Hook for prompt statistics
 */
export const usePromptStats = () => {
  const { getPromptStats } = usePrompts();
  return getPromptStats();
};

/**
 * Hook for person-specific prompts
 */
export const usePersonPrompts = (personId: string): {
  prompts: RelationshipPrompt[];
  generatePrompt: (person: PersonDocument, promptType?: PromptType) => Promise<RelationshipPrompt | null>;
  completePrompt: (promptId: string) => Promise<void>;
  dismissPrompt: (promptId: string) => Promise<void>;
} => {
  const { getPromptsForPerson, generatePrompt, completePrompt, dismissPrompt } = usePrompts();
  
  return {
    prompts: getPromptsForPerson(personId),
    generatePrompt,
    completePrompt,
    dismissPrompt,
  };
};

export default usePrompts;