"use strict";
// SOURCE: IMPLEMENTATION_PLAN.md line 85 + user management requirements
// VERIFIED: User profile management and lifecycle functions
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userManagement = exports.updateUserStats = exports.getUserProfile = exports.updateUserProfile = exports.onUserDelete = exports.onUserCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const identity_1 = require("firebase-functions/v2/identity");
const admin = __importStar(require("firebase-admin"));
/**
 * Create User Profile on Registration
 * Triggered when a new user signs up
 */
exports.onUserCreate = (0, identity_1.onUserCreated)(async (event) => {
    const user = event.data;
    try {
        const db = admin.firestore();
        // Create default user profile
        const userProfile = {
            uid: user.uid,
            email: user.email || undefined,
            displayName: user.displayName || undefined,
            photoURL: user.photoURL || undefined,
            createdAt: new Date().toISOString(),
            preferences: {
                theme: "auto",
                notifications: {
                    prompts: true,
                    reminders: true,
                    insights: false, // Opt-in for insights
                },
                privacy: {
                    dataCollection: true, // Required for basic functionality
                    aiProcessing: false, // Opt-in for AI features
                    analytics: false, // Opt-in for analytics
                },
            },
            subscription: {
                tier: "free",
                features: [
                    "basic_relationships",
                    "manual_interactions",
                    "basic_reminders"
                ],
            },
            stats: {
                totalRelationships: 0,
                totalInteractions: 0,
                lastActiveAt: new Date().toISOString(),
            },
        };
        // Store user profile
        await db.collection("users").doc(user.uid).set(userProfile);
        // Create default collections
        await Promise.all([
            // Initialize empty relationships collection
            db.collection("users").doc(user.uid).collection("relationships").doc("_placeholder").set({
                _placeholder: true,
                createdAt: new Date().toISOString(),
            }),
            // Initialize empty prompts collection
            db.collection("users").doc(user.uid).collection("prompts").doc("_placeholder").set({
                _placeholder: true,
                createdAt: new Date().toISOString(),
            }),
            // Initialize settings document
            db.collection("users").doc(user.uid).collection("settings").doc("privacy").set({
                dataCollection: true,
                aiProcessing: false,
                analytics: false,
                lastUpdated: new Date().toISOString(),
                version: "1.0.0",
            }),
        ]);
        // Log successful user creation
        functions.logger.info(`User profile created for ${user.uid}`, {
            email: user.email,
            displayName: user.displayName,
        });
        // Send welcome analytics (if analytics enabled in the future)
        // await logEvent("user_created", { uid: user.uid });
    }
    catch (error) {
        functions.logger.error(`Failed to create user profile for ${user.uid}:`, error);
        // Don't throw - user should still be created in Auth even if profile creation fails
        // The app can handle missing profiles gracefully
    }
});
/**
 * Clean Up User Data on Account Deletion
 * Triggered when a user deletes their account
 */
exports.onUserDelete = (0, identity_1.onUserDeleted)(async (event) => {
    const user = event.data;
    try {
        const db = admin.firestore();
        const batch = db.batch();
        functions.logger.info(`Starting data cleanup for deleted user ${user.uid}`);
        // Get user document reference
        const userRef = db.collection("users").doc(user.uid);
        // Delete user profile
        batch.delete(userRef);
        // Get all subcollections to delete
        const subcollections = [
            "relationships",
            "prompts",
            "settings",
            "insights",
            "contextExtractions",
            "sentimentAnalyses",
        ];
        // Delete all documents in each subcollection
        for (const subcollection of subcollections) {
            const collectionRef = userRef.collection(subcollection);
            const snapshot = await collectionRef.get();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            functions.logger.info(`Queued ${snapshot.docs.length} documents from ${subcollection} for deletion`);
        }
        // Execute batch delete
        await batch.commit();
        functions.logger.info(`Successfully cleaned up data for deleted user ${user.uid}`);
        // Log deletion event for compliance tracking
        await db.collection("_audit").doc(`user_deletion_${user.uid}_${Date.now()}`).set({
            uid: user.uid,
            email: user.email,
            deletedAt: new Date().toISOString(),
            dataCleanupCompleted: true,
            gdprCompliant: true,
        });
    }
    catch (error) {
        functions.logger.error(`Failed to cleanup data for deleted user ${user.uid}:`, error);
        // Log the failure for manual cleanup if needed
        await admin.firestore().collection("_audit").doc(`user_deletion_failed_${user.uid}_${Date.now()}`).set({
            uid: user.uid,
            email: user.email,
            deletedAt: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Unknown error",
            dataCleanupCompleted: false,
            requiresManualCleanup: true,
        });
    }
});
/**
 * Update User Profile
 * Allows users to update their profile information and preferences
 */
