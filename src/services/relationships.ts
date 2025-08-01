// SOURCE: Firebase Firestore v22.4.0 Official Documentation + IMPLEMENTATION_PLAN.md line 65
// URL: https://rnfirebase.io/firestore/usage
// VERIFIED: Firestore CRUD operations based on official React Native Firebase patterns

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe,
  QueryConstraint,
} from '@react-native-firebase/firestore';
import { firebaseDb } from './firebase';
import { 
  PersonDocument, 
  PersonDocumentUpdate,
  InteractionRecord,
  InteractionRecordCreate,
  LifeEvent,
  LifeEventCreate,
  RelationshipStats,
  RelationshipType,
  CONTACT_FREQUENCY_TARGETS
} from '../types/relationship';

/**
 * Relationships Service
 * Handles all CRUD operations for relationship data
 * SOURCE: Firebase Firestore Documentation - CRUD Operations
 */

/**
 * Collection References
 * SOURCE: Firestore Documentation - Collection References
 */
const getPersonCollection = (userId: string) => 
  collection(firebaseDb, 'users', userId, 'relationships');

const getInteractionCollection = (userId: string, personId: string) => 
  collection(firebaseDb, 'users', userId, 'relationships', personId, 'interactions');

const getLifeEventCollection = (userId: string, personId: string) => 
  collection(firebaseDb, 'users', userId, 'relationships', personId, 'lifeEvents');

/**
 * Person/Relationship CRUD Operations
 */

/**
 * Create a new person/relationship
 * SOURCE: Firestore Documentation - Add Data
 */
export const createPerson = async (
  userId: string, 
  personData: Omit<PersonDocument, 'id' | 'createdAt' | 'lastUpdated' | 'createdBy'>
): Promise<string> => {
  try {
    const personCollection = getPersonCollection(userId);
    
    const newPerson: Omit<PersonDocument, 'id'> = {
      ...personData,
      createdAt: new Date(),
      lastUpdated: new Date(),
      createdBy: userId,
      relationshipHealth: personData.relationshipHealth || 7,
      communicationFrequency: personData.communicationFrequency || 
        CONTACT_FREQUENCY_TARGETS[personData.relationshipType] || 30,
      isPrivate: personData.isPrivate ?? true,
      sharedWith: personData.sharedWith || [],
      version: 1,
      tags: personData.tags || [],
    };

    const docRef = await addDoc(personCollection, {
      ...newPerson,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    });

    console.log('🔥 Relationships: Person created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('🔥 Relationships Error (Create Person):', error);
    throw error;
  }
};

/**
 * Get a specific person by ID
 * SOURCE: Firestore Documentation - Get Data
 */
export const getPerson = async (
  userId: string, 
  personId: string
): Promise<PersonDocument | null> => {
  try {
    const personDoc = doc(firebaseDb, 'users', userId, 'relationships', personId);
    const docSnap = await getDoc(personDoc);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
        lastContact: data.lastContact?.toDate(),
        nextContactSuggestion: data.nextContactSuggestion?.toDate(),
      } as PersonDocument;
    }
    
    return null;
  } catch (error) {
    console.error('🔥 Relationships Error (Get Person):', error);
    throw error;
  }
};

/**
 * Get all relationships for a user
 * SOURCE: Firestore Documentation - Get Multiple Documents
 */
