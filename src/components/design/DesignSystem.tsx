// SOURCE: personal-relationship-assistant.md line 37 + iOS Design Guidelines
// URL: https://developer.apple.com/design/human-interface-guidelines/
// VERIFIED: iOS glassmorphism design system with React Native Community Blur

import React from 'react';
import { StyleSheet, ViewStyle, TextStyle, StyleProp, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { UI_CONSTANTS } from '../../utils/constants';

/**
 * EcoMind Design System
 * iOS-inspired glassmorphism design components
 * SOURCE: Apple Human Interface Guidelines - Materials and Effects
 */

/**
 * Glassmorphism Effect Types
 */
export type GlassmorphismIntensity = 'subtle' | 'moderate' | 'intense';

export interface GlassmorphismProps {
  intensity?: GlassmorphismIntensity;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  blurType?: 'light' | 'dark' | 'extraDark';
}

/**
 * Primary Glassmorphism Container
 * Creates the signature glass effect with blur background
 */
export const GlassContainer: React.FC<GlassmorphismProps> = ({
  intensity = 'moderate',
  style,
  children,
  blurType = 'light',
}) => {
  const getBlurAmount = (): number => {
    switch (intensity) {
      case 'subtle': return 5;
      case 'moderate': return 10;
      case 'intense': return 20;
      default: return 10;
    }
  };

  const getOpacity = (): number => {
    switch (intensity) {
      case 'subtle': return 0.1;
      case 'moderate': return 0.15;
      case 'intense': return 0.25;
      default: return 0.15;
    }
  };

  return (
    <BlurView
      style={[
        designStyles.glassContainer,
        {
          backgroundColor: `rgba(255, 255, 255, ${getOpacity()})`,
        },
        style,
      ]}
      blurType={blurType}
      blurAmount={getBlurAmount()}
      reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.9)"
    >
      {children}
    </BlurView>
  );
};

/**
 * Glass Card Component
 * Standard card with glassmorphism effect
 */
interface GlassCardProps extends GlassmorphismProps {
  elevated?: boolean;
  bordered?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  intensity = 'moderate',
  style,
  children,
  elevated = true,
  bordered = true,
  blurType = 'light',
}) => {
  return (
    <GlassContainer
      intensity={intensity}
      blurType={blurType}
      style={[
        designStyles.glassCard,
        elevated && designStyles.elevated,
        bordered && designStyles.bordered,
        style,
      ]}
    >
      {children}
    </GlassContainer>
  );
};

/**
 * Glass Button Component
 * Interactive button with glassmorphism effect
 */
interface GlassButtonProps extends GlassmorphismProps {
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'tertiary';
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  intensity = 'moderate',
  style,
  children,
  onPress,
  disabled = false,
  variant = 'primary',
  blurType = 'light',
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
  testID,
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.2)', // Blue with transparency
          borderColor: 'rgba(59, 130, 246, 0.3)',
        };
      case 'secondary':
        return {
          backgroundColor: 'rgba(107, 114, 128, 0.2)', // Gray with transparency
          borderColor: 'rgba(107, 114, 128, 0.3)',
        };
      case 'tertiary':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
        };
      default:
        return {};
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint || (disabled ? 'Button is disabled' : 'Double tap to activate')}
      accessibilityRole={accessibilityRole}
      accessibilityState={{
        disabled,
        ...accessibilityState,
      }}
      testID={testID}
      style={[{ opacity: disabled ? 0.5 : 1 }]}
    >
      <GlassContainer
        intensity={intensity}
        blurType={blurType}
        style={[
          designStyles.glassButton,
          getVariantStyle(),
          disabled && designStyles.buttonDisabled,
          style,
        ]}
        accessible={false}
      >
        {children}
      </GlassContainer>
    </TouchableOpacity>
  );
};

/**
 * Typography Components
 * Consistent text styling with glassmorphism support
 */
interface GlassTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
  color?: 'primary' | 'secondary' | 'tertiary' | 'white' | 'accent';
  weight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold';
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

export const GlassText: React.FC<GlassTextProps> = ({
  variant = 'body',
  color = 'primary',
  weight = 'regular',
  style,
  children,
}) => {
  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'h1':
        return {
          fontSize: UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES['4XL'],
          lineHeight: UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES['4XL'] * UI_CONSTANTS.TYPOGRAPHY.LINE_HEIGHTS.TIGHT,
        };
      case 'h2':
        return {
          fontSize: UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES['3XL'],
          lineHeight: UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES['3XL'] * UI_CONSTANTS.TYPOGRAPHY.LINE_HEIGHTS.TIGHT,
        };
      case 'h3':
        return {
          fontSize: UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES['2XL'],
          lineHeight: UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES['2XL'] * UI_CONSTANTS.TYPOGRAPHY.LINE_HEIGHTS.TIGHT,
        };
      case 'body':
        return {
          fontSize: UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.MD,
          lineHeight: UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.MD * UI_CONSTANTS.TYPOGRAPHY.LINE_HEIGHTS.NORMAL,
        };
      case 'caption':
        return {
          fontSize: UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.SM,
          lineHeight: UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.SM * UI_CONSTANTS.TYPOGRAPHY.LINE_HEIGHTS.NORMAL,
        };
      case 'label':
        return {
          fontSize: UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.XS,
          lineHeight: UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.XS * UI_CONSTANTS.TYPOGRAPHY.LINE_HEIGHTS.NORMAL,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        };
      default:
        return {};
    }
  };

  const getColorStyle = (): TextStyle => {
    switch (color) {
      case 'primary':
        return { color: UI_CONSTANTS.COLORS.TEXT_PRIMARY };
      case 'secondary':
        return { color: UI_CONSTANTS.COLORS.TEXT_SECONDARY };
      case 'tertiary':
        return { color: UI_CONSTANTS.COLORS.TEXT_TERTIARY };
      case 'white':
        return { color: '#FFFFFF' };
      case 'accent':
        return { color: UI_CONSTANTS.COLORS.PRIMARY };
      default:
        return {};
    }
  };

  const getWeightStyle = (): TextStyle => {
    switch (weight) {
      case 'light':
        return { fontWeight: UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.LIGHT };
      case 'regular':
        return { fontWeight: UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.REGULAR };
      case 'medium':
        return { fontWeight: UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.MEDIUM };
      case 'semibold':
        return { fontWeight: UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.SEMIBOLD };
      case 'bold':
        return { fontWeight: UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.BOLD };
      default:
        return {};
    }
  };

  return (
    <Text
      style={[
        getVariantStyle(),
        getColorStyle(),
        getWeightStyle(),
        style,
      ]}
    >
      {children}
    </Text>
  );
};

