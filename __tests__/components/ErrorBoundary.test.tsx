// SOURCE: React Testing Library Official Documentation + React Error Boundary Testing Best Practices
// URL: https://testing-library.com/docs/react-native-testing-library/intro + https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
// VERIFIED: Official React error boundary testing patterns with React Native Testing Library

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { ErrorBoundary, ErrorBoundaryWrapper, withErrorBoundary, setupGlobalErrorHandler } from '../../src/components/ErrorBoundary';

// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow?: boolean; message?: string }> = ({ shouldThrow = true, message = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <Text>No error</Text>;
};

// Mock console to suppress error logs during tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Normal Operation', () => {
    test('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeOnTheScreen();
    });

    test('should not show error UI when children render successfully', () => {
      render(
        <ErrorBoundary>
          <View testID="child-component">
            <Text>Working component</Text>
          </View>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child-component')).toBeOnTheScreen();
      expect(screen.getByText('Working component')).toBeOnTheScreen();
      expect(screen.queryByText('Something went wrong')).not.toBeOnTheScreen();
    });
  });

  describe('Error Handling', () => {
    test('should catch and display error when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError message="Component crashed" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
      expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeOnTheScreen();
      expect(screen.getByText('Try Again')).toBeOnTheScreen();
    });

    test('should show custom fallback UI when provided', () => {
      const customFallback = (
        <View testID="custom-error">
          <Text>Custom error message</Text>
        </View>
      );

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-error')).toBeOnTheScreen();
      expect(screen.getByText('Custom error message')).toBeOnTheScreen();
      expect(screen.queryByText('Something went wrong')).not.toBeOnTheScreen();
    });

    test('should call onError callback when provided', () => {
      const mockOnError = jest.fn();
      const testError = new Error('Test error message');

      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError message="Test error message" />
        </ErrorBoundary>
      );

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error message',
        }),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    test('should log error details to console', () => {
      render(
        <ErrorBoundary>
          <ThrowError message="Detailed error" />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('ErrorBoundary: Component error caught:'),
        expect.objectContaining({
          error: 'Detailed error',
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('Error Recovery', () => {
    test('should reset error state when Try Again is pressed', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Error should be displayed
      expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
      
      // Press Try Again button
      fireEvent.press(screen.getByText('Try Again'));

      // Re-render with non-throwing component
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Should show normal content
      expect(screen.getByText('No error')).toBeOnTheScreen();
      expect(screen.queryByText('Something went wrong')).not.toBeOnTheScreen();
    });

    test('should handle multiple error recovery cycles', () => {
      let shouldThrow = true;
      
      const ToggleError: React.FC = () => {
        if (shouldThrow) {
          throw new Error('Toggle error');
        }
        return <Text>Success</Text>;
      };

      const { rerender } = render(
        <ErrorBoundary>
          <ToggleError />
        </ErrorBoundary>
      );

      // First error
      expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
      
      // Reset and recover
      fireEvent.press(screen.getByText('Try Again'));
      shouldThrow = false;
      rerender(
        <ErrorBoundary>
          <ToggleError />
        </ErrorBoundary>
      );
      expect(screen.getByText('Success')).toBeOnTheScreen();

      // Throw error again
      shouldThrow = true;
      rerender(
        <ErrorBoundary>
          <ToggleError />
        </ErrorBoundary>
      );
      expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
    });
  });

  describe('Development vs Production Behavior', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    test('should show debug information in development mode', () => {
      process.env.NODE_ENV = 'development';
      global.__DEV__ = true;

      render(
        <ErrorBoundary>
          <ThrowError message="Debug error message" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Debug Info:')).toBeOnTheScreen();
      expect(screen.getByText('Debug error message')).toBeOnTheScreen();
    });

    test('should hide debug information in production mode', () => {
      process.env.NODE_ENV = 'production';
      global.__DEV__ = false;

      render(
        <ErrorBoundary>
          <ThrowError message="Production error" />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Debug Info:')).not.toBeOnTheScreen();
      expect(screen.queryByText('Production error')).not.toBeOnTheScreen();
    });
  });

  describe('Accessibility', () => {
    test('should have proper accessibility labels', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const retryButton = screen.getByLabelText('Try again');
      expect(retryButton).toBeOnTheScreen();
      expect(retryButton).toHaveAccessibilityState({ disabled: false });
    });

    test('should provide accessibility hint for retry button', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const retryButton = screen.getByLabelText('Try again');
      expect(retryButton.props.accessibilityHint).toBe('Resets the error and attempts to reload the component');
    });
  });
});

describe('ErrorBoundaryWrapper', () => {
  test('should work as functional component wrapper', () => {
    render(
      <ErrorBoundaryWrapper>
        <ThrowError shouldThrow={false} />
      </ErrorBoundaryWrapper>
    );

    expect(screen.getByText('No error')).toBeOnTheScreen();
  });

  test('should handle errors in functional wrapper', () => {
    const mockOnError = jest.fn();

    render(
      <ErrorBoundaryWrapper onError={mockOnError}>
        <ThrowError message="Wrapper error" />
      </ErrorBoundaryWrapper>
    );

    expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
    expect(mockOnError).toHaveBeenCalled();
  });
});

describe('withErrorBoundary HOC', () => {
  test('should wrap component with error boundary', () => {
    const TestComponent: React.FC = () => <Text>HOC Test</Text>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent />);

    expect(screen.getByText('HOC Test')).toBeOnTheScreen();
  });

  test('should catch errors in wrapped component', () => {
    const ErrorComponent: React.FC = () => {
      throw new Error('HOC error');
    };
    const WrappedComponent = withErrorBoundary(ErrorComponent);

    render(<WrappedComponent />);

    expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
  });

  test('should set correct display name', () => {
    const TestComponent: React.FC = () => <Text>Test</Text>;
    TestComponent.displayName = 'CustomTestComponent';
    
    const WrappedComponent = withErrorBoundary(TestComponent);

    expect(WrappedComponent.displayName).toBe('WithErrorBoundary(CustomTestComponent)');
  });

  test('should use component name when displayName is not set', () => {
    function NamedComponent() {
      return <Text>Named</Text>;
    }
    
    const WrappedComponent = withErrorBoundary(NamedComponent);

    expect(WrappedComponent.displayName).toBe('WithErrorBoundary(NamedComponent)');
  });
});