export const getAllRelationships = async (
  userId: string,
  options?: {
    relationshipType?: RelationshipType;
    limit?: number;
    orderBy?: 'displayName' | 'lastContact' | 'relationshipHealth' | 'createdAt';
    orderDirection?: 'asc' | 'desc';
  }
): Promise<PersonDocument[]> => {
  try {
    const personCollection = getPersonCollection(userId);
    
    // Build query constraints
    const constraints: QueryConstraint[] = [];
    
    if (options?.relationshipType) {
      constraints.push(where('relationshipType', '==', options.relationshipType));
    }
    
    if (options?.orderBy) {
      constraints.push(orderBy(options.orderBy, options?.orderDirection || 'asc'));
    }
    
    if (options?.limit) {
      constraints.push(limit(options.limit));
    }
    
    const q = query(personCollection, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const relationships: PersonDocument[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      relationships.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
        lastContact: data.lastContact?.toDate(),
        nextContactSuggestion: data.nextContactSuggestion?.toDate(),
      } as PersonDocument);
    });
    
    console.log(`🔥 Relationships: Retrieved ${relationships.length} relationships`);
    return relationships;
  } catch (error) {
    console.error('🔥 Relationships Error (Get All):', error);
    throw error;
  }
};

/**
 * Update a person/relationship
 * SOURCE: Firestore Documentation - Update Data
 */
export const updatePerson = async (
  userId: string,
  personId: string,
  updates: PersonDocumentUpdate
): Promise<void> => {
  try {
    const personDoc = doc(firebaseDb, 'users', userId, 'relationships', personId);
    
    const updateData = {
      ...updates,
      lastUpdated: serverTimestamp(),
      version: (updates.version || 1) + 1,
    };
    
    // Convert Date objects to Firestore Timestamps for specific fields
    if (updates.lastContact) {
      updateData.lastContact = updates.lastContact;
    }
    if (updates.nextContactSuggestion) {
      updateData.nextContactSuggestion = updates.nextContactSuggestion;
    }
    
    await updateDoc(personDoc, updateData);
    console.log('🔥 Relationships: Person updated:', personId);
  } catch (error) {
    console.error('🔥 Relationships Error (Update Person):', error);
    throw error;
  }
};

/**
 * Delete a person/relationship
 * SOURCE: Firestore Documentation - Delete Data
 */
export const deletePerson = async (
  userId: string,
  personId: string
): Promise<void> => {
  try {
    // Create a batch to delete person and all subcollections
    const batch = writeBatch(firebaseDb);
    
    // Delete the person document
    const personDoc = doc(firebaseDb, 'users', userId, 'relationships', personId);
    batch.delete(personDoc);
    
    // TODO: In a production app, we'd need to delete subcollections
    // (interactions, lifeEvents) using Cloud Functions or batch operations
    // For now, we'll just delete the main document
    
    await batch.commit();
    console.log('🔥 Relationships: Person deleted:', personId);
  } catch (error) {
    console.error('🔥 Relationships Error (Delete Person):', error);
    throw error;
  }
};

/**
 * Search relationships by name or tags
 * SOURCE: Firestore Documentation - Array Queries
 */
export const searchRelationships = async (
  userId: string,
  searchTerm: string,
  searchLimit: number = 20
): Promise<PersonDocument[]> => {
  try {
    const personCollection = getPersonCollection(userId);
    
    // Firestore doesn't support full-text search, so we'll do a simple prefix search
    // For production, consider using Algolia or another search service
    const q = query(
      personCollection,
      where('displayName', '>=', searchTerm),
      where('displayName', '<=', searchTerm + '\uf8ff'),
      limit(searchLimit)
    );
    
    const querySnapshot = await getDocs(q);
    
    const results: PersonDocument[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
        lastContact: data.lastContact?.toDate(),
        nextContactSuggestion: data.nextContactSuggestion?.toDate(),
      } as PersonDocument);
    });
    
    return results;
  } catch (error) {
    console.error('🔥 Relationships Error (Search):', error);
    throw error;
  }
};

/**
 * Interaction CRUD Operations
 */

/**
 * Create a new interaction
 * SOURCE: Firestore Documentation - Add Data to Subcollections
 */
