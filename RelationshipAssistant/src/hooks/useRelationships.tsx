// SOURCE: React Hooks Official Documentation + Firebase Firestore Real-time Updates
// URL: https://rnfirebase.io/firestore/usage#realtime-updates
// VERIFIED: React hooks patterns with Firestore real-time listeners

import { useState, useEffect, useCallback, useRef } from 'react';
import { Unsubscribe } from '@react-native-firebase/firestore';
import { useAuth } from './useAuth';
import relationshipsService from '../services/relationships';
import { 
  PersonDocument, 
  PersonDocumentUpdate,
  InteractionRecord,
  InteractionRecordCreate,
  LifeEvent,
  LifeEventCreate,
  RelationshipType
} from '../types/relationship';

/**
 * Relationships Hook State Interface
 */
interface RelationshipsState {
  relationships: PersonDocument[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Individual Relationship Hook State
 */
interface RelationshipState {
  person: PersonDocument | null;
  interactions: InteractionRecord[];
  lifeEvents: LifeEvent[];
  loading: boolean;
  interactionsLoading: boolean;
  lifeEventsLoading: boolean;
  error: string | null;
}

/**
 * Relationships Hook Options
 */
interface UseRelationshipsOptions {
  realtime?: boolean; // Enable real-time updates
  relationshipType?: RelationshipType; // Filter by relationship type
  limit?: number; // Limit number of relationships
  orderBy?: 'displayName' | 'lastContact' | 'relationshipHealth' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Main Relationships Hook
 * Manages all relationships for the current user
 * SOURCE: React Hooks Official Documentation - Custom Hooks
 */
export const useRelationships = (options: UseRelationshipsOptions = {}) => {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<RelationshipsState>({
    relationships: [],
    loading: false,
    error: null,
    lastUpdated: null,
  });
  
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const { realtime = true, ...queryOptions } = options;

  /**
   * Load relationships from Firestore
   */
  const loadRelationships = useCallback(async () => {
    if (!user?.uid) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const relationships = await relationshipsService.getAllRelationships(
        user.uid,
        queryOptions
      );
      
      setState(prev => ({
        ...prev,
        relationships,
        loading: false,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('🔥 useRelationships Error (Load):', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load relationships',
      }));
    }
  }, [user?.uid, queryOptions]);

  /**
   * Setup real-time listener
   */
  const setupRealtimeListener = useCallback(() => {
    if (!user?.uid || !realtime) return;

    try {
      const unsubscribe = relationshipsService.subscribeToRelationships(
        user.uid,
        (relationships) => {
          setState(prev => ({
            ...prev,
            relationships,
            loading: false,
            lastUpdated: new Date(),
            error: null,
          }));
        },
        (error) => {
          console.error('🔥 useRelationships Error (Real-time):', error);
          setState(prev => ({
            ...prev,
            error: error.message,
            loading: false,
          }));
        }
      );

      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error('🔥 useRelationships Error (Setup Listener):', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to setup real-time updates',
        loading: false,
      }));
    }
  }, [user?.uid, realtime]);

  /**
   * Create a new relationship
   */
  const createRelationship = useCallback(async (
    personData: Omit<PersonDocument, 'id' | 'createdAt' | 'lastUpdated' | 'createdBy'>
  ): Promise<string | null> => {
    if (!user?.uid) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }));
      return null;
    }

    try {
      const personId = await relationshipsService.createPerson(user.uid, personData);
      
      // If not using real-time, reload data
      if (!realtime) {
        await loadRelationships();
      }
      
      return personId;
    } catch (error) {
      console.error('🔥 useRelationships Error (Create):', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create relationship',
      }));
      return null;
    }
  }, [user?.uid, realtime, loadRelationships]);

  /**
   * Update a relationship
   */
  const updateRelationship = useCallback(async (
    personId: string,
    updates: PersonDocumentUpdate
  ): Promise<boolean> => {
    if (!user?.uid) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }));
      return false;
    }

    try {
      await relationshipsService.updatePerson(user.uid, personId, updates);
      
      // If not using real-time, reload data
      if (!realtime) {
        await loadRelationships();
      }
      
      return true;
    } catch (error) {
      console.error('🔥 useRelationships Error (Update):', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update relationship',
      }));
      return false;
    }
  }, [user?.uid, realtime, loadRelationships]);

  /**
   * Delete a relationship
   */
  const deleteRelationship = useCallback(async (personId: string): Promise<boolean> => {
    if (!user?.uid) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }));
      return false;
    }

    try {
      await relationshipsService.deletePerson(user.uid, personId);
      
      // If not using real-time, reload data
      if (!realtime) {
        await loadRelationships();
      }
      
      return true;
    } catch (error) {
      console.error('🔥 useRelationships Error (Delete):', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete relationship',
      }));
      return false;
    }
  }, [user?.uid, realtime, loadRelationships]);

  /**
   * Search relationships
   */
  const searchRelationships = useCallback(async (
    searchTerm: string
  ): Promise<PersonDocument[]> => {
    if (!user?.uid) return [];

    try {
      return await relationshipsService.searchRelationships(user.uid, searchTerm);
    } catch (error) {
      console.error('🔥 useRelationships Error (Search):', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to search relationships',
      }));
      return [];
    }
  }, [user?.uid]);

  /**
   * Refresh data manually
   */
  const refresh = useCallback(async () => {
    await loadRelationships();
  }, [loadRelationships]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Setup effect for initial load and real-time listener
   */
  useEffect(() => {
    if (!isAuthenticated || !user?.uid) {
      setState({
        relationships: [],
        loading: false,
        error: null,
        lastUpdated: null,
      });
      return;
    }

    if (realtime) {
      setState(prev => ({ ...prev, loading: true }));
      setupRealtimeListener();
    } else {
      loadRelationships();
    }

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [isAuthenticated, user?.uid, realtime, setupRealtimeListener, loadRelationships]);

  return {
    ...state,
    createRelationship,
    updateRelationship,
    deleteRelationship,
    searchRelationships,
    refresh,
    clearError,
  };
};

/**
 * Individual Relationship Hook
 * Manages a specific relationship and its interactions/life events
 */
export const useRelationship = (personId: string | null, options: { realtime?: boolean } = {}) => {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<RelationshipState>({
    person: null,
    interactions: [],
    lifeEvents: [],
    loading: false,
    interactionsLoading: false,
    lifeEventsLoading: false,
    error: null,
  });

  const interactionUnsubscribeRef = useRef<Unsubscribe | null>(null);
  const { realtime = true } = options;

  /**
   * Load person data
   */
  const loadPerson = useCallback(async () => {
    if (!user?.uid || !personId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const person = await relationshipsService.getPerson(user.uid, personId);
      setState(prev => ({
        ...prev,
        person,
        loading: false,
      }));
    } catch (error) {
      console.error('🔥 useRelationship Error (Load Person):', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load person',
      }));
    }
  }, [user?.uid, personId]);

  /**
   * Load interactions
   */
  const loadInteractions = useCallback(async () => {
    if (!user?.uid || !personId) return;

    setState(prev => ({ ...prev, interactionsLoading: true }));

    try {
      const interactions = await relationshipsService.getInteractions(user.uid, personId, {
        limit: 50,
        orderBy: 'timestamp',
        orderDirection: 'desc',
      });
      
      setState(prev => ({
        ...prev,
        interactions,
        interactionsLoading: false,
      }));
    } catch (error) {
      console.error('🔥 useRelationship Error (Load Interactions):', error);
      setState(prev => ({
        ...prev,
        interactionsLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load interactions',
      }));
    }
  }, [user?.uid, personId]);

  /**
   * Load life events
   */
  const loadLifeEvents = useCallback(async () => {
    if (!user?.uid || !personId) return;

    setState(prev => ({ ...prev, lifeEventsLoading: true }));

    try {
      const lifeEvents = await relationshipsService.getLifeEvents(user.uid, personId);
      setState(prev => ({
        ...prev,
        lifeEvents,
        lifeEventsLoading: false,
      }));
    } catch (error) {
      console.error('🔥 useRelationship Error (Load Life Events):', error);
      setState(prev => ({
        ...prev,
        lifeEventsLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load life events',
      }));
    }
  }, [user?.uid, personId]);

  /**
   * Setup real-time listener for interactions
   */
  const setupInteractionsListener = useCallback(() => {
    if (!user?.uid || !personId || !realtime) return;

    try {
      const unsubscribe = relationshipsService.subscribeToInteractions(
        user.uid,
        personId,
        (interactions) => {
          setState(prev => ({
            ...prev,
            interactions,
            interactionsLoading: false,
          }));
        },
        (error) => {
          console.error('🔥 useRelationship Error (Interactions Real-time):', error);
          setState(prev => ({
            ...prev,
            error: error.message,
            interactionsLoading: false,
          }));
        }
      );

      interactionUnsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error('🔥 useRelationship Error (Setup Interactions Listener):', error);
    }
  }, [user?.uid, personId, realtime]);

  /**
   * Create interaction
   */
  const createInteraction = useCallback(async (
    interactionData: InteractionRecordCreate
  ): Promise<string | null> => {
    if (!user?.uid || !personId) return null;

    try {
      const interactionId = await relationshipsService.createInteraction(
        user.uid,
        personId,
        interactionData
      );

      // If not using real-time, reload interactions
      if (!realtime) {
        await loadInteractions();
      }

      return interactionId;
    } catch (error) {
      console.error('🔥 useRelationship Error (Create Interaction):', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create interaction',
      }));
      return null;
    }
  }, [user?.uid, personId, realtime, loadInteractions]);

  /**
   * Create life event
   */
  const createLifeEvent = useCallback(async (
    eventData: LifeEventCreate
  ): Promise<string | null> => {
    if (!user?.uid || !personId) return null;

    try {
      const eventId = await relationshipsService.createLifeEvent(
        user.uid,
        personId,
        eventData
      );

      // If not using real-time, reload life events
      if (!realtime) {
        await loadLifeEvents();
      }

      return eventId;
    } catch (error) {
      console.error('🔥 useRelationship Error (Create Life Event):', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create life event',
      }));
      return null;
    }
  }, [user?.uid, personId, realtime, loadLifeEvents]);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    await Promise.all([
      loadPerson(),
      loadInteractions(),
      loadLifeEvents(),
    ]);
  }, [loadPerson, loadInteractions, loadLifeEvents]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Setup effect for initial load and real-time listeners
   */
  useEffect(() => {
    if (!isAuthenticated || !user?.uid || !personId) {
      setState({
        person: null,
        interactions: [],
        lifeEvents: [],
        loading: false,
        interactionsLoading: false,
        lifeEventsLoading: false,
        error: null,
      });
      return;
    }

    // Load initial data
    loadPerson();
    loadLifeEvents(); // Life events don't have real-time updates yet

    if (realtime) {
      setupInteractionsListener();
    } else {
      loadInteractions();
    }

    // Cleanup function
    return () => {
      if (interactionUnsubscribeRef.current) {
        interactionUnsubscribeRef.current();
        interactionUnsubscribeRef.current = null;
      }
    };
  }, [isAuthenticated, user?.uid, personId, realtime, loadPerson, loadInteractions, loadLifeEvents, setupInteractionsListener]);

  return {
    ...state,
    createInteraction,
    createLifeEvent,
    refresh,
    clearError,
  };
};

/**
 * Relationship Statistics Hook
 * Provides computed statistics about relationships
 */
export const useRelationshipStats = () => {
  const { relationships, loading } = useRelationships();

  const stats = {
    totalRelationships: relationships.length,
    relationshipsByType: relationships.reduce((acc, rel) => {
      acc[rel.relationshipType] = (acc[rel.relationshipType] || 0) + 1;
      return acc;
    }, {} as Record<RelationshipType, number>),
    averageRelationshipHealth: relationships.length > 0 
      ? relationships.reduce((sum, rel) => sum + rel.relationshipHealth, 0) / relationships.length
      : 0,
    relationshipsNeedingAttention: relationships.filter(rel => rel.relationshipHealth < 5).length,
    recentlyContacted: relationships.filter(rel => {
      if (!rel.lastContact) return false;
      const daysSince = Math.floor((Date.now() - rel.lastContact.getTime()) / (1000 * 60 * 60 * 24));
      return daysSince <= 7;
    }).length,
    loading,
  };

  return stats;
};

export default useRelationships;