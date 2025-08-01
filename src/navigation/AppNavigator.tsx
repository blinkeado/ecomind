// SOURCE: React Navigation 6 Official Documentation + Phase 5 main screens implementation
// VERIFIED: Complete navigation system with tabs and stacks for EcoMind app

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GlassText } from '../components/design/DesignSystem';
import { useAuth } from '../hooks/useAuth';
import { PromptsProvider } from '../hooks/usePrompts';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import PersonScreen from '../screens/PersonScreen';
import PromptsScreen from '../screens/PromptsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ConsentScreen from '../screens/ConsentScreen';
import PrivacyImpactScreen from '../screens/PrivacyImpactScreen';
import { UI_CONSTANTS } from '../utils/constants';

/**
 * Navigation Type Definitions
 */
export type RootStackParamList = {
  // Authentication Stack
  Onboarding: undefined;
  Consent: {
    requiredPermissions?: string[];
    onComplete?: (granted: boolean) => void;
    mode?: 'initial' | 'feature_specific';
  };
  
  // Main App Stack
  MainTabs: undefined;
  Person: { 
    personId?: string; 
    mode?: 'view' | 'edit' | 'create' 
  };
  PrivacyImpact: undefined;
};

export type TabParamList = {
  Home: undefined;
  Prompts: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

/**
 * Loading Screen Component
 */
const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={UI_CONSTANTS.COLORS.PRIMARY} />
    <GlassText variant="body" color="secondary" style={styles.loadingText}>
      Loading...
    </GlassText>
  </View>
);

/**
 * Main Tab Navigator
 * Bottom tab navigation for main app screens
 */
const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          elevation: 0,
          shadowOpacity: 0,
          paddingBottom: 5,
          paddingTop: 5,
          height: 65,
        },
        tabBarActiveTintColor: UI_CONSTANTS.COLORS.PRIMARY,
        tabBarInactiveTintColor: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
        tabBarLabelStyle: {
          fontSize: UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.XS,
          fontWeight: UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.MEDIUM,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <GlassText 
              variant="body" 
              style={{ color, fontSize: size + 2 }}
              accessible={false}
            >
              🏠
            </GlassText>
          ),
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      <Tab.Screen
        name="Prompts"
        component={PromptsScreen}
        options={{
          tabBarLabel: 'Suggestions',
          tabBarIcon: ({ color, size }) => (
            <GlassText 
              variant="body" 
              style={{ color, fontSize: size + 2 }}
              accessible={false}
            >
              💡
            </GlassText>
          ),
          tabBarAccessibilityLabel: 'AI suggestions tab',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <GlassText 
              variant="body" 
              style={{ color, fontSize: size + 2 }}
              accessible={false}
            >
              ⚙️
            </GlassText>
          ),
          tabBarAccessibilityLabel: 'Settings tab',
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * Authentication Stack Navigator
 */
const AuthStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      gestureEnabled: false,
      cardStyle: {
        backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND_PRIMARY,
      },
    }}
  >
    <Stack.Screen 
      name="Onboarding" 
      component={OnboardingScreen}
      options={{
        title: 'Welcome to EcoMind',
      }}
    />
    <Stack.Screen 
      name="Consent" 
      component={ConsentScreen}
      options={{
        title: 'Privacy Consent',
        headerBackTitle: 'Back',
      }}
    />
  </Stack.Navigator>
);

/**
 * Main App Stack Navigator
 */
const MainStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
      headerTitleStyle: {
        color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
        fontSize: UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.LG,
        fontWeight: UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.SEMIBOLD,
      },
      headerBackTitleVisible: false,
      cardStyle: {
        backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND_PRIMARY,
      },
      animation: 'slide_from_right',
    }}
  >
    <Stack.Screen 
      name="MainTabs" 
      component={MainTabs} 
      options={{ 
        headerShown: false,
      }}
    />
    <Stack.Screen 
      name="Person" 
      component={PersonScreen} 
      options={({ route }) => {
        const { mode } = route.params || {};
        return {
          title: mode === 'create' ? 'Add Person' : 'Person Details',
          headerBackTitle: 'Back',
          headerTitleAlign: 'center',
        };
      }}
    />
    <Stack.Screen 
      name="PrivacyImpact" 
      component={PrivacyImpactScreen} 
      options={{
        title: 'Privacy Impact',
        headerBackTitle: 'Back',
        headerTitleAlign: 'center',
      }}
    />
  </Stack.Navigator>
);

/**
 * Root App Navigator
 * Switches between auth and main app based on auth state
 */
const AppNavigator: React.FC = () => {
  const { isAuthenticated, loading, profile } = useAuth();

  // Show loading screen while determining auth state
  if (loading) {
    return <LoadingScreen />;
  }

  // Show onboarding for unauthenticated users or incomplete onboarding
  if (!isAuthenticated || !profile?.isOnboardingComplete) {
    return <AuthStack />;
  }

  // Show main app for authenticated users with complete onboarding
  // Wrap with PromptsProvider for AI prompt state management
  return (
    <PromptsProvider>
      <MainStack />
    </PromptsProvider>
  );
};

/**
 * Navigation Container Wrapper
 * Provides navigation context to the entire app
 */
const AppNavigationContainer: React.FC = () => (
  <NavigationContainer>
    <AppNavigator />
  </NavigationContainer>
);

/**
 * Navigation Container Styles
 */
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND_PRIMARY,
  },
  
  loadingText: {
    marginTop: UI_CONSTANTS.SPACING.MD,
    textAlign: 'center',
  },
});

export default AppNavigationContainer;