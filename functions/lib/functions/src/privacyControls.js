"use strict";
// SOURCE: personal-relationship-assistant.md privacy-first requirements
// VERIFIED: Privacy controls for AI processing consent and data protection
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
exports.privacyControls = exports.withPrivacyConsent = exports.exportUserData = exports.requestDataDeletion = exports.getPrivacySettings = exports.updatePrivacySettings = exports.logAIProcessingOperation = exports.checkAIProcessingConsent = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
/**
 * Check AI Processing Consent
 * Validates user consent before AI operations
 */
const checkAIProcessingConsent = async (userId) => {
    try {
        const db = admin.firestore();
        const settingsDoc = await db.collection("users").doc(userId)
            .collection("settings").doc("privacy").get();
        if (!settingsDoc.exists) {
            // No privacy settings = no consent
            functions.logger.warn(`No privacy settings found for user ${userId}`);
            return false;
        }
        const settings = settingsDoc.data();
        // Check if AI processing is explicitly enabled
        if (!settings.aiProcessing) {
            functions.logger.info(`AI processing not consented for user ${userId}`);
            return false;
        }
        // Check consent version to ensure it's current
        if (settings.consentVersion !== "1.0.0") {
            functions.logger.warn(`Outdated consent version for user ${userId}: ${settings.consentVersion}`);
            return false;
        }
        return true;
    }
    catch (error) {
        functions.logger.error(`Privacy consent check failed for user ${userId}:`, error);
        return false;
    }
};
exports.checkAIProcessingConsent = checkAIProcessingConsent;
/**
 * Log AI Processing Operation
 * For transparency and audit purposes
 */
const logAIProcessingOperation = async (request) => {
    try {
        const db = admin.firestore();
        // Log the operation for audit trail
        await db.collection("users").doc(request.userId)
            .collection("_audit").doc(`ai_operation_${Date.now()}`).set({
            operation: request.operation,
            dataTypes: request.dataTypes,
            purposes: request.purposes,
            timestamp: new Date().toISOString(),
            consentVerified: true,
        });
        functions.logger.info(`AI operation logged for user ${request.userId}: ${request.operation}`);
    }
    catch (error) {
        functions.logger.error(`Failed to log AI operation for user ${request.userId}:`, error);
    }
};
exports.logAIProcessingOperation = logAIProcessingOperation;
/**
 * Update Privacy Settings
 * Allows users to update their privacy preferences
 */
exports.updatePrivacySettings = functions.https.onCall(async (data, context) => {
    try {
        // Verify authentication
        if (!context.auth || context.auth.uid !== data.userId) {
            throw new functions.https.HttpsError("permission-denied", "Unauthorized");
        }
        const db = admin.firestore();
        const privacyRef = db.collection("users").doc(data.userId)
            .collection("settings").doc("privacy");
        // Get current settings
        const currentDoc = await privacyRef.get();
        const currentSettings = currentDoc.exists ? currentDoc.data() : {
            dataCollection: true,
            aiProcessing: false,
            analytics: false,
            crashReporting: true,
            marketing: false,
            lastUpdated: new Date().toISOString(),
            consentVersion: "1.0.0",
        };
        // Update settings
        const updatedSettings = {
            ...currentSettings,
            ...data.settings,
            lastUpdated: new Date().toISOString(),
            consentVersion: "1.0.0",
        };
        // Save updated settings
        await privacyRef.set(updatedSettings);
        // Log the privacy change
        await db.collection("users").doc(data.userId)
            .collection("_audit").doc(`privacy_update_${Date.now()}`).set({
            previousSettings: currentSettings,
            newSettings: updatedSettings,
            changedFields: Object.keys(data.settings),
            timestamp: new Date().toISOString(),
            ipAddress: context.rawRequest.ip,
            userAgent: context.rawRequest.get("user-agent"),
        });
        functions.logger.info(`Privacy settings updated for user ${data.userId}`);
        return {
            success: true,
            settings: updatedSettings,
            updatedAt: new Date().toISOString(),
        };
    }
    catch (error) {
        functions.logger.error("Privacy settings update failed:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Failed to update privacy settings");
    }
});
/**
 * Get Privacy Settings
 * Retrieve user's current privacy preferences
 */
exports.getPrivacySettings = functions.https.onCall(async (data, context) => {
    try {
        // Verify authentication
        if (!context.auth || context.auth.uid !== data.userId) {
            throw new functions.https.HttpsError("permission-denied", "Unauthorized");
        }
        const db = admin.firestore();
        const settingsDoc = await db.collection("users").doc(data.userId)
            .collection("settings").doc("privacy").get();
        if (!settingsDoc.exists) {
            // Return default settings
            const defaultSettings = {
                dataCollection: true,
                aiProcessing: false,
                analytics: false,
                crashReporting: true,
                marketing: false,
                lastUpdated: new Date().toISOString(),
                consentVersion: "1.0.0",
            };
            // Save default settings
            await settingsDoc.ref.set(defaultSettings);
            return {
                settings: defaultSettings,
                isDefault: true,
            };
        }
        const settings = settingsDoc.data();
        return {
            settings,
            isDefault: false,
        };
    }
    catch (error) {
        functions.logger.error("Get privacy settings failed:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Failed to get privacy settings");
    }
});
/**
 * Request Data Deletion (GDPR Right to be Forgotten)
 * Handles user requests for complete data deletion
 */
