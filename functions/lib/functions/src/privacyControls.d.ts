import * as functions from "firebase-functions";
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
export declare const checkAIProcessingConsent: (userId: string) => Promise<boolean>;
/**
 * Log AI Processing Operation
 * For transparency and audit purposes
 */
export declare const logAIProcessingOperation: (request: AIProcessingRequest) => Promise<void>;
/**
 * Update Privacy Settings
 * Allows users to update their privacy preferences
 */
export declare const updatePrivacySettings: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    settings: PrivacySettings;
    updatedAt: string;
}>, unknown>;
/**
 * Get Privacy Settings
 * Retrieve user's current privacy preferences
 */
export declare const getPrivacySettings: functions.https.CallableFunction<any, Promise<{
    settings: PrivacySettings;
    isDefault: boolean;
}>, unknown>;
/**
 * Request Data Deletion (GDPR Right to be Forgotten)
 * Handles user requests for complete data deletion
 */
export declare const requestDataDeletion: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    deletionId: string;
    message: string;
    requestedAt: string;
}>, unknown>;
/**
 * Export User Data (GDPR Right to Data Portability)
 * Provides users with a complete export of their data
 */
export declare const exportUserData: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    data: {
        profile: {};
        relationships: never[];
        prompts: never[];
        settings: {};
        interactions: never[];
        exportedAt: string;
        format: "json" | "csv";
    };
    exportedAt: string;
}>, unknown>;
/**
 * Privacy Control Middleware
 * Helper function to check consent before AI operations
 */
export declare const withPrivacyConsent: (operation: string) => (userId: string, callback: () => Promise<any>) => Promise<any>;
export declare const privacyControls: {
    checkAIProcessingConsent: (userId: string) => Promise<boolean>;
    logAIProcessingOperation: (request: AIProcessingRequest) => Promise<void>;
    updatePrivacySettings: functions.https.CallableFunction<any, Promise<{
        success: boolean;
        settings: PrivacySettings;
        updatedAt: string;
    }>, unknown>;
    getPrivacySettings: functions.https.CallableFunction<any, Promise<{
        settings: PrivacySettings;
        isDefault: boolean;
    }>, unknown>;
    requestDataDeletion: functions.https.CallableFunction<any, Promise<{
        success: boolean;
        deletionId: string;
        message: string;
        requestedAt: string;
    }>, unknown>;
    exportUserData: functions.https.CallableFunction<any, Promise<{
        success: boolean;
        data: {
            profile: {};
            relationships: never[];
            prompts: never[];
            settings: {};
            interactions: never[];
            exportedAt: string;
            format: "json" | "csv";
        };
        exportedAt: string;
    }>, unknown>;
    withPrivacyConsent: (operation: string) => (userId: string, callback: () => Promise<any>) => Promise<any>;
};
export {};
//# sourceMappingURL=privacyControls.d.ts.map