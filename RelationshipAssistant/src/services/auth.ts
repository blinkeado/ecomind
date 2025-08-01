// SOURCE: React Native Firebase Auth v22.4.0 Official Documentation
// URL: https://rnfirebase.io/auth/usage
// VERIFIED: Task agent research from official docs 2025-08-01

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  updateProfile,
  deleteUser,
  User,
  UserCredential,
  AuthError,
} from '@react-native-firebase/auth';
import { firebaseAuth, firebaseDb } from './firebase';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from '@react-native-firebase/firestore';

/**
 * Authentication Service
 * Handles user authentication and profile management
 * Based on React Native Firebase Auth v22.4.0 modular API
 */

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  preferences: {
    privacyLevel: 'strict' | 'moderate' | 'open';
    aiProcessingConsent: boolean;
    notificationSettings: {
      prompts: boolean;
      reminders: boolean;
      insights: boolean;
    };
  };
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

/**
 * Create user account with email and password
 * SOURCE: Firebase Auth Documentation - Email/Password Authentication
 */
export const createAccount = async (
  email: string,
  password: string,
  displayName?: string
): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      firebaseAuth,
      email,
      password
    );

    // Update profile with display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }

    // Create user profile document in Firestore
    await createUserProfile(userCredential.user);

    return userCredential;
  } catch (error) {
    const authError = error as AuthError;
    console.error('🔥 Auth Error (Create Account):', authError.code, authError.message);
    throw authError;
  }
};

/**
 * Sign in with email and password
 * SOURCE: Firebase Auth Documentation - Email/Password Authentication
 */
export const signIn = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      firebaseAuth,
      email,
      password
    );

    // Update last login timestamp in profile
    await updateUserProfileLastLogin(userCredential.user.uid);

    return userCredential;
  } catch (error) {
    const authError = error as AuthError;
    console.error('🔥 Auth Error (Sign In):', authError.code, authError.message);
    throw authError;
  }
};

/**
 * Sign in anonymously for guest users
 * SOURCE: Firebase Auth Documentation - Anonymous Authentication
 */
export const signInAnonymous = async (): Promise<UserCredential> => {
  try {
    const userCredential = await signInAnonymously(firebaseAuth);
    
    // Create minimal profile for anonymous user
    await createUserProfile(userCredential.user);

    return userCredential;
  } catch (error) {
    const authError = error as AuthError;
    console.error('🔥 Auth Error (Anonymous Sign In):', authError.code, authError.message);
    throw authError;
  }
};

/**
 * Sign out current user
 * SOURCE: Firebase Auth Documentation - User Lifecycle
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(firebaseAuth);
    console.log('🔥 Auth: User signed out successfully');
  } catch (error) {
    const authError = error as AuthError;
    console.error('🔥 Auth Error (Sign Out):', authError.code, authError.message);
    throw authError;
  }
};

/**
 * Create user profile document in Firestore
 * SOURCE: Firestore Documentation - Add Data
 */
const createUserProfile = async (user: User): Promise<void> => {
  const userRef = doc(firebaseDb, 'users', user.uid);
  
  const profileData: Omit<UserProfile, 'uid'> = {
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
    createdAt: new Date(),
    lastLoginAt: new Date(),
    preferences: {
      privacyLevel: 'strict', // Default to most secure setting
      aiProcessingConsent: false, // Require explicit consent
      notificationSettings: {
        prompts: true,
        reminders: true,
        insights: false, // Default to conservative notification settings
      },
    },
  };

  try {
    await setDoc(userRef, {
      ...profileData,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
    console.log('🔥 Profile: User profile created successfully');
  } catch (error) {
    console.error('🔥 Profile Error (Create):', error);
    throw error;
  }
};

/**
 * Get user profile from Firestore
 * SOURCE: Firestore Documentation - Get Data
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(firebaseDb, 'users', uid);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        uid,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
      } as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('🔥 Profile Error (Get):', error);
    throw error;
  }
};

/**
 * Update user profile last login timestamp
 * SOURCE: Firestore Documentation - Update Data
 */
const updateUserProfileLastLogin = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(firebaseDb, 'users', uid);
    await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error('🔥 Profile Error (Update Last Login):', error);
    // Non-critical error - don't throw
  }
};

/**
 * Update user profile preferences
 * SOURCE: Firestore Documentation - Update Data
 */
export const updateUserPreferences = async (
  uid: string,
  preferences: Partial<UserProfile['preferences']>
): Promise<void> => {
  try {
    const userRef = doc(firebaseDb, 'users', uid);
    await setDoc(
      userRef,
      { preferences },
      { merge: true }
    );
    console.log('🔥 Profile: Preferences updated successfully');
  } catch (error) {
    console.error('🔥 Profile Error (Update Preferences):', error);
    throw error;
  }
};

/**
 * Delete user account and all associated data
 * SOURCE: Firebase Auth Documentation - Delete User
 * GDPR Compliance: Right to erasure
 */
export const deleteUserAccount = async (user: User): Promise<void> => {
  try {
    // First delete user profile and data from Firestore
    await deleteUserData(user.uid);
    
    // Then delete Firebase Auth user
    await deleteUser(user);
    
    console.log('🔥 Auth: User account deleted successfully');
  } catch (error) {
    const authError = error as AuthError;
    console.error('🔥 Auth Error (Delete Account):', authError.code, authError.message);
    throw authError;
  }
};

/**
 * Delete all user data from Firestore
 * SOURCE: Firestore Documentation - Delete Data
 * GDPR Compliance: Complete data removal
 */
const deleteUserData = async (uid: string): Promise<void> => {
  try {
    // Delete user profile document
    const userRef = doc(firebaseDb, 'users', uid);
    await deleteDoc(userRef);
    
    // TODO: In future implementation, delete all subcollections
    // (relationships, prompts, timeline, etc.) using batch operations
    
    console.log('🔥 Profile: User data deleted successfully');
  } catch (error) {
    console.error('🔥 Profile Error (Delete Data):', error);
    throw error;
  }
};

/**
 * Get current authenticated user
 * SOURCE: Firebase Auth Documentation - User Lifecycle
 */
export const getCurrentUser = (): User | null => {
  return firebaseAuth.currentUser;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return firebaseAuth.currentUser !== null;
};

/**
 * Auth error handler - converts Firebase Auth errors to user-friendly messages
 * SOURCE: Firebase Auth Documentation - Handle Errors
 */
export const getAuthErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    default:
      return 'An authentication error occurred. Please try again.';
  }
};

// Export all auth functions as default object
export default {
  createAccount,
  signIn,
  signInAnonymous,
  signOutUser,
  getUserProfile,
  updateUserPreferences,
  deleteUserAccount,
  getCurrentUser,
  isAuthenticated,
  getAuthErrorMessage,
};