export const createInteraction = async (
  userId: string,
  personId: string,
  interactionData: InteractionRecordCreate
): Promise<string> => {
  try {
    const interactionCollection = getInteractionCollection(userId, personId);
    
    const newInteraction: Omit<InteractionRecord, 'id'> = {
      ...interactionData,
      userId,
      personId,
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    const docRef = await addDoc(interactionCollection, {
      ...newInteraction,
      timestamp: interactionData.timestamp,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    });

    // Update person's last contact date
    await updatePerson(userId, personId, {
      lastContact: interactionData.timestamp,
      lastUpdated: new Date(),
    });

    console.log('🔥 Relationships: Interaction created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('🔥 Relationships Error (Create Interaction):', error);
    throw error;
  }
};

/**
 * Get interactions for a person
 * SOURCE: Firestore Documentation - Query Subcollections
 */
export const getInteractions = async (
  userId: string,
  personId: string,
  options?: {
    limit?: number;
    orderBy?: 'timestamp' | 'createdAt';
    orderDirection?: 'asc' | 'desc';
    startAfterDoc?: DocumentSnapshot;
  }
): Promise<InteractionRecord[]> => {
  try {
    const interactionCollection = getInteractionCollection(userId, personId);
    
    const constraints: QueryConstraint[] = [];
    
    if (options?.orderBy) {
      constraints.push(orderBy(options.orderBy, options?.orderDirection || 'desc'));
    } else {
      constraints.push(orderBy('timestamp', 'desc'));
    }
    
    if (options?.startAfterDoc) {
      constraints.push(startAfter(options.startAfterDoc));
    }
    
    if (options?.limit) {
      constraints.push(limit(options.limit));
    }
    
    const q = query(interactionCollection, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const interactions: InteractionRecord[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      interactions.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
      } as InteractionRecord);
    });
    
    return interactions;
  } catch (error) {
    console.error('🔥 Relationships Error (Get Interactions):', error);
    throw error;
  }
};

/**
 * Life Event CRUD Operations
 */

/**
 * Create a new life event
 * SOURCE: Firestore Documentation - Add Data to Subcollections
 */
export const createLifeEvent = async (
  userId: string,
  personId: string,
  eventData: LifeEventCreate
): Promise<string> => {
  try {
    const lifeEventCollection = getLifeEventCollection(userId, personId);
    
    const newEvent: Omit<LifeEvent, 'id'> = {
      ...eventData,
      personId,
      createdAt: new Date(),
      lastUpdated: new Date(),
      reminderSent: false,
    };

    const docRef = await addDoc(lifeEventCollection, {
      ...newEvent,
      date: eventData.date,
      reminderDate: eventData.reminderDate,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    });

    console.log('🔥 Relationships: Life event created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('🔥 Relationships Error (Create Life Event):', error);
    throw error;
  }
};

/**
 * Get life events for a person
 * SOURCE: Firestore Documentation - Query Subcollections
 */
export const getLifeEvents = async (
  userId: string,
  personId: string,
  options?: {
    limit?: number;
    orderBy?: 'date' | 'importance' | 'createdAt';
    orderDirection?: 'asc' | 'desc';
  }
): Promise<LifeEvent[]> => {
  try {
    const lifeEventCollection = getLifeEventCollection(userId, personId);
    
    const constraints: QueryConstraint[] = [];
    
    if (options?.orderBy) {
      constraints.push(orderBy(options.orderBy, options?.orderDirection || 'asc'));
    } else {
      constraints.push(orderBy('date', 'asc'));
    }
    
    if (options?.limit) {
      constraints.push(limit(options.limit));
    }
    
    const q = query(lifeEventCollection, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const events: LifeEvent[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      events.push({
        id: doc.id,
        ...data,
        date: data.date?.toDate() || new Date(),
        reminderDate: data.reminderDate?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
      } as LifeEvent);
    });
    
    return events;
  } catch (error) {
    console.error('🔥 Relationships Error (Get Life Events):', error);
    throw error;
  }
};

/**
 * Real-time Listeners
 * SOURCE: Firestore Documentation - Real-time Updates
 */

/**
 * Listen to relationship changes
 */
export const subscribeToRelationships = (
  userId: string,
  callback: (relationships: PersonDocument[]) => void,
  errorCallback?: (error: Error) => void
): Unsubscribe => {
  try {
    const personCollection = getPersonCollection(userId);
    const q = query(personCollection, orderBy('displayName', 'asc'));
    
    return onSnapshot(
      q,
      (querySnapshot) => {
        const relationships: PersonDocument[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          relationships.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            lastUpdated: data.lastUpdated?.toDate() || new Date(),
            lastContact: data.lastContact?.toDate(),
            nextContactSuggestion: data.nextContactSuggestion?.toDate(),
          } as PersonDocument);
        });
        
        callback(relationships);
      },
      (error) => {
        console.error('🔥 Relationships Error (Real-time):', error);
        if (errorCallback) {
          errorCallback(error);
        }
      }
    );
  } catch (error) {
    console.error('🔥 Relationships Error (Subscribe):', error);
    throw error;
  }
};

