// Modern React Error Boundary using react-error-boundary (August 2025)
// SOURCE: https://github.com/bvaughn/react-error-boundary
// VERIFIED: Modern functional component patterns with useErrorBoundary hook

import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ErrorBoundary as ReactErrorBoundary, useErrorBoundary, FallbackProps } from 'react-error-boundary';

/**
 * Error Fallback Component
 * Modern functional component for error display
 */
interface ErrorFallbackProps extends FallbackProps {
  resetErrorBoundary: () => void;
  error: Error;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <View style={styles.errorContainer}>
      <View style={styles.errorContent}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>
          We're sorry, but something unexpected happened. Please try again.
        </Text>
        
        {__DEV__ && error && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugTitle}>Debug Info:</Text>
            <Text style={styles.debugText}>{error.message}</Text>
            {error.stack && (
              <Text style={styles.debugText} numberOfLines={5}>
                {error.stack}
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.retryButton}
          onPress={resetErrorBoundary}
          accessibilityLabel="Try again"
          accessibilityHint="Resets the error and attempts to reload the component"
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Modern Error Boundary Props
 */
interface ModernErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<FallbackProps>;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
  onReset?: () => void;
}

/**
 * Modern Error Boundary Component
 * Uses react-error-boundary library for better functionality
 */
export const ErrorBoundary: React.FC<ModernErrorBoundaryProps> = ({
  children,
  fallback: FallbackComponent = ErrorFallback,
  onError,
  onReset,
}) => {
  const handleError = (error: Error, errorInfo: { componentStack: string }) => {
    // Log error details
    console.error('🚨 ErrorBoundary: Component error caught:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // TODO: Send error to crash reporting service (Firebase Crashlytics)
    // crashlytics().recordError(error);
  };

  const handleReset = () => {
    console.log('✅ ErrorBoundary: Reset triggered');
    if (onReset) {
      onReset();
    }
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={handleError}
      onReset={handleReset}
    >
      {children}
    </ReactErrorBoundary>
  );
};

/**
 * Modern Error Boundary Hook
 * For imperative error handling in functional components
 */
export const useErrorHandler = () => {
  const { showBoundary } = useErrorBoundary();
  
  const handleError = React.useCallback((error: Error) => {
    console.error('🚨 useErrorHandler: Manual error triggered:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    showBoundary(error);
  }, [showBoundary]);

  return handleError;
};

/**
 * Higher-Order Component for Error Boundary
 * Modern implementation using react-error-boundary
 */
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: React.ComponentType<FallbackProps>,
  onError?: (error: Error, errorInfo: { componentStack: string }) => void
) => {
  const WithErrorBoundaryComponent: React.FC<P> = (props) => {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };

  WithErrorBoundaryComponent.displayName = 
    `WithErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
};

/**
 * Async Error Handler Hook
 * For handling errors in async operations and event handlers
 */
export const useAsyncErrorHandler = () => {
  const handleError = useErrorHandler();
  
  return React.useCallback((asyncFn: () => Promise<any>) => {
    return asyncFn().catch(handleError);
  }, [handleError]);
};

/**
 * Error Boundary with Custom Reset Logic
 * Provides more control over when the boundary resets
 */
interface ErrorBoundaryWithResetProps extends ModernErrorBoundaryProps {
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

export const ErrorBoundaryWithReset: React.FC<ErrorBoundaryWithResetProps> = ({
  resetKeys,
  resetOnPropsChange = true,
  ...props
}) => {
  return (
    <ReactErrorBoundary
      resetKeys={resetKeys}
      resetOnPropsChange={resetOnPropsChange}
      FallbackComponent={props.fallback || ErrorFallback}
      onError={props.onError}
      onReset={props.onReset}
    >
      {props.children}
    </ReactErrorBoundary>
  );
};

/**
 * Global Error Handler for React Native
 * Modern implementation with better error categorization
 */
export const setupGlobalErrorHandler = (
  onError?: (error: Error, isFatal: boolean, type: 'js' | 'promise') => void
): void => {
  // Handle unhandled JavaScript errors
  const defaultHandler = global.ErrorUtils?.getGlobalHandler();
  
  global.ErrorUtils?.setGlobalHandler((error: Error, isFatal: boolean) => {
    console.error('🚨 Global JS Error:', {
      error: error.message,
      stack: error.stack,
      isFatal,
      type: 'js',
      timestamp: new Date().toISOString(),
    });

    // Call custom error handler
    if (onError) {
      onError(error, isFatal, 'js');
    }

    // Call original handler
    if (defaultHandler) {
      defaultHandler(error, isFatal);
    }
  });

  // Handle unhandled promise rejections (modern approach)
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    
    console.error('🚨 Unhandled Promise Rejection:', {
      error: error.message,
      stack: error.stack,
      type: 'promise',
      timestamp: new Date().toISOString(),
    });

    // Call custom error handler
    if (onError) {
      onError(error, false, 'promise');
    }

    // Prevent default browser behavior
    event.preventDefault();
  };

  // Add event listener for promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
  }
};

/**
 * Error Boundary Styles (unchanged from original)
 */
const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#dc3545',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  debugInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  retryButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

/**
 * Export modern error boundary as default
 */
export default ErrorBoundary;

// Re-export hooks and utilities from react-error-boundary for convenience
export { useErrorBoundary } from 'react-error-boundary';