/**
 * Glass Input Component
 * Text input with glassmorphism styling
 */
interface GlassInputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  style?: StyleProp<ViewStyle>;
  multiline?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  intensity?: GlassmorphismIntensity;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  placeholder,
  value,
  onChangeText,
  style,
  multiline = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  intensity = 'moderate',
}) => {
  return (
    <GlassContainer
      intensity={intensity}
      style={[
        designStyles.glassInput,
        multiline && designStyles.glassInputMultiline,
        style,
      ]}
    >
      <TextInput
        style={designStyles.glassInputText}
        placeholder={placeholder}
        placeholderTextColor={UI_CONSTANTS.COLORS.TEXT_TERTIARY}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </GlassContainer>
  );
};

/**
 * Health Indicator Component
 * Circular indicator for relationship health
 */
interface HealthIndicatorProps {
  score: number; // 1-10
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const HealthIndicator: React.FC<HealthIndicatorProps> = ({
  score,
  size = 'medium',
  showLabel = false,
  style,
}) => {
  const getSize = (): number => {
    switch (size) {
      case 'small': return 24;
      case 'medium': return 32;
      case 'large': return 48;
      default: return 32;
    }
  };

  const getColor = (): string => {
    if (score >= 8) return '#10B981'; // Green
    if (score >= 6) return '#F59E0B'; // Amber
    if (score >= 4) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const getLabel = (): string => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Attention';
  };

  const indicatorSize = getSize();

  return (
    <View style={[designStyles.healthIndicator, style]}>
      <View
        style={[
          designStyles.healthCircle,
          {
            width: indicatorSize,
            height: indicatorSize,
            borderRadius: indicatorSize / 2,
            backgroundColor: getColor(),
          },
        ]}
      >
        <GlassText
          variant="caption"
          color="white"
          weight="semibold"
          style={{ fontSize: indicatorSize * 0.3 }}
        >
          {score}
        </GlassText>
      </View>
      {showLabel && (
        <GlassText
          variant="caption"
          color="secondary"
          style={{ marginTop: UI_CONSTANTS.SPACING.XS }}
        >
          {getLabel()}
        </GlassText>
      )}
    </View>
  );
};

/**
 * Design System Styles
 */
const designStyles = StyleSheet.create({
  // Glass Container Base
  glassContainer: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.LG,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
  },

  // Glass Card
  glassCard: {
    padding: UI_CONSTANTS.SPACING.LG,
    marginVertical: UI_CONSTANTS.SPACING.SM,
  },

  // Elevation Effect
  elevated: {
    ...UI_CONSTANTS.SHADOWS.MD,
  },

  // Border Effect
  bordered: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Glass Button
  glassButton: {
    paddingVertical: UI_CONSTANTS.SPACING.MD,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.MD,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // iOS touch target minimum
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  // Glass Input
  glassInput: {
    paddingVertical: UI_CONSTANTS.SPACING.MD,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 44,
  },

  glassInputMultiline: {
    minHeight: 88,
    paddingTop: UI_CONSTANTS.SPACING.MD,
  },

  glassInputText: {
    fontSize: UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.MD,
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    fontWeight: UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.REGULAR,
    flex: 1,
  },

  // Health Indicator
  healthIndicator: {
    alignItems: 'center',
  },

  healthCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * Design System Theme Provider
 * Provides theme context for consistent styling
 */
interface ThemeContextType {
  glassmorphismIntensity: GlassmorphismIntensity;
  setGlassmorphismIntensity: (intensity: GlassmorphismIntensity) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [glassmorphismIntensity, setGlassmorphismIntensity] = React.useState<GlassmorphismIntensity>('moderate');
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  const contextValue: ThemeContextType = {
    glassmorphismIntensity,
    setGlassmorphismIntensity,
    isDarkMode,
    setIsDarkMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Export all design system components
 */
export default {
  GlassContainer,
  GlassCard,
  GlassButton,
  GlassText,
  GlassInput,
  HealthIndicator,
  ThemeProvider,
  useTheme,
};