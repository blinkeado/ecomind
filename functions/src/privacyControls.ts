// SOURCE: personal-relationship-assistant.md privacy-first requirements
// VERIFIED: Privacy controls for AI processing consent and data protection

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Privacy Control Types
 */
interface PrivacySettings {
  dataCollection: boolean;
  aiProcessing: boolean;
  analytics: boolean;
  crashReporting: boolean;
  marketing: boolean;
  lastUpdated: string;
  consentVersion: string;
}

interface AIProcessingRequest {
  userId: string;
  operation: 'prompt_generation' | 'context_extraction' | 'sentiment_analysis' | 'insights_generation';
  dataTypes: string[];
  purposes: string[];
}

/**
 * Check AI Processing Consent
 * Validates user consent before AI operations
 */
export const checkAIProcessingConsent = async (userId: string): Promise<boolean> => {
  try {
    const db = admin.firestore();
    const settingsDoc = await db.collection("users").doc(userId)
      .collection("settings").doc("privacy").get();
    
    if (!settingsDoc.exists) {
      // No privacy settings = no consent
      functions.logger.warn(`No privacy settings found for user ${userId}`);
      return false;
    }
    
    const settings = settingsDoc.data() as PrivacySettings;
    
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
  } catch (error) {
    functions.logger.error(`Privacy consent check failed for user ${userId}:`, error);
    return false;
  }
};

/**
 * Log AI Processing Operation
 * For transparency and audit purposes
 */
export const logAIProcessingOperation = async (request: AIProcessingRequest): Promise<void> => {
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
  } catch (error) {
    functions.logger.error(`Failed to log AI operation for user ${request.userId}:`, error);
  }
};

/**
 * Update Privacy Settings
 * Allows users to update their privacy preferences
 */
export const updatePrivacySettings = functions.https.onCall(async (data: {
  userId: string;
  settings: Partial<PrivacySettings>;
}, context) => {
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
    const currentSettings = currentDoc.exists ? currentDoc.data() as PrivacySettings : {
      dataCollection: true,
      aiProcessing: false,
      analytics: false,
      crashReporting: true,
      marketing: false,
      lastUpdated: new Date().toISOString(),
      consentVersion: "1.0.0",
    };
    
    // Update settings
    const updatedSettings: PrivacySettings = {
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
    
  } catch (error) {
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
export const getPrivacySettings = functions.https.onCall(async (data: {
  userId: string;
}, context) => {
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
      const defaultSettings: PrivacySettings = {
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
    
    const settings = settingsDoc.data() as PrivacySettings;
    
    return {
      settings,
      isDefault: false,
    };
    
  } catch (error) {
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
export const requestDataDeletion = functions.https.onCall(async (data: {
  userId: string;
  reason?: string;
}, context) => {
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
    
  } catch (error) {
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
export const exportUserData = functions.https.onCall(async (data: {
  userId: string;
  format?: "json" | "csv";
}, context) => {
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
    
  } catch (error) {
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
export const withPrivacyConsent = (operation: string) => {
  return async (userId: string, callback: () => Promise<any>) => {
    // Check consent
    const hasConsent = await checkAIProcessingConsent(userId);
    
    if (!hasConsent) {
      throw new functions.https.HttpsError(
        "permission-denied", 
        "AI processing consent required. Please enable AI features in your privacy settings."
      );
    }
    
    // Log the operation
    await logAIProcessingOperation({
      userId,
      operation: operation as any,
      dataTypes: ["relationship_data", "interaction_notes"],
      purposes: ["relationship_insights", "ai_suggestions"],
    });
    
    // Execute the operation
    return await callback();
  };
};

export const privacyControls = {
  checkAIProcessingConsent,
  logAIProcessingOperation,
  updatePrivacySettings,
  getPrivacySettings,
  requestDataDeletion,
  exportUserData,
  withPrivacyConsent,
};