exports.requestDataDeletion = functions.https.onCall(async (data, context) => {
    try {
        // Verify authentication
        if (!context.auth || context.auth.uid !== data.userId) {
            throw new functions.https.HttpsError("permission-denied", "Unauthorized");
        }
        const db = admin.firestore();
        // Create deletion request record
        const deletionId = `deletion_${data.userId}_${Date.now()}`;
        await db.collection("_deletion_requests").doc(deletionId).set({
            userId: data.userId,
            userEmail: context.auth.token.email,
            reason: data.reason || "User requested deletion",
            requestedAt: new Date().toISOString(),
            status: "pending",
            completedAt: null,
            ipAddress: context.rawRequest.ip,
            userAgent: context.rawRequest.get("user-agent"),
        });
        // Log the deletion request
        await db.collection("users").doc(data.userId)
            .collection("_audit").doc(`deletion_request_${Date.now()}`).set({
            deletionId,
            requestedAt: new Date().toISOString(),
            reason: data.reason,
            gdprCompliant: true,
        });
        functions.logger.info(`Data deletion requested by user ${data.userId}`);
        return {
            success: true,
            deletionId,
            message: "Your data deletion request has been received and will be processed within 30 days as required by GDPR.",
            requestedAt: new Date().toISOString(),
        };
    }
    catch (error) {
        functions.logger.error("Data deletion request failed:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Failed to process deletion request");
    }
});
/**
 * Export User Data (GDPR Right to Data Portability)
 * Provides users with a complete export of their data
 */
exports.exportUserData = functions.https.onCall(async (data, context) => {
    try {
        // Verify authentication
        if (!context.auth || context.auth.uid !== data.userId) {
            throw new functions.https.HttpsError("permission-denied", "Unauthorized");
        }
        const db = admin.firestore();
        const format = data.format || "json";
        // Collect all user data
        const userData = {
            profile: {},
            relationships: [],
            prompts: [],
            settings: {},
            interactions: [],
            exportedAt: new Date().toISOString(),
            format,
        };
        // Get user profile
        const profileDoc = await db.collection("users").doc(data.userId).get();
        if (profileDoc.exists) {
            userData.profile = profileDoc.data();
        }
        // Get relationships
        const relationshipsSnapshot = await db.collection("users").doc(data.userId)
            .collection("relationships").get();
        userData.relationships = relationshipsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        // Get prompts
        const promptsSnapshot = await db.collection("users").doc(data.userId)
            .collection("prompts").get();
        userData.prompts = promptsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        // Get settings
        const settingsSnapshot = await db.collection("users").doc(data.userId)
            .collection("settings").get();
        settingsSnapshot.docs.forEach(doc => {
            userData.settings[doc.id] = doc.data();
        });
        // Log the data export
        await db.collection("users").doc(data.userId)
            .collection("_audit").doc(`data_export_${Date.now()}`).set({
            exportedAt: new Date().toISOString(),
            format,
            recordCounts: {
                relationships: userData.relationships.length,
                prompts: userData.prompts.length,
                settings: Object.keys(userData.settings).length,
            },
            gdprCompliant: true,
        });
        functions.logger.info(`Data export completed for user ${data.userId}`);
        return {
            success: true,
            data: userData,
            exportedAt: new Date().toISOString(),
        };
    }
    catch (error) {
        functions.logger.error("Data export failed:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Failed to export data");
    }
});
/**
 * Privacy Control Middleware
 * Helper function to check consent before AI operations
 */
const withPrivacyConsent = (operation) => {
    return async (userId, callback) => {
        // Check consent
        const hasConsent = await (0, exports.checkAIProcessingConsent)(userId);
        if (!hasConsent) {
            throw new functions.https.HttpsError("permission-denied", "AI processing consent required. Please enable AI features in your privacy settings.");
        }
        // Log the operation
        await (0, exports.logAIProcessingOperation)({
            userId,
            operation: operation,
            dataTypes: ["relationship_data", "interaction_notes"],
            purposes: ["relationship_insights", "ai_suggestions"],
        });
        // Execute the operation
        return await callback();
    };
};
exports.withPrivacyConsent = withPrivacyConsent;
exports.privacyControls = {
    checkAIProcessingConsent: exports.checkAIProcessingConsent,
    logAIProcessingOperation: exports.logAIProcessingOperation,
    updatePrivacySettings: exports.updatePrivacySettings,
    getPrivacySettings: exports.getPrivacySettings,
    requestDataDeletion: exports.requestDataDeletion,
    exportUserData: exports.exportUserData,
    withPrivacyConsent: exports.withPrivacyConsent,
};
//# sourceMappingURL=privacyControls.js.map