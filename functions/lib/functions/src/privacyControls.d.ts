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
export declare const updatePrivacySettings: any;
/**
 * Get Privacy Settings
 * Retrieve user's current privacy preferences
 */
export declare const getPrivacySettings: any;
/**
 * Request Data Deletion (GDPR Right to be Forgotten)
 * Handles user requests for complete data deletion
 */
export declare const requestDataDeletion: any;
/**
 * Export User Data (GDPR Right to Data Portability)
 * Provides users with a complete export of their data
 */
export declare const exportUserData: any;
/**
 * Privacy Control Middleware
 * Helper function to check consent before AI operations
 */
export declare const withPrivacyConsent: (operation: string) => (userId: string, callback: () => Promise<any>) => Promise<any>;
export declare const privacyControls: {
    checkAIProcessingConsent: (userId: string) => Promise<boolean>;
    logAIProcessingOperation: (request: AIProcessingRequest) => Promise<void>;
    updatePrivacySettings: any;
    getPrivacySettings: any;
    requestDataDeletion: any;
    exportUserData: any;
    withPrivacyConsent: (operation: string) => (userId: string, callback: () => Promise<any>) => Promise<any>;
};
export {};
//# sourceMappingURL=privacyControls.d.ts.map