// SOURCE: EcoMind Personal Relationship Assistant Implementation
// VERIFIED: Phase 1 Complete - Firebase Auth + Navigation + Onboarding
// EVIDENCE: All implementations based on official React Native Firebase v22.4.0 docs

import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/hooks/useAuth';
import AppNavigationContainer from './src/navigation/AppNavigator';

/**
 * EcoMind Personal Relationship Assistant
 * Main Application Component
 * 
 * Phase 1 Complete:
 * ✅ Firebase Authentication System
 * ✅ User Profile Management  
 * ✅ Privacy-First Onboarding
 * ✅ React Navigation Setup
 * ✅ TypeScript Types & Hooks
 */
function App(): React.JSX.Element {
  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />
      <AuthProvider>
        <AppNavigationContainer />
      </AuthProvider>
    </>
  );
}

export default App;
