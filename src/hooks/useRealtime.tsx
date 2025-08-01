// SOURCE: Firebase Firestore Real-time Updates Official Documentation
// URL: https://rnfirebase.io/firestore/usage#realtime-updates
// VERIFIED: Firebase real-time listener patterns with React hooks

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection,
  query,
  onSnapshot,
  QueryConstraint,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import { firebaseDb } from '../services/firebase';
import { useAuth } from './useAuth';

/**
 * Real-time Hook State Interface
 */
interface RealtimeState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isConnected: boolean; // Connection status
}

/**
 * Real-time Hook Options
 */
interface UseRealtimeOptions {
  enabled?: boolean; // Enable/disable real-time updates
  onError?: (error: Error) => void; // Custom error handler
  onConnectionChange?: (connected: boolean) => void; // Connection status handler
  transformData?: (doc: DocumentSnapshot) => any; // Custom data transformer
}

/**
 * Collection Reference Builder
 */
interface CollectionReference {
  path: string;
  constraints?: QueryConstraint[];
}

/**
 * Generic Real-time Hook
 * Provides real-time updates for any Firestore collection
 * SOURCE: Firebase Firestore Documentation - Real-time Updates
 */
export const useRealtime = <T = any>(
  collectionRef: CollectionReference | null,
  options: UseRealtimeOptions = {}
) => {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<RealtimeState<T>>({
    data: [],
    loading: false,
    error: null,
    lastUpdated: null,
    isConnected: false,
  });

  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const { 
    enabled = true, 
    onError, 
    onConnectionChange,
    transformData 
  } = options;

  /**
   * Default data transformer
   * Converts Firestore document to typed object
   */
  const defaultTransformData = useCallback((doc: DocumentSnapshot): T => {
    const data = doc.data();
    if (!data) return null as any;

    // Convert Firestore Timestamps to JavaScript Dates
    const transformedData = { ...data };
    Object.keys(transformedData).forEach(key => {
      const value = transformedData[key];
      if (value && typeof value.toDate === 'function') {
        transformedData[key] = value.toDate();
      }
    });

    return {
      id: doc.id,
      ...transformedData,
    } as T;
  }, []);

  /**
   * Setup real-time listener
   */
  const setupListener = useCallback(() => {
    if (!collectionRef || !enabled || !isAuthenticated) {
      setState(prev => ({
        ...prev,
        data: [],
        loading: false,
        isConnected: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Build Firestore query
      const collectionQuery = collectionRef.constraints
        ? query(collection(firebaseDb, collectionRef.path), ...collectionRef.constraints)
        : collection(firebaseDb, collectionRef.path);

      // Setup real-time listener
      const unsubscribe = onSnapshot(
        collectionQuery,
        {
          includeMetadataChanges: true, // Include metadata changes for connection status
        },
        (querySnapshot: QuerySnapshot) => {
          try {
            // Check if data is from cache (offline) or server (online)
            const isFromCache = querySnapshot.metadata.fromCache;
            const isConnected = !isFromCache;

            // Transform documents
            const transformer = transformData || defaultTransformData;
            const data: T[] = [];
            
            querySnapshot.forEach((doc) => {
              try {
                const transformedDoc = transformer(doc);
                if (transformedDoc) {
                  data.push(transformedDoc);
                }
              } catch (transformError) {
                console.warn('🔥 useRealtime: Error transforming document:', doc.id, transformError);
              }
            });

            // Update state
            setState(prev => ({
              ...prev,
              data,
              loading: false,
              error: null,
              lastUpdated: new Date(),
              isConnected,
            }));

            // Notify connection status change
            if (onConnectionChange) {
              onConnectionChange(isConnected);
            }

            console.log(`🔥 useRealtime: Updated ${data.length} documents (${isConnected ? 'online' : 'cached'})`);
          } catch (error) {
            console.error('🔥 useRealtime Error (Process Snapshot):', error);
            setState(prev => ({
              ...prev,
              loading: false,
              error: error instanceof Error ? error.message : 'Error processing real-time update',
            }));
          }
        },
        (error: Error) => {
          console.error('🔥 useRealtime Error (Listener):', error);
          
          setState(prev => ({
            ...prev,
            loading: false,
            error: error.message,
            isConnected: false,
          }));

          // Call custom error handler
          if (onError) {
            onError(error);
          }

          // Notify connection status change
          if (onConnectionChange) {
            onConnectionChange(false);
          }
        }
      );

      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error('🔥 useRealtime Error (Setup):', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to setup real-time listener',
        isConnected: false,
      }));
    }
  }, [collectionRef, enabled, isAuthenticated, transformData, defaultTransformData, onError, onConnectionChange]);

  /**
   * Cleanup listener
   */
  const cleanup = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      console.log('🔥 useRealtime: Listener cleanup complete');
    }
  }, []);

  /**
   * Manual refresh (forces a new listener setup)
   */
  const refresh = useCallback(() => {
    cleanup();
    setupListener();
  }, [cleanup, setupListener]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Effect for setting up and cleaning up the listener
   */
  useEffect(() => {
    setupListener();
    return cleanup;
  }, [setupListener, cleanup]);

  return {
    ...state,
    refresh,
    clearError,
  };
};

/**
 * User-scoped Real-time Hook
 * Automatically scopes collections to the current user
 */
