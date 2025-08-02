/**
 * React Hook for Performance Monitoring
 * Official implementation following React Native Firebase Performance documentation
 * https://rnfirebase.io/perf/usage
 * 
 * Features:
 * - Screen performance tracking
 * - Operation performance monitoring
 * - Business metrics tracking
 * - Error tracking integration
 */

import { useEffect, useCallback, useRef } from 'react';
import { performanceMonitor } from '../services/performanceMonitoring';

/**
 * Hook for tracking screen performance
 * Automatically tracks screen render time and cleanup
 */
export const useScreenPerformance = (screenName: string) => {
  const stopTraceRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Start screen performance tracking
    const startTracking = async () => {
      try {
        const stopTrace = await performanceMonitor.trackScreenPerformance(screenName);
        if (isMounted) {
          stopTraceRef.current = stopTrace;
        } else {
          // If component unmounted before tracking started, stop immediately
          await stopTrace();
        }
      } catch (error) {
        console.error(`Failed to start screen tracking for ${screenName}:`, error);
      }
    };

    startTracking();

    // Cleanup function
    return () => {
      isMounted = false;
      if (stopTraceRef.current) {
        stopTraceRef.current().catch(error => {
          console.error(`Failed to stop screen tracking for ${screenName}:`, error);
        });
      }
    };
  }, [screenName]);

  return {
    screenName,
    isTracking: !!stopTraceRef.current
  };
};

/**
 * Hook for tracking database operations
 */
export const useDatabasePerformance = () => {
  const trackDatabaseOperation = useCallback(async <T>(
    operation: string,
    collectionPath: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    return performanceMonitor.trackDatabaseOperation(operation, collectionPath, fn);
  }, []);

  return {
    trackDatabaseOperation
  };
};

/**
 * Hook for tracking AI operations (Vector Search, Genkit workflows)
 */
export const useAIPerformance = () => {
  const trackAIOperation = useCallback(async <T>(
    operationType: 'vector_search' | 'genkit_workflow' | 'embedding_generation',
    model: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    return performanceMonitor.trackAIOperation(operationType, model, fn);
  }, []);

  const trackVectorSearch = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    return performanceMonitor.trackAIOperation('vector_search', 'text-embedding-004', fn);
  }, []);

  const trackGenkitWorkflow = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    return performanceMonitor.trackAIOperation('genkit_workflow', 'gemini-1.5-flash', fn);
  }, []);

  return {
    trackAIOperation,
    trackVectorSearch,
    trackGenkitWorkflow
  };
};

/**
 * Hook for tracking HTTP requests
 */
export const useHTTPPerformance = () => {
  const trackHTTPRequest = useCallback(async (
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    fn: () => Promise<Response>
  ): Promise<Response> => {
    return performanceMonitor.trackHTTPRequest(url, method, fn);
  }, []);

  return {
    trackHTTPRequest
  };
};

/**
 * Hook for tracking business metrics
 */
export const useBusinessMetrics = () => {
  const trackBusinessMetric = useCallback(async (
    metricName: string,
    value: number,
    attributes: Record<string, string> = {}
  ): Promise<void> => {
    return performanceMonitor.trackBusinessMetric(metricName, value, attributes);
  }, []);

  const trackRelationshipMetrics = useCallback(async (metrics: {
    totalRelationships: number;
    averageHealthScore: number;
    aiUsageFrequency: number;
    vectorSearchQueries: number;
    emotionalSignalsProcessed: number;
  }): Promise<void> => {
    return performanceMonitor.trackRelationshipMetrics(metrics);
  }, []);

  const trackUserEngagement = useCallback(async (
    action: string,
    value: number = 1,
    context: Record<string, string> = {}
  ): Promise<void> => {
    return performanceMonitor.trackBusinessMetric(`user_engagement_${action}`, value, {
      action,
      timestamp: new Date().toISOString(),
      ...context
    });
  }, []);

  const trackFeatureUsage = useCallback(async (
    feature: string,
    usage_count: number = 1,
    context: Record<string, string> = {}
  ): Promise<void> => {
    return performanceMonitor.trackBusinessMetric(`feature_usage_${feature}`, usage_count, {
      feature,
      timestamp: new Date().toISOString(),
      ...context
    });
  }, []);

  return {
    trackBusinessMetric,
    trackRelationshipMetrics,
    trackUserEngagement,
    trackFeatureUsage
  };
};

/**
 * Hook for performance analytics
 */
export const usePerformanceAnalytics = () => {
  const getAnalytics = useCallback(() => {
    return performanceMonitor.getPerformanceAnalytics();
  }, []);

  const resetMetrics = useCallback(() => {
    performanceMonitor.resetMetrics();
  }, []);

  return {
    getAnalytics,
    resetMetrics
  };
};

/**
 * Hook for comprehensive performance monitoring setup
 * Use this in the root component to initialize monitoring
 */
export const usePerformanceSetup = () => {
  useEffect(() => {
    let isMounted = true;

    const initializePerformance = async () => {
      try {
        // Configure Firebase Performance Monitoring following official patterns
        await performanceMonitor.constructor.configurePerformanceMonitoring();
        
        if (isMounted) {
          console.log('Performance monitoring initialized successfully');
        }
      } catch (error) {
        console.error('Failed to initialize performance monitoring:', error);
      }
    };

    initializePerformance();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    isInitialized: true
  };
};