describe('setupGlobalErrorHandler', () => {
  const originalErrorUtils = global.ErrorUtils;
  
  beforeEach(() => {
    global.ErrorUtils = {
      getGlobalHandler: jest.fn(() => jest.fn()),
      setGlobalHandler: jest.fn(),
    };
  });

  afterEach(() => {
    global.ErrorUtils = originalErrorUtils;
  });

  test('should setup global error handler', () => {
    const mockOnError = jest.fn();
    setupGlobalErrorHandler(mockOnError);

    expect(global.ErrorUtils.setGlobalHandler).toHaveBeenCalled();
  });

  test('should call custom handler on global errors', () => {
    const mockOnError = jest.fn();
    setupGlobalErrorHandler(mockOnError);

    const globalHandler = (global.ErrorUtils.setGlobalHandler as jest.Mock).mock.calls[0][0];
    const testError = new Error('Global error');
    
    globalHandler(testError, false);

    expect(mockOnError).toHaveBeenCalledWith(testError, false);
  });

  test('should work without custom error handler', () => {
    expect(() => setupGlobalErrorHandler()).not.toThrow();
    expect(global.ErrorUtils.setGlobalHandler).toHaveBeenCalled();
  });
});

describe('Error Boundary Performance', () => {
  test('should not affect performance of normal components', () => {
    const startTime = Date.now();
    
    render(
      <ErrorBoundary>
        <View>
          {Array.from({ length: 100 }, (_, i) => (
            <Text key={i}>Item {i}</Text>
          ))}
        </View>
      </ErrorBoundary>
    );

    const endTime = Date.now();
    const renderTime = endTime - startTime;

    // Should render quickly even with many children
    expect(renderTime).toBeLessThan(1000);
    expect(screen.getByText('Item 0')).toBeOnTheScreen();
    expect(screen.getByText('Item 99')).toBeOnTheScreen();
  });

  test('should handle rapid error/recovery cycles efficiently', () => {
    let errorCount = 0;
    
    const FlickeringComponent: React.FC = () => {
      errorCount++;
      if (errorCount % 2 === 1) {
        throw new Error(`Error ${errorCount}`);
      }
      return <Text>Success {errorCount}</Text>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <FlickeringComponent />
      </ErrorBoundary>
    );

    // Error state
    expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
    
    // Reset and recover
    fireEvent.press(screen.getByText('Try Again'));
    rerender(
      <ErrorBoundary>
        <FlickeringComponent />
      </ErrorBoundary>
    );
    
    // Should recover successfully
    expect(screen.getByText('Success 2')).toBeOnTheScreen();
  });
});