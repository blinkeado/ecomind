// WORLD-CLASS DATABASE ARCHITECTURE - Conflict Resolution Pipeline
// SOURCE: WORLD_CLASS_DATABASE_ARCHITECTURE.md - Multi-User Synchronization & Conflict Resolution
// VERSION: 2.0 - Cloud Functions for intelligent conflict detection and resolution
// ADDRESSES: Multi-device sync conflicts and data consistency

import * as functions from 'firebase-functions';
import { onCall } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { ConflictResolution } from '../../src/types/relationship';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

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
export const detectRelationshipConflicts = onDocumentWritten(
  'users/{userId}/relationships/{relationshipId}',
  async (event) => {
    const change = event.data;
    const context = event;
    const { userId, relationshipId } = context.params;
    
    try {
      // Skip if document was deleted
      if (!change.after.exists) {
        return null;
      }

      const newData = change.after.data();
      const oldData = change.before.data();

      // Skip if this is a new document (no conflict possible)
      if (!change.before.exists) {
        return null;
      }

      // Check for concurrent modifications
      const conflict = await detectConcurrentModification(
        userId,
        relationshipId,
        oldData,
        newData,
        change.after.updateTime
      );

      if (conflict) {
        await createConflictRecord(userId, conflict);
        await notifyUserOfConflict(userId, conflict);
      }

      return null;
    } catch (error) {
      console.error('Error in conflict detection:', error);
      throw new functions.https.HttpsError('internal', 'Conflict detection failed');
    }
  });

/**
 * Firestore Trigger: Detect conflicts on interaction updates
 * Triggered on: users/{userId}/relationships/{relationshipId}/interactions/{interactionId}
 */
export const detectInteractionConflicts = onDocumentWritten(
  'users/{userId}/relationships/{relationshipId}/interactions/{interactionId}',
  async (event) => {
    const change = event.data;
    const context = event;
    const { userId, relationshipId, interactionId } = context.params;
    
    try {
      if (!change.after.exists || !change.before.exists) {
        return null;
      }

      const newData = change.after.data();
      const oldData = change.before.data();

      // Check for interaction merge conflicts (multiple devices adding interactions)
      const conflict = await detectInteractionMergeConflict(
        userId,
        relationshipId,
        interactionId,
        oldData,
        newData
      );

      if (conflict) {
        await createConflictRecord(userId, conflict);
        // For interactions, try automatic resolution first
        await attemptAutomaticResolution(userId, conflict);
      }

      return null;
    } catch (error) {
      console.error('Error in interaction conflict detection:', error);
      throw new functions.https.HttpsError('internal', 'Interaction conflict detection failed');
    }
  });

/**
 * HTTP Function: Resolve conflict manually by user choice
 */
export const resolveConflict = onCall(async (request) => {
  const data = request.data;
  const context = request;
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const userId = context.auth.uid;
  const { conflictId, resolution, customData } = data;

  if (!conflictId || !resolution) {
    throw new functions.https.HttpsError('invalid-argument', 'conflictId and resolution are required');
  }

  try {
    const conflictRef = db.collection('users').doc(userId).collection('conflictResolution').doc(conflictId);
    const conflictDoc = await conflictRef.get();

    if (!conflictDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Conflict not found');
    }

    const conflict = conflictDoc.data() as ConflictResolution;

    // Apply resolution based on user choice
    let resolvedData;
    switch (resolution) {
      case 'keep_local':
        resolvedData = conflict.localVersion;
        break;
      case 'use_server':
        resolvedData = conflict.serverVersion;
        break;
      case 'merge':
        resolvedData = await performIntelligentMerge(conflict);
        break;
      case 'manual_resolve':
        resolvedData = customData;
        break;
      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid resolution type');
    }

    // Apply resolved data to original document
    await applyResolvedData(userId, conflict.documentPath, resolvedData);

    // Update conflict record
    await conflictRef.update({
      resolution,
      resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
      resolvedBy: 'user',
      status: 'resolved',
      mergedResult: resolvedData
    });

    // Create audit record
    await createResolutionAuditRecord(userId, conflictId, resolution, 'user');

    return { success: true, resolvedData };

  } catch (error) {
    console.error('Error resolving conflict:', error);
    throw new functions.https.HttpsError('internal', 'Failed to resolve conflict');
  }
});

