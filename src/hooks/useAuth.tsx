// SOURCE: React Native Firebase Auth Official Documentation + React Hooks Best Practices
// URL: https://rnfirebase.io/auth/usage#listening-to-authentication-state
// VERIFIED: Official React Native Firebase v22.4.0 patterns

import React, { 
  useState, 
  useEffect, 
  useContext, 
  createContext, 
  ReactNode,
  useCallback 
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { User } from '@react-native-firebase/auth';
import { firebaseAuth } from '../services/firebase';
import authService from '../services/auth';
import { 
  AuthState, 
  UserProfile, 
  UserProfileUpdate,
  DEFAULT_USER_PREFERENCES 
} from '../types/user';

/**
 * Authentication Context Interface
 * Provides authentication state and methods throughout the app
 */
interface AuthContextValue extends AuthState {
  // Authentication Methods
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInAnonymous: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  
  // Profile Methods
  updateProfile: (updates: UserProfileUpdate) => Promise<void>;
  refreshProfile: () => Promise<void>;
  
  // Utility Methods
  isOwner: (userId: string) => boolean;
  
  // Offline State
  isOnline: boolean;
  appState: AppStateStatus;
}

/**
 * Authentication Context
 * SOURCE: React Context Official Documentation
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Authentication Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * Manages authentication state and provides auth methods to child components
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Authentication State
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    profileLoading: false,
    error: null,
    profileError: null,
    isAuthenticated: false,
    isAnonymous: false,
    isEmailVerified: false,
  });

  // Offline State Management
  // SOURCE: React Native AppState Documentation
  const [isOnline, setIsOnline] = useState(true);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  /**
   * Load user profile from Firestore
   * SOURCE: Firestore Documentation - Real-time Updates
   */
  const loadUserProfile = useCallback(async (user: User): Promise<void> => {
    setAuthState(prev => ({ ...prev, profileLoading: true, profileError: null }));
    
    try {
      const profile = await authService.getUserProfile(user.uid);
      
      if (profile) {
        setAuthState(prev => ({
          ...prev,
          profile,
          profileLoading: false,
        }));
      } else {
        // Profile doesn't exist - this shouldn't happen but handle gracefully
        console.warn('🔥 Auth: User profile not found, creating new profile');
        // Profile creation is handled in auth service during signup
        setAuthState(prev => ({
          ...prev,
          profileLoading: false,
          profileError: 'Profile not found',
        }));
      }
    } catch (error) {
      console.error('🔥 Auth Error (Load Profile):', error);
      setAuthState(prev => ({
        ...prev,
        profileLoading: false,
        profileError: error instanceof Error ? error.message : 'Failed to load profile',
      }));
    }
  }, []);

  /**
   * App State Listener for Offline Detection
   * SOURCE: React Native AppState Documentation
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('📱 App State Changed:', nextAppState);
      setAppState(nextAppState);
      
      // Basic online/offline detection based on app state
      // When app becomes active, assume online; when background, assume potentially offline
      if (nextAppState === 'active') {
        setIsOnline(true);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => subscription?.remove();
  }, []);

  /**
   * Firebase Connection State Monitoring
   * SOURCE: Firebase Firestore Documentation - Offline Support
   */
  useEffect(() => {
    if (!authState.user) return;

    // Monitor Firebase connection state through a minimal document listener
    const unsubscribe = firebaseAuth.app.firestore()
      .collection('_connection')
      .doc('test')
      .onSnapshot(
        (snapshot) => {
          // If we receive data from cache only, we're likely offline
          const isFromCache = snapshot.metadata.fromCache;
          setIsOnline(!isFromCache);
        },
        (error) => {
          console.warn('🔥 Connection monitor error:', error);
          setIsOnline(false);
        }
      );

    return unsubscribe;
  }, [authState.user]);

  /**
   * Authentication State Listener
   * SOURCE: React Native Firebase Auth Documentation - Listening to Authentication State
   */
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
      console.log('🔥 Auth State Changed:', user ? `User: ${user.uid}` : 'No user');
      
      if (user) {
        // User is signed in
        setAuthState(prev => ({
          ...prev,
          user,
          loading: false,
          error: null,
          isAuthenticated: true,
          isAnonymous: user.isAnonymous,
          isEmailVerified: user.emailVerified,
        }));
        
        // Load user profile
        await loadUserProfile(user);
      } else {
        // User is signed out
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          profileLoading: false,
          error: null,
          profileError: null,
          isAuthenticated: false,
          isAnonymous: false,
          isEmailVerified: false,
        });
      }
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [loadUserProfile]);

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await authService.signIn(email, password);
      // Auth state will be updated by the onAuthStateChanged listener
    } catch (error) {
      const errorMessage = authService.getAuthErrorMessage(error as any);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    displayName?: string
  ): Promise<void> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await authService.createAccount(email, password, displayName);
      // Auth state will be updated by the onAuthStateChanged listener
    } catch (error) {
      const errorMessage = authService.getAuthErrorMessage(error as any);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Sign in anonymously
   */
  const signInAnonymous = useCallback(async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await authService.signInAnonymous();
      // Auth state will be updated by the onAuthStateChanged listener
    } catch (error) {
      const errorMessage = authService.getAuthErrorMessage(error as any);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Sign out current user
   */
  const signOut = useCallback(async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await authService.signOutUser();
      // Auth state will be updated by the onAuthStateChanged listener
    } catch (error) {
      const errorMessage = authService.getAuthErrorMessage(error as any);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Delete user account
   */
  const deleteAccount = useCallback(async (): Promise<void> => {
    if (!authState.user) {
      throw new Error('No user to delete');
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await authService.deleteUserAccount(authState.user);
      // Auth state will be updated by the onAuthStateChanged listener
    } catch (error) {
      const errorMessage = authService.getAuthErrorMessage(error as any);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [authState.user]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates: UserProfileUpdate): Promise<void> => {
    if (!authState.user) {
      throw new Error('No authenticated user');
    }

    setAuthState(prev => ({ ...prev, profileLoading: true, profileError: null }));
    
    try {
      // Update preferences if provided
      if (updates.preferences) {
        await authService.updateUserPreferences(authState.user.uid, updates.preferences);
      }
      
      // Refresh profile to get updated data
      await loadUserProfile(authState.user);
    } catch (error) {
      console.error('🔥 Auth Error (Update Profile):', error);
      setAuthState(prev => ({
        ...prev,
        profileLoading: false,
        profileError: error instanceof Error ? error.message : 'Failed to update profile',
      }));
      throw error;
    }
  }, [authState.user, loadUserProfile]);

  /**
   * Refresh user profile from Firestore
   */
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!authState.user) {
      return;
    }
    
    await loadUserProfile(authState.user);
  }, [authState.user, loadUserProfile]);

  /**
   * Check if current user is the owner of a resource
   */
  const isOwner = useCallback((userId: string): boolean => {
    return authState.user?.uid === userId;
  }, [authState.user]);

  // Context value
  const contextValue: AuthContextValue = {
    ...authState,
    signIn,
    signUp,
    signInAnonymous,
    signOut,
    deleteAccount,
    updateProfile,
    refreshProfile,
    isOwner,
    isOnline,
    appState,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 * Custom hook to access authentication context
 * SOURCE: React Hooks Official Documentation
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Higher-Order Component for Protected Routes
 * Ensures user is authenticated before rendering children
 */
interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return fallback;
  }
  
  if (!isAuthenticated) {
    return fallback;
  }
  
  return <>{children}</>;
};

/**
 * Hook for authentication loading state
 * Useful for showing loading indicators during auth operations
 */
export const useAuthLoading = () => {
  const { loading, profileLoading } = useAuth();
  return loading || profileLoading;
};

/**
 * Hook for checking if user has completed onboarding
 */
export const useOnboardingStatus = () => {
  const { profile } = useAuth();
  return {
    isOnboardingComplete: profile?.isOnboardingComplete ?? false,
    profile,
  };
};

export default useAuth;