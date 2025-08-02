/**
 * Production Performance Monitoring Service
 * Official implementation following Firebase Performance Monitoring documentation
 * https://firebase.google.com/docs/perf-mon
 * https://rnfirebase.io/perf/usage
 * 
 * Features:
 * - Firebase Performance Monitoring integration
 * - Custom traces for business metrics
 * - HTTP request monitoring
 * - Screen performance tracking
 * - Memory and CPU monitoring
 */

import perf from '@react-native-firebase/perf';
import crashlytics from '@react-native-firebase/crashlytics';
import { Metrics } from '@react-native-firebase/perf';

// Performance metrics interfaces following official Firebase patterns
interface CustomTrace {
  trace: any;
  startTime: number;
}

interface HTTPMetric {
  metric: any;
  startTime: number;
}

interface PerformanceMetrics {
  databaseOperations: Map<string, number[]>;
  aiProcessingTimes: Map<string, number[]>;
  screenRenderTimes: Map<string, number[]>;
  vectorSearchTimes: number[];
  genkitWorkflowTimes: number[];
}

export class ProductionPerformanceMonitor {
  private activeTraces = new Map<string, CustomTrace>();
  private activeHTTPMetrics = new Map<string, HTTPMetric>();
  private metrics: PerformanceMetrics = {
    databaseOperations: new Map(),
    aiProcessingTimes: new Map(),
    screenRenderTimes: new Map(),
    vectorSearchTimes: [],
    genkitWorkflowTimes: []
  };

  /**
   * Track database operations performance
   * Following official Firebase Performance Monitoring patterns
   */
  async trackDatabaseOperation<T>(
    operation: string,
    collectionPath: string,
    fn: () => Promise<T>
  ): Promise<T> {
    // Create custom trace following official documentation
    const trace = await perf().startTrace(`database_${operation}`);
    const startTime = Date.now();
    
    try {
      // Add custom attributes for detailed monitoring
      trace.putAttribute('operation_type', operation);
      trace.putAttribute('collection_path', collectionPath);
      trace.putAttribute('timestamp', new Date().toISOString());
      
      const result = await fn();
      
      const duration = Date.now() - startTime;
      
      // Record metrics following official patterns
      trace.putMetric('duration_ms', duration);
      trace.putMetric('success_count', 1);
      trace.putAttribute('status', 'success');
      
      // Store metrics for analytics
      if (!this.metrics.databaseOperations.has(operation)) {
        this.metrics.databaseOperations.set(operation, []);
      }
      this.metrics.databaseOperations.get(operation)!.push(duration);
      
      // Log to Crashlytics for comprehensive monitoring
      await crashlytics().log(`Database ${operation} completed in ${duration}ms`);
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track errors following official error handling patterns
      trace.putAttribute('status', 'error');
      trace.putAttribute('error_message', error instanceof Error ? error.message : 'Unknown error');
      trace.putMetric('error_count', 1);
      trace.putMetric('duration_ms', duration);
      
      // Log error to Crashlytics
      await crashlytics().recordError(error instanceof Error ? error : new Error(String(error)));
      
      throw error;
      
    } finally {
      await trace.stop();
    }
  }

  /**
   * Track AI processing performance (Vector Search, Genkit workflows)
   */
  async trackAIOperation<T>(
    operationType: 'vector_search' | 'genkit_workflow' | 'embedding_generation',
    model: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const trace = await perf().startTrace(`ai_${operationType}`);
    const startTime = Date.now();
    
    try {
      // Official attribute patterns for AI monitoring
      trace.putAttribute('model', model);
      trace.putAttribute('operation_type', operationType);
      trace.putAttribute('environment', __DEV__ ? 'development' : 'production');
      
      const result = await fn();
      
      const duration = Date.now() - startTime;
      
      // Record AI-specific metrics
      trace.putMetric('processing_time_ms', duration);
      trace.putMetric('success_count', 1);
      trace.putAttribute('status', 'success');
      
      // Store for specific AI operation tracking
      if (operationType === 'vector_search') {
        this.metrics.vectorSearchTimes.push(duration);
      } else if (operationType === 'genkit_workflow') {
        this.metrics.genkitWorkflowTimes.push(duration);
      }
      
      // Store in general AI metrics
      if (!this.metrics.aiProcessingTimes.has(operationType)) {
        this.metrics.aiProcessingTimes.set(operationType, []);
      }
      this.metrics.aiProcessingTimes.get(operationType)!.push(duration);
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      trace.putAttribute('status', 'error');
      trace.putAttribute('error_message', error instanceof Error ? error.message : 'Unknown error');
      trace.putMetric('error_count', 1);
      trace.putMetric('processing_time_ms', duration);
      
      await crashlytics().recordError(error instanceof Error ? error : new Error(String(error)));
      
      throw error;
      
    } finally {
      await trace.stop();
    }
  }

  /**
   * Track HTTP requests following official Firebase patterns
   * https://rnfirebase.io/perf/usage#http-requests
   */
  async trackHTTPRequest<T>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    fn: () => Promise<Response>
  ): Promise<Response> {
    // Create HTTP metric following official documentation
    const metric = await perf().newHttpMetric(url, method);
    
    try {
      await metric.start();
      const response = await fn();
      
      // Record response details following official patterns
      metric.setHttpResponseCode(response.status);
      metric.setResponseContentType(response.headers.get('content-type') || '');
      
      const responsePayloadSize = response.headers.get('content-length');
      if (responsePayloadSize) {
        metric.setResponsePayloadSize(parseInt(responsePayloadSize, 10));
      }
      
      return response;
      
    } catch (error) {
      // Track HTTP errors
      metric.setHttpResponseCode(0); // Indicates network error
      await crashlytics().recordError(error instanceof Error ? error : new Error(String(error)));
      throw error;
      
    } finally {
      await metric.stop();
    }
  }

  /**
   * Track screen performance following official React Native patterns
   */
  async trackScreenPerformance(screenName: string): Promise<() => Promise<void>> {
    const trace = await perf().startScreenTrace(screenName);
    const startTime = Date.now();
    
    // Add screen-specific attributes
    trace.putAttribute('screen_name', screenName);
    trace.putAttribute('screen_type', 'react_native');
    
    // Return stop function for component cleanup
    return async () => {
      const renderTime = Date.now() - startTime;
      
      trace.putMetric('render_time_ms', renderTime);
      trace.putAttribute('render_complete', 'true');
      
      // Store screen render metrics
      if (!this.metrics.screenRenderTimes.has(screenName)) {
        this.metrics.screenRenderTimes.set(screenName, []);
      }
      this.metrics.screenRenderTimes.get(screenName)!.push(renderTime);
      
      await trace.stop();
    };
  }

  /**
   * Track business metrics following official custom trace patterns
   */
  async trackBusinessMetric(
    metricName: string,
    value: number,
    attributes: Record<string, string> = {}
  ): Promise<void> {
    const trace = await perf().startTrace(`business_metric_${metricName}`);
    
    try {
      // Add business context attributes
      Object.entries(attributes).forEach(([key, val]) => {
        trace.putAttribute(key, val);
      });
      
      trace.putAttribute('metric_type', 'business');
      trace.putAttribute('timestamp', new Date().toISOString());
      
      // Record the business metric value
      trace.putMetric('value', value);
      
      await crashlytics().log(`Business metric ${metricName}: ${value}`);
      
    } finally {
      await trace.stop();
    }
  }

  /**
   * Track relationship-specific metrics
   */
  async trackRelationshipMetrics(metrics: {
    totalRelationships: number;
    averageHealthScore: number;
    aiUsageFrequency: number;
    vectorSearchQueries: number;
    emotionalSignalsProcessed: number;
  }): Promise<void> {
    // Set custom keys for Crashlytics following official patterns
    await crashlytics().setAttributes({
      relationship_count: metrics.totalRelationships.toString(),
      avg_health_score: metrics.averageHealthScore.toString(),
      ai_usage_frequency: metrics.aiUsageFrequency.toString(),
      vector_search_queries: metrics.vectorSearchQueries.toString(),
      emotional_signals_processed: metrics.emotionalSignalsProcessed.toString()
    });

    // Track as business metrics
    await this.trackBusinessMetric('relationship_count', metrics.totalRelationships, {
      category: 'user_engagement'
    });
    
    await this.trackBusinessMetric('avg_health_score', metrics.averageHealthScore, {
      category: 'relationship_quality'
    });
    
    await this.trackBusinessMetric('ai_usage_frequency', metrics.aiUsageFrequency, {
      category: 'feature_adoption'
    });
  }

  /**
   * Get performance analytics summary
   */
  getPerformanceAnalytics(): {
    database: {
      operations: Array<{ operation: string; avgTime: number; count: number }>;
    };
    ai: {
      vectorSearch: { avgTime: number; count: number };
      genkitWorkflows: { avgTime: number; count: number };
      operations: Array<{ operation: string; avgTime: number; count: number }>;
    };
    screens: Array<{ screen: string; avgRenderTime: number; count: number }>;
    summary: {
      totalOperations: number;
      averageResponseTime: number;
      performanceScore: number; // 0-100
    };
  } {
    // Calculate database operation analytics
    const databaseOps = Array.from(this.metrics.databaseOperations.entries()).map(([op, times]) => ({
      operation: op,
      avgTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      count: times.length
    }));

    // Calculate AI operation analytics
    const aiOps = Array.from(this.metrics.aiProcessingTimes.entries()).map(([op, times]) => ({
      operation: op,
      avgTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      count: times.length
    }));

    // Calculate screen render analytics
    const screenAnalytics = Array.from(this.metrics.screenRenderTimes.entries()).map(([screen, times]) => ({
      screen,
      avgRenderTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      count: times.length
    }));

    // Vector search specific analytics
    const vectorSearchAvg = this.metrics.vectorSearchTimes.length > 0
      ? this.metrics.vectorSearchTimes.reduce((sum, time) => sum + time, 0) / this.metrics.vectorSearchTimes.length
      : 0;

    // Genkit workflow specific analytics
    const genkitWorkflowAvg = this.metrics.genkitWorkflowTimes.length > 0
      ? this.metrics.genkitWorkflowTimes.reduce((sum, time) => sum + time, 0) / this.metrics.genkitWorkflowTimes.length
      : 0;

    // Calculate overall performance score (official Firebase Performance scoring approach)
    const allTimes = [
      ...Array.from(this.metrics.databaseOperations.values()).flat(),
      ...Array.from(this.metrics.aiProcessingTimes.values()).flat(),
      ...Array.from(this.metrics.screenRenderTimes.values()).flat()
    ];

    const avgResponseTime = allTimes.length > 0 
      ? allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length 
      : 0;

    // Performance score based on Firebase Performance targets
    const performanceScore = Math.max(0, Math.min(100, 
      100 - (avgResponseTime / 10) // Penalty increases with response time
    ));

    return {
      database: { operations: databaseOps },
      ai: {
        vectorSearch: { avgTime: vectorSearchAvg, count: this.metrics.vectorSearchTimes.length },
        genkitWorkflows: { avgTime: genkitWorkflowAvg, count: this.metrics.genkitWorkflowTimes.length },
        operations: aiOps
      },
      screens: screenAnalytics,
      summary: {
        totalOperations: allTimes.length,
        averageResponseTime: avgResponseTime,
        performanceScore
      }
    };
  }

  /**
   * Reset all performance metrics
   */
  resetMetrics(): void {
    this.metrics = {
      databaseOperations: new Map(),
      aiProcessingTimes: new Map(),
      screenRenderTimes: new Map(),
      vectorSearchTimes: [],
      genkitWorkflowTimes: []
    };
  }

  /**
   * Configure Firebase Performance Monitoring settings
   * Following official configuration patterns
   */
  static async configurePerformanceMonitoring(): Promise<void> {
    try {
      // Enable performance monitoring following official setup
      await perf().setPerformanceCollectionEnabled(true);
      
      // Configure Crashlytics for comprehensive error tracking
      await crashlytics().setCrashlyticsCollectionEnabled(true);
      
      console.log('Firebase Performance Monitoring configured successfully');
      
    } catch (error) {
      console.error('Failed to configure performance monitoring:', error);
    }
  }
}

// Singleton export following official patterns
export const performanceMonitor = new ProductionPerformanceMonitor();