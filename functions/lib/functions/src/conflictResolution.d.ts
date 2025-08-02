import * as functions from 'firebase-functions';
/**
 * Conflict Detection and Resolution Service
 *
 * FEATURES:
 * - Automatic conflict detection on document writes
 * - Last Write Wins (LWW) with intelligent exceptions
 * - Custom resolution logic for relationship-specific scenarios
 * - User notification system for manual conflicts
 * - Audit trail for all conflict resolutions
 * - Performance optimized for real-time sync
 */
/**
 * Firestore Trigger: Detect conflicts on relationship data updates
 * Triggered on: users/{userId}/relationships/{relationshipId}
 */
export declare const detectRelationshipConflicts: functions.CloudFunction<functions.firestore.FirestoreEvent<functions.firestore.Change<functions.firestore.DocumentSnapshot> | undefined, {
    userId: string;
    relationshipId: string;
}>>;
/**
 * Firestore Trigger: Detect conflicts on interaction updates
 * Triggered on: users/{userId}/relationships/{relationshipId}/interactions/{interactionId}
 */
export declare const detectInteractionConflicts: functions.CloudFunction<functions.firestore.FirestoreEvent<functions.firestore.Change<functions.firestore.DocumentSnapshot> | undefined, {
    userId: string;
    relationshipId: string;
    interactionId: string;
}>>;
/**
 * HTTP Function: Resolve conflict manually by user choice
 */
export declare const resolveConflict: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    resolvedData: any;
}>, unknown>;
/**
 * Scheduled Function: Clean up old resolved conflicts
 * Runs daily to maintain database cleanliness
 */
export declare const cleanupResolvedConflicts: functions.scheduler.ScheduleFunction;
//# sourceMappingURL=conflictResolution.d.ts.map