/**
 * Scheduled Function: Clean up old resolved conflicts
 * Runs daily to maintain database cleanliness
 */
export const cleanupResolvedConflicts = onSchedule(
  '0 2 * * *', // 2 AM daily
  async (event) => {
    const context = event;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep conflicts for 30 days

    const batch = db.batch();
    let deletedCount = 0;

    try {
      // Query resolved conflicts older than 30 days
      const oldConflictsQuery = db.collectionGroup('conflictResolution')
        .where('status', '==', 'resolved')
        .where('resolvedAt', '<', cutoffDate)
        .limit(500); // Process in batches

      const snapshot = await oldConflictsQuery.get();

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      await batch.commit();

      console.log(`Cleaned up ${deletedCount} old conflict records`);
      return null;

    } catch (error) {
      console.error('Error cleaning up conflicts:', error);
      throw error;
    }
  });

// HELPER FUNCTIONS

/**
 * Detect concurrent modifications based on timestamps and content
 */
async function detectConcurrentModification(
  userId: string,
  relationshipId: string,
  oldData: any,
  newData: any,
  updateTime: admin.firestore.Timestamp
): Promise<ConflictResolution | null> {
  // Check if update happened within conflict detection window (10 seconds)
  const timeDiff = Date.now() - updateTime.toMillis();
  if (timeDiff > 10000) {
    return null; // Outside conflict window
  }

  // Check for conflicting fields
  const conflictingFields = detectConflictingFields(oldData, newData);
  if (conflictingFields.length === 0) {
    return null;
  }

  // Create conflict record
  return {
    id: `conflict_${Date.now()}`,
    userId,
    documentPath: `users/${userId}/relationships/${relationshipId}`,
    conflictType: 'relationship_data_conflict',
    detectedAt: new Date(),
    localVersion: newData,
    serverVersion: oldData,
    status: 'pending'
  };
}

/**
 * Detect interaction merge conflicts (multiple devices adding similar interactions)
 */
async function detectInteractionMergeConflict(
  userId: string,
  relationshipId: string,
  interactionId: string,
  oldData: any,
  newData: any
): Promise<ConflictResolution | null> {
  // Check for rapid-fire interaction additions (within 30 seconds)
  const timeDiff = Math.abs(newData.timestamp?.toMillis() - oldData.timestamp?.toMillis());
  
  if (timeDiff < 30000 && newData.type === oldData.type) {
    return {
      id: `interaction_conflict_${Date.now()}`,
      userId,
      documentPath: `users/${userId}/relationships/${relationshipId}/interactions/${interactionId}`,
      conflictType: 'interaction_merge',
      detectedAt: new Date(),
      localVersion: newData,
      serverVersion: oldData,
      status: 'pending'
    };
  }

  return null;
}

/**
 * Identify fields that have conflicting values
 */
function detectConflictingFields(oldData: any, newData: any): string[] {
  const conflictingFields: string[] = [];
  const importantFields = ['relationshipHealth', 'lastContact', 'notes', 'relationshipIntensity'];

  for (const field of importantFields) {
    if (oldData[field] !== undefined && 
        newData[field] !== undefined && 
        oldData[field] !== newData[field]) {
      conflictingFields.push(field);
    }
  }

  return conflictingFields;
}

/**
 * Create conflict record in Firestore
 */
async function createConflictRecord(userId: string, conflict: ConflictResolution): Promise<void> {
  const conflictRef = db.collection('users').doc(userId).collection('conflictResolution').doc(conflict.id);
  await conflictRef.set(conflict);
}

/**
 * Notify user of conflict through push notification or in-app alert
 */
async function notifyUserOfConflict(userId: string, conflict: ConflictResolution): Promise<void> {
  // TODO: Implement push notification system
  console.log(`Conflict detected for user ${userId}: ${conflict.conflictType}`);
  
  // For now, create a notification document
  const notificationRef = db.collection('users').doc(userId).collection('notifications').doc();
  await notificationRef.set({
    type: 'conflict_detected',
    title: 'Data Sync Conflict',
    message: 'A conflict was detected in your relationship data. Please review and resolve.',
    conflictId: conflict.id,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    read: false
  });
}

/**
 * Attempt automatic resolution for simple conflicts
 */