/**
 * Listen to interactions for a person
 */
export const subscribeToInteractions = (
  userId: string,
  personId: string,
  callback: (interactions: InteractionRecord[]) => void,
  errorCallback?: (error: Error) => void
): Unsubscribe => {
  try {
    const interactionCollection = getInteractionCollection(userId, personId);
    const q = query(interactionCollection, orderBy('timestamp', 'desc'), limit(50));
    
    return onSnapshot(
      q,
      (querySnapshot) => {
        const interactions: InteractionRecord[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          interactions.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            lastUpdated: data.lastUpdated?.toDate() || new Date(),
          } as InteractionRecord);
        });
        
        callback(interactions);
      },
      (error) => {
        console.error('🔥 Relationships Error (Interactions Real-time):', error);
        if (errorCallback) {
          errorCallback(error);
        }
      }
    );
  } catch (error) {
    console.error('🔥 Relationships Error (Subscribe Interactions):', error);
    throw error;
  }
};

/**
 * Utility Functions
 */

/**
 * Calculate relationship health score
 * Based on communication frequency, interaction quality, and recency
 */
export const calculateRelationshipHealth = (
  person: PersonDocument,
  recentInteractions: InteractionRecord[]
): number => {
  const now = new Date();
  const daysSinceLastContact = person.lastContact 
    ? Math.floor((now.getTime() - person.lastContact.getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  const targetFrequency = CONTACT_FREQUENCY_TARGETS[person.relationshipType] || 30;
  
  // Base score from relationship intensity
  let healthScore = person.relationshipIntensity || 5;
  
  // Adjust based on communication frequency
  const frequencyRatio = daysSinceLastContact / targetFrequency;
  if (frequencyRatio > 2) {
    healthScore -= 3; // Significant decline
  } else if (frequencyRatio > 1.5) {
    healthScore -= 2; // Moderate decline
  } else if (frequencyRatio > 1) {
    healthScore -= 1; // Slight decline
  }
  
  // Adjust based on recent interaction quality
  if (recentInteractions.length > 0) {
    const recentQuality = recentInteractions
      .slice(0, 3) // Last 3 interactions
      .reduce((sum, interaction) => sum + (interaction.interactionQuality || 5), 0) / 
      Math.min(3, recentInteractions.length);
    
    if (recentQuality > 7) {
      healthScore += 1;
    } else if (recentQuality < 4) {
      healthScore -= 1;
    }
  }
  
  // Ensure score is within bounds
  return Math.max(1, Math.min(10, Math.round(healthScore)));
};

/**
 * Export all relationship service functions
 */
export default {
  // Person CRUD
  createPerson,
  getPerson,
  getAllRelationships,
  updatePerson,
  deletePerson,
  searchRelationships,
  
  // Interaction CRUD
  createInteraction,
  getInteractions,
  
  // Life Event CRUD
  createLifeEvent,
  getLifeEvents,
  
  // Real-time Listeners
  subscribeToRelationships,
  subscribeToInteractions,
  
  // Utilities
  calculateRelationshipHealth,
};