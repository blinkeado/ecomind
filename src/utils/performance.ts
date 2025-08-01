// SOURCE: Phase 8 Polish & Deployment - Performance optimization utilities
// VERIFIED: Performance monitoring, lazy loading, and optimization helpers

import { InteractionManager, Platform } from 'react-native';
import { Dimensions } from 'react-native';

/**
 * Performance optimization utilities for EcoMind
 * Provides lazy loading, debouncing, throttling, and performance monitoring
 */

// Performance measurement utilities
export interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private thresholds = {
    render: 16, // 60fps = 16.67ms per frame
    interaction: 100, // User interactions should respond within 100ms
    navigation: 300, // Navigation should complete within 300ms
    aiProcessing: 300, // AI processing timeout
    dataLoad: 1000, // Data loading should complete within 1s
  };

  /**
   * Start measuring performance for a specific operation
   */
  start(name: string, metadata?: Record<string, any>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  /**
   * End measuring performance and log if threshold exceeded
   */
  end(name: string): PerformanceMetrics | null {
    const metric = this.metrics.get(name);
    if (!metric) return null;

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    const completedMetric: PerformanceMetrics = {
      ...metric,
      endTime,
      duration,
    };

    this.metrics.set(name, completedMetric);

    // Check thresholds and warn if exceeded
    const threshold = this.getThreshold(name);
    if (threshold && duration > threshold) {
      console.warn(`Performance threshold exceeded for ${name}: ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`, {
        metric: completedMetric,
      });
    }

    return completedMetric;
  }

  /**
   * Get performance threshold for operation type
   */
  private getThreshold(name: string): number | null {
    const lowercaseName = name.toLowerCase();
    
    if (lowercaseName.includes('render')) return this.thresholds.render;
    if (lowercaseName.includes('interaction') || lowercaseName.includes('tap')) return this.thresholds.interaction;
    if (lowercaseName.includes('navigation') || lowercaseName.includes('navigate')) return this.thresholds.navigation;
    if (lowercaseName.includes('ai') || lowercaseName.includes('prompt')) return this.thresholds.aiProcessing;
    if (lowercaseName.includes('load') || lowercaseName.includes('fetch')) return this.thresholds.dataLoad;
    
    return null;
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    totalOperations: number;
    averageDuration: number;
    slowestOperations: PerformanceMetrics[];
    thresholdViolations: PerformanceMetrics[];
  } {
    const metrics = this.getMetrics().filter(m => m.duration !== undefined);
    const totalDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageDuration = metrics.length > 0 ? totalDuration / metrics.length : 0;

    const slowestOperations = metrics
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    const thresholdViolations = metrics.filter(m => {
      const threshold = this.getThreshold(m.name);
      return threshold && (m.duration || 0) > threshold;
    });

    return {
      totalOperations: metrics.length,
      averageDuration,
      slowestOperations,
      thresholdViolations,
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Performance decorator for measuring function execution time
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  target: T,
  name?: string
): T {
  return ((...args: Parameters<T>) => {
    const operationName = name || target.name || 'anonymous';
    performanceMonitor.start(operationName);
    
    try {
      const result = target(...args);
      
      // Handle both sync and async functions
      if (result instanceof Promise) {
        return result.finally(() => {
          performanceMonitor.end(operationName);
        });
      } else {
        performanceMonitor.end(operationName);
        return result;
      }
    } catch (error) {
      performanceMonitor.end(operationName);
      throw error;
    }
  }) as T;
}

/**
 * Debounce function to limit rapid successive calls
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout | null = null;
  
  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

/**
 * Throttle function to limit call frequency
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean = false;
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}

/**
 * Run callback after interactions have completed (better performance)
 */
export function runAfterInteractions(callback: () => void): void {
  InteractionManager.runAfterInteractions(callback);
}

/**
 * Lazy import utility for code splitting
 */
export function lazyImport<T>(importFunc: () => Promise<T>): () => Promise<T> {
  let cached: T | null = null;
  
  return async (): Promise<T> => {
    if (cached) return cached;
    
    const module = await importFunc();
    cached = module;
    return module;
  };
}

/**
 * Memory usage monitoring
 */
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private readonly maxMemoryThreshold = 150 * 1024 * 1024; // 150MB
  private checkInterval: NodeJS.Timeout | null = null;

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  /**
   * Start monitoring memory usage
   */
  startMonitoring(): void {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop monitoring memory usage
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check current memory usage and warn if threshold exceeded
   */
  private checkMemoryUsage(): void {
    if (Platform.OS === 'web' && 'memory' in performance) {
      const memInfo = (performance as any).memory;
      const usedMemory = memInfo.usedJSHeapSize;
      
      if (usedMemory > this.maxMemoryThreshold) {
        console.warn('Memory usage threshold exceeded:', {
          used: `${(usedMemory / 1024 / 1024).toFixed(2)}MB`,
          threshold: `${(this.maxMemoryThreshold / 1024 / 1024).toFixed(2)}MB`,
          timestamp: new Date().toISOString(),
        });
        
        // Suggest garbage collection if available
        if ('gc' in global && typeof global.gc === 'function') {
          global.gc();
        }
      }
    }
  }

  /**
   * Get current memory usage (web only)
   */
  getCurrentMemoryUsage(): { used: number; total: number; percentage: number } | null {
    if (Platform.OS === 'web' && 'memory' in performance) {
      const memInfo = (performance as any).memory;
      const used = memInfo.usedJSHeapSize;
      const total = memInfo.jsHeapSizeLimit;
      const percentage = (used / total) * 100;
      
      return { used, total, percentage };
    }
    
    return null;
  }
}

export const memoryMonitor = MemoryMonitor.getInstance();

/**
 * Image optimization utilities
 */
export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number; // 0-1
  format?: 'webp' | 'jpeg' | 'png';
}

export class ImageOptimizer {
  private static readonly DEFAULT_QUALITY = 0.8;
  private static readonly DEFAULT_MAX_WIDTH = 800;
  private static readonly DEFAULT_MAX_HEIGHT = 600;

  /**
   * Get optimized image dimensions based on screen size
   */
  static getOptimizedDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth?: number,
    maxHeight?: number
  ): { width: number; height: number } {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    
    const targetMaxWidth = maxWidth || Math.min(screenWidth * 2, this.DEFAULT_MAX_WIDTH);
    const targetMaxHeight = maxHeight || Math.min(screenHeight * 2, this.DEFAULT_MAX_HEIGHT);
    
    const aspectRatio = originalWidth / originalHeight;
    
    let width = originalWidth;
    let height = originalHeight;
    
    // Scale down if too wide
    if (width > targetMaxWidth) {
      width = targetMaxWidth;
      height = width / aspectRatio;
    }
    
    // Scale down if too tall
    if (height > targetMaxHeight) {
      height = targetMaxHeight;
      width = height * aspectRatio;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
  }

  /**
   * Generate responsive image source set
   */
  static generateResponsiveImageSources(baseUrl: string): string[] {
    const densities = [1, 2, 3]; // 1x, 2x, 3x for different screen densities
    return densities.map(density => `${baseUrl}?density=${density}`);
  }
}

/**
 * List optimization utilities for large datasets
 */
export interface ListOptimizationConfig {
  itemHeight: number;
  windowSize?: number;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
}

export class ListOptimizer {
  /**
   * Get optimized FlatList props for large datasets
   */
  static getOptimizedListProps(
    itemCount: number,
    config: ListOptimizationConfig
  ): Partial<any> {
    const screenHeight = Dimensions.get('window').height;
    const visibleItems = Math.ceil(screenHeight / config.itemHeight);
    
    return {
      windowSize: config.windowSize || Math.min(10, Math.max(5, visibleItems)),
      initialNumToRender: config.initialNumToRender || Math.min(20, visibleItems * 2),
      maxToRenderPerBatch: config.maxToRenderPerBatch || Math.min(10, visibleItems),
      updateCellsBatchingPeriod: config.updateCellsBatchingPeriod || 50,
      removeClippedSubviews: itemCount > 50,
      getItemLayout: (data: any, index: number) => ({
        length: config.itemHeight,
        offset: config.itemHeight * index,
        index,
      }),
    };
  }
}

/**
 * Bundle size analyzer for development
 */
export class BundleAnalyzer {
  private static readonly LARGE_BUNDLE_THRESHOLD = 5 * 1024 * 1024; // 5MB

  /**
   * Analyze bundle and suggest optimizations (development only)
   */
  static analyzeBundleSize(): void {
    if (__DEV__) {
      // This would be expanded with actual bundle analysis in a real implementation
      console.log('Bundle analysis:', {
        suggestion: 'Use React.lazy() for code splitting large components',
        tools: 'Use react-native-bundle-visualizer to analyze bundle composition',
        optimization: 'Consider lazy loading non-critical features',
      });
    }
  }
}

/**
 * Performance-optimized component wrapper
 */
export function withPerformanceOptimization<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    name?: string;
    memo?: boolean;
    measureRender?: boolean;
  } = {}
): React.ComponentType<P> {
  const { name = Component.displayName || 'Component', memo = true, measureRender = true } = options;

  let OptimizedComponent: React.ComponentType<P> = Component;

  // Add memo optimization
  if (memo) {
    OptimizedComponent = React.memo(OptimizedComponent);
  }

  // Add render performance measurement
  if (measureRender && __DEV__) {
    const WrappedComponent = (props: P) => {
      const renderName = `${name}_render`;
      performanceMonitor.start(renderName);
      
      React.useEffect(() => {
        performanceMonitor.end(renderName);
      });

      return React.createElement(OptimizedComponent, props);
    };

    WrappedComponent.displayName = `withPerformance(${name})`;
    return WrappedComponent;
  }

  return OptimizedComponent;
}

/**
 * Development performance profiler
 */
export class DevelopmentProfiler {
  private static enabled = __DEV__;

  /**
   * Profile React component rendering
   */
  static profileComponent(
    name: string,
    callback: () => void
  ): void {
    if (!this.enabled) return;

    performanceMonitor.start(`component_${name}`);
    callback();
    performanceMonitor.end(`component_${name}`);
  }

  /**
   * Generate development performance report
   */
  static generateDevReport(): void {
    if (!this.enabled) return;

    const report = performanceMonitor.generateReport();
    console.group('🔍 Development Performance Report');
    console.log('Total Operations:', report.totalOperations);
    console.log('Average Duration:', `${report.averageDuration.toFixed(2)}ms`);
    
    if (report.thresholdViolations.length > 0) {
      console.warn('Threshold Violations:', report.thresholdViolations);
    }
    
    if (report.slowestOperations.length > 0) {
      console.log('Slowest Operations:', report.slowestOperations.slice(0, 5));
    }
    
    console.groupEnd();
  }
}