async function attemptAutomaticResolution(userId: string, conflict: ConflictResolution): Promise<void> {
  let resolvedData: any = null;
  
  switch (conflict.conflictType) {
    case 'interaction_merge':
      // For interaction merges, preserve both interactions as separate entries
      resolvedData = await mergeInteractions(conflict);
      break;
    case 'relationship_health_conflict':
      // Use the higher health score (optimistic approach)
      resolvedData = { 
        ...conflict.localVersion,
        relationshipHealth: Math.max(
          conflict.localVersion.relationshipHealth || 0,
          conflict.serverVersion.relationshipHealth || 0
        )
      };
      break;
    default:
      // No automatic resolution available
      return;
  }

  if (resolvedData) {
    await applyResolvedData(userId, conflict.documentPath, resolvedData);
    
    // Update conflict record
    const conflictRef = db.collection('users').doc(userId).collection('conflictResolution').doc(conflict.id);
    await conflictRef.update({
      resolution: 'automatic',
      resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
      resolvedBy: 'system',
      status: 'resolved',
      mergedResult: resolvedData
    });

    await createResolutionAuditRecord(userId, conflict.id, 'automatic', 'system');
  }
}

/**
 * Perform intelligent merge of conflicting data
 */
async function performIntelligentMerge(conflict: ConflictResolution): Promise<any> {
  const merged = { ...conflict.serverVersion }; // Start with server version

  // Merge strategy based on conflict type
  switch (conflict.conflictType) {
    case 'relationship_data_conflict':
      // Merge relationship data intelligently
      merged.lastContact = conflict.localVersion.lastContact > conflict.serverVersion.lastContact 
        ? conflict.localVersion.lastContact 
        : conflict.serverVersion.lastContact;
      
      // Combine notes if both exist
      if (conflict.localVersion.notes && conflict.serverVersion.notes) {
        merged.notes = `${conflict.serverVersion.notes}\n\n[Merged]: ${conflict.localVersion.notes}`;
      } else {
        merged.notes = conflict.localVersion.notes || conflict.serverVersion.notes;
      }
      
      // Use higher relationship health score
      merged.relationshipHealth = Math.max(
        conflict.localVersion.relationshipHealth || 0,
        conflict.serverVersion.relationshipHealth || 0
      );
      break;
      
    default:
      // Default merge: prefer local version for user-generated fields
      Object.keys(conflict.localVersion).forEach(key => {
        if (conflict.localVersion[key] !== undefined) {
          merged[key] = conflict.localVersion[key];
        }
      });
  }

  return merged;
}

/**
 * Merge duplicate interactions into separate entries
 */
async function mergeInteractions(conflict: ConflictResolution): Promise<any> {
  // For interaction conflicts, we want to preserve both as separate interactions
  // This function would create a duplicate interaction with slight modifications
  
  const baseInteraction = conflict.serverVersion;
  const duplicateInteraction = {
    ...conflict.localVersion,
    id: `${conflict.localVersion.id}_merged`,
    notes: `[Merged from sync conflict]: ${conflict.localVersion.notes || ''}`,
    timestamp: new Date(conflict.localVersion.timestamp.toMillis() + 1000) // Add 1 second
  };

  // Create the duplicate interaction
  const pathParts = conflict.documentPath.split('/');
  const userId = pathParts[1];
  const relationshipId = pathParts[3];
  
  const duplicateRef = db.collection('users')
    .doc(userId)
    .collection('relationships')
    .doc(relationshipId)
    .collection('interactions')
    .doc(duplicateInteraction.id);
    
  await duplicateRef.set(duplicateInteraction);

  return baseInteraction; // Return original interaction for the conflicted document
}

/**
 * Apply resolved data to the original document
 */
async function applyResolvedData(userId: string, documentPath: string, resolvedData: any): Promise<void> {
  const docRef = db.doc(documentPath);
  await docRef.set(resolvedData, { merge: true });
}

/**
 * Create audit record for conflict resolution
 */
async function createResolutionAuditRecord(
  userId: string, 
  conflictId: string, 
  resolution: string, 
  resolvedBy: string
): Promise<void> {
  const auditRef = db.collection('users').doc(userId).collection('privacy_audit').doc();
  
  await auditRef.set({
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    action: 'conflict_resolution',
    permission_used: 'data_consistency_management',
    details: {
      conflictId,
      resolution,
      resolvedBy,
      automated: resolvedBy === 'system'
    }
  });
}