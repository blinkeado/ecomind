/**
 * Data Retention Configuration
 */
declare const RETENTION_POLICIES: {
    INACTIVE_USER_MONTHS: number;
    AUDIT_LOG_MONTHS: number;
    DELETED_USER_GRACE_DAYS: number;
    TEMP_DATA_HOURS: number;
    CONSENT_HISTORY_YEARS: number;
};
/**
 * GDPR Data Deletion Request Handler
 * Triggered when a user requests data deletion
 */
export declare const processDataDeletionRequest: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot | undefined, {
    requestId: string;
}>>;
/**
 * GDPR Data Export Request Handler
 * Triggered when a user requests data export
 */
export declare const processDataExportRequest: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot | undefined, {
    requestId: string;
}>>;
/**
 * Scheduled cleanup of inactive users and old data
 * Runs daily at 2 AM UTC
 */
export declare const scheduledDataCleanup: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * Delete all user data (GDPR right to be forgotten)
 */
declare function deleteUserData(userId: string, requestId: string): Promise<void>;
/**
 * Generate complete user data export for GDPR compliance
 */
declare function generateUserDataExport(userId: string): Promise<any>;
/**
 * Health check for data retention system
 */
export declare const dataRetentionHealthCheck: import("firebase-functions/v2/https").HttpsFunction;
export { RETENTION_POLICIES, deleteUserData, generateUserDataExport, };
//# sourceMappingURL=dataRetention.d.ts.map