exports.updateUserProfile = functions.https.onCall(async (data, context) => {
    try {
        // Verify authentication
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
        }
        if (context.auth.uid !== data.userId) {
            throw new functions.https.HttpsError("permission-denied", "User can only update their own profile");
        }
        // Validate updates
        if (!data.updates || Object.keys(data.updates).length === 0) {
            throw new functions.https.HttpsError("invalid-argument", "No updates provided");
        }
        const db = admin.firestore();
        const userRef = db.collection("users").doc(data.userId);
        // Get current profile
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError("not-found", "User profile not found");
        }
        const currentProfile = userDoc.data();
        // Sanitize and validate updates
        const sanitizedUpdates = sanitizeProfileUpdates(data.updates, currentProfile);
        // Add metadata
        const updatesWithMetadata = {
            ...sanitizedUpdates,
            lastUpdatedAt: new Date().toISOString(),
        };
        // Update profile
        await userRef.update(updatesWithMetadata);
        // Update stats
        await userRef.update({
            "stats.lastActiveAt": new Date().toISOString(),
        });
        // Log the update
        functions.logger.info(`Profile updated for user ${data.userId}`, {
            updatedFields: Object.keys(sanitizedUpdates),
        });
        // Return updated profile (excluding sensitive data)
        const updatedDoc = await userRef.get();
        const updatedProfile = updatedDoc.data();
        return {
            success: true,
            profile: sanitizeProfileForClient(updatedProfile),
            updatedAt: new Date().toISOString(),
        };
    }
    catch (error) {
        functions.logger.error("Profile update failed:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Failed to update profile");
    }
});
/**
 * Get User Profile
 * Retrieve user profile information
 */
exports.getUserProfile = functions.https.onCall(async (data, context) => {
    try {
        // Verify authentication
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
        }
        if (context.auth.uid !== data.userId) {
            throw new functions.https.HttpsError("permission-denied", "User can only access their own profile");
        }
        const db = admin.firestore();
        const userDoc = await db.collection("users").doc(data.userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError("not-found", "User profile not found");
        }
        const profile = userDoc.data();
        // Update last active timestamp
        await userDoc.ref.update({
            "stats.lastActiveAt": new Date().toISOString(),
        });
        return {
            profile: sanitizeProfileForClient(profile),
            retrievedAt: new Date().toISOString(),
        };
    }
    catch (error) {
        functions.logger.error("Get profile failed:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Failed to get profile");
    }
});
/**
 * Update User Statistics
 * Internal function to update user activity stats
 */
exports.updateUserStats = functions.https.onCall(async (data, context) => {
    try {
        // Verify authentication
        if (!context.auth || context.auth.uid !== data.userId) {
            throw new functions.https.HttpsError("permission-denied", "Unauthorized");
        }
        const db = admin.firestore();
        const userRef = db.collection("users").doc(data.userId);
        const updates = {};
        if (data.stats.relationshipsChange !== undefined) {
            updates["stats.totalRelationships"] = admin.firestore.FieldValue.increment(data.stats.relationshipsChange);
        }
        if (data.stats.interactionsChange !== undefined) {
            updates["stats.totalInteractions"] = admin.firestore.FieldValue.increment(data.stats.interactionsChange);
        }
        if (data.stats.lastActiveAt) {
            updates["stats.lastActiveAt"] = data.stats.lastActiveAt;
        }
        await userRef.update(updates);
        return { success: true, updatedAt: new Date().toISOString() };
    }
    catch (error) {
        functions.logger.error("Stats update failed:", error);
        throw error instanceof functions.https.HttpsError ? error :
            new functions.https.HttpsError("internal", "Failed to update stats");
    }
});
/**
 * Sanitize Profile Updates
 * Ensures only allowed fields are updated and values are valid
 */
function sanitizeProfileUpdates(updates, currentProfile) {
    const sanitized = {};
    // Allowed fields for client updates
    const allowedFields = [
        "displayName",
        "photoURL",
        "preferences",
    ];
    allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
            sanitized[field] = updates[field];
        }
    });
    // Special handling for preferences
    if (updates.preferences) {
        sanitized.preferences = {
            ...currentProfile.preferences,
            ...updates.preferences,
        };
        // Validate preference values
        if (sanitized.preferences.theme && !["light", "dark", "auto"].includes(sanitized.preferences.theme)) {
            sanitized.preferences.theme = "auto";
        }
    }
    // Validate display name
    if (sanitized.displayName) {
        sanitized.displayName = sanitized.displayName.trim().substring(0, 100);
    }
    return sanitized;
}
/**
 * Sanitize Profile for Client
 * Removes sensitive information before sending to client
 */
function sanitizeProfileForClient(profile) {
    const sanitized = { ...profile };
    // Remove sensitive fields if needed
    // (Currently all fields are safe to send to the client)
    return sanitized;
}
exports.userManagement = {
    onUserCreate: exports.onUserCreate,
    onUserDelete: exports.onUserDelete,
    updateUserProfile: exports.updateUserProfile,
    getUserProfile: exports.getUserProfile,
    updateUserStats: exports.updateUserStats,
};
//# sourceMappingURL=userManagement.js.map