export const useUserRealtime = <T = any>(
  collectionPath: string,
  constraints: QueryConstraint[] = [],
  options: UseRealtimeOptions = {}
) => {
  const { user } = useAuth();
  
  const collectionRef = user?.uid 
    ? {
        path: `users/${user.uid}/${collectionPath}`,
        constraints,
      }
    : null;

  return useRealtime<T>(collectionRef, options);
};

/**
 * Connection Status Hook
 * Monitors Firestore connection status
 */
export const useFirestoreConnection = () => {
  const [connectionState, setConnectionState] = useState({
    isConnected: true,
    lastConnected: new Date(),
    lastDisconnected: null as Date | null,
  });

  const onConnectionChange = useCallback((connected: boolean) => {
    setConnectionState(prev => ({
      isConnected: connected,
      lastConnected: connected ? new Date() : prev.lastConnected,
      lastDisconnected: connected ? prev.lastDisconnected : new Date(),
    }));
  }, []);

  // Use a minimal collection to monitor connection status
  const { user } = useAuth();
  const testCollectionRef = user?.uid 
    ? { path: `users/${user.uid}/test` }
    : null;

  useRealtime(testCollectionRef, {
    enabled: !!user?.uid,
    onConnectionChange,
  });

  return connectionState;
};

/**
 * Offline-First Hook
 * Provides data with offline support and sync status
 */
interface OfflineFirstState<T> extends RealtimeState<T> {
  hasCachedData: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
}

export const useOfflineFirst = <T = any>(
  collectionRef: CollectionReference | null,
  options: UseRealtimeOptions = {}
) => {
  const [offlineState, setOfflineState] = useState<OfflineFirstState<T>>({
    data: [],
    loading: false,
    error: null,
    lastUpdated: null,
    isConnected: false,
    hasCachedData: false,
    syncStatus: 'offline',
  });

  const realtimeResult = useRealtime<T>(collectionRef, {
    ...options,
    onConnectionChange: useCallback((connected: boolean) => {
      setOfflineState(prev => ({
        ...prev,
        syncStatus: connected ? 'synced' : 'offline',
      }));
      
      if (options.onConnectionChange) {
        options.onConnectionChange(connected);
      }
    }, [options]),
  });

  // Update offline state based on realtime result
  useEffect(() => {
    setOfflineState(prev => ({
      ...prev,
      data: realtimeResult.data,
      loading: realtimeResult.loading,
      error: realtimeResult.error,
      lastUpdated: realtimeResult.lastUpdated,
      isConnected: realtimeResult.isConnected,
      hasCachedData: realtimeResult.data.length > 0,
      syncStatus: realtimeResult.loading 
        ? 'syncing' 
        : realtimeResult.error 
          ? 'error' 
          : realtimeResult.isConnected 
            ? 'synced' 
            : 'offline',
    }));
  }, [realtimeResult]);

  return {
    ...offlineState,
    refresh: realtimeResult.refresh,
    clearError: realtimeResult.clearError,
  };
};

/**
 * Batch Real-time Hook
 * Manages multiple real-time subscriptions efficiently
 */
interface BatchRealtimeSubscription {
  key: string;
  collectionRef: CollectionReference;
  options?: UseRealtimeOptions;
}

export const useBatchRealtime = (subscriptions: BatchRealtimeSubscription[]) => {
  const [batchState, setBatchState] = useState<Record<string, RealtimeState<any>>>({});
  const subscriptionRefs = useRef<Record<string, Unsubscribe>>({});

  // Setup all subscriptions
  useEffect(() => {
    // Cleanup existing subscriptions
    Object.values(subscriptionRefs.current).forEach(unsubscribe => unsubscribe());
    subscriptionRefs.current = {};

    // Setup new subscriptions
    subscriptions.forEach(({ key, collectionRef, options = {} }) => {
      try {
        const collectionQuery = collectionRef.constraints
          ? query(collection(firebaseDb, collectionRef.path), ...collectionRef.constraints)
          : collection(firebaseDb, collectionRef.path);

        const unsubscribe = onSnapshot(
          collectionQuery,
          (querySnapshot) => {
            const data: any[] = [];
            querySnapshot.forEach((doc) => {
              const docData = doc.data();
              data.push({
                id: doc.id,
                ...docData,
                // Convert timestamps
                ...Object.keys(docData).reduce((acc, field) => {
                  const value = docData[field];
                  if (value && typeof value.toDate === 'function') {
                    acc[field] = value.toDate();
                  }
                  return acc;
                }, {} as any),
              });
            });

            setBatchState(prev => ({
              ...prev,
              [key]: {
                data,
                loading: false,
                error: null,
                lastUpdated: new Date(),
                isConnected: !querySnapshot.metadata.fromCache,
              },
            }));
          },
          (error) => {
            setBatchState(prev => ({
              ...prev,
              [key]: {
                data: [],
                loading: false,
                error: error.message,
                lastUpdated: null,
                isConnected: false,
              },
            }));
          }
        );

        subscriptionRefs.current[key] = unsubscribe;
      } catch (error) {
        console.error(`🔥 useBatchRealtime Error (${key}):`, error);
      }
    });

    // Cleanup function
    return () => {
      Object.values(subscriptionRefs.current).forEach(unsubscribe => unsubscribe());
      subscriptionRefs.current = {};
    };
  }, [subscriptions]);

  return batchState;
};

export default useRealtime;