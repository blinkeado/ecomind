/**
 * Vector Search Service for Semantic Similarity Search
 * Implementation follows official Google Cloud Vertex AI and Firestore documentation
 * 
 * Features:
 * - Vertex AI text-embedding-004 for semantic embeddings
 * - Firestore vector search with KNN algorithms
 * - Performance optimization with caching
 * - Privacy-compliant processing
 */

import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { VectorDocument, VectorSearchConfig, SimilaritySearchResult, EmbeddingMetadata } from '../types/vectorSearch';

// LRU Cache implementation for embedding caching
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first entry)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

export class VectorSearchService {
  private db = firestore();
  
  // Performance optimization caches
  private embeddingCache = new LRUCache<string, { embedding: number[]; timestamp: number }>(10000);
  private queryCache = new LRUCache<string, SimilaritySearchResult[]>(1000);
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds

  /**
   * Generate semantic embedding using Vertex AI text-embedding-004
   * Official implementation following Google Cloud best practices
   */
  async generateEmbedding(
    content: string,
    contentType: VectorDocument['contentType']
  ): Promise<{ embedding: number[]; metadata: EmbeddingMetadata }> {
    // Check cache first for performance optimization
    const cacheKey = this.generateCacheKey(content, contentType);
    const cached = this.embeddingCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return {
        embedding: cached.embedding,
        metadata: {
          model: 'text-embedding-004',
          dimensions: 768,
          generatedAt: new Date(cached.timestamp),
          contentHash: this.hashContent(content),
          version: '2.0'
        }
      };
    }

    try {
      // Preprocess content for optimal embedding generation
      const processedContent = this.preprocessContent(content, contentType);
      
      // Call Vertex AI embedding generation via Cloud Function
      // This delegates to a secure Cloud Function to avoid API keys in client
      const response = await this.callEmbeddingCloudFunction(processedContent);
      const embedding = response.embedding;

      // Validate embedding dimensions (text-embedding-004 produces 768 dimensions)
      if (embedding.length !== 768) {
        throw new Error(`Invalid embedding dimensions: ${embedding.length}, expected 768`);
      }

      const metadata: EmbeddingMetadata = {
        model: 'text-embedding-004',
        dimensions: 768,
        generatedAt: new Date(),
        contentHash: this.hashContent(content),
        version: '2.0'
      };

      // Cache the result for performance
      this.embeddingCache.set(cacheKey, {
        embedding,
        timestamp: Date.now()
      });

      return { embedding, metadata };

    } catch (error) {
      console.error('Vertex AI embedding generation failed:', error);
      throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store vector document in Firestore with optimal indexing structure
   * Following official Firestore vector search patterns
   */
  async storeVectorDocument(
    relationshipId: string,
    userId: string,
    content: string,
    contentType: VectorDocument['contentType']
  ): Promise<string> {
    const { embedding, metadata } = await this.generateEmbedding(content, contentType);

    const vectorDoc: Omit<VectorDocument, 'id'> = {
      relationshipId,
      userId,
      contentType,
      embedding,
      metadata,
      searchableContent: content.substring(0, 1000), // Limit for storage optimization
      lastUpdated: new Date(),
      isActive: true
    };

    // Store in dedicated vectors collection for optimal indexing
    // Collection structure: /vectors/{documentId}
    const docRef = await this.db
      .collection('vectors')
      .add(vectorDoc);

    return docRef.id;
  }

  /**
   * Semantic similarity search using Firestore vector search
   * Implementation follows official Google Cloud documentation
   */
  async findSimilarContent(
    queryText: string,
    config: VectorSearchConfig = {}
  ): Promise<SimilaritySearchResult[]> {
    const {
      limit = 10,
      threshold = 0.7,
      contentTypes = ['relationship_context', 'emotional_signal'],
      userId,
      excludeRelationshipIds = []
    } = config;

    // Check query cache first
    const queryCacheKey = `${queryText}:${JSON.stringify(config)}`;
    const cachedResults = this.queryCache.get(queryCacheKey);
    if (cachedResults) {
      return cachedResults;
    }

    try {
      // Generate query embedding
      const { embedding: queryEmbedding } = await this.generateEmbedding(
        queryText,
        'relationship_context'
      );

      // Build Firestore vector query with privacy filters
      let query = this.db.collection('vectors')
        .where('isActive', '==', true);

      // Apply user filter for privacy (critical for data isolation)
      if (userId) {
        query = query.where('userId', '==', userId);
      }

      // Apply content type filter
      if (contentTypes.length > 0 && contentTypes.length < 4) {
        // Use 'in' operator for efficient filtering (max 10 values)
        query = query.where('contentType', 'in', contentTypes);
      }

      // Execute vector similarity search using official Firestore API
      const vectorQuery = query.findNearest(
        'embedding',
        queryEmbedding,
        {
          limit: Math.min(limit, 100), // Firestore vector search limit
          distanceMeasure: 'COSINE',   // Best for semantic similarity
          distanceThreshold: 1 - threshold // Convert similarity to distance
        }
      );

      const results = await vectorQuery.get();

      // Process and rank results with business logic
      const similarityResults: SimilaritySearchResult[] = results.docs
        .map(doc => {
          const data = doc.data() as VectorDocument;
          const distance = (doc as any)._distance || 0;
          const similarity = 1 - distance; // Convert distance back to similarity

          return {
            id: doc.id,
            relationshipId: data.relationshipId,
            contentType: data.contentType,
            similarity,
            content: data.searchableContent,
            metadata: data.metadata,
            lastUpdated: data.lastUpdated
          };
        })
        .filter(result => 
          // Apply business logic filters
          result.similarity >= threshold &&
          !excludeRelationshipIds.includes(result.relationshipId)
        )
        .sort((a, b) => b.similarity - a.similarity); // Sort by similarity descending

      // Cache results for 30 minutes
      this.queryCache.set(queryCacheKey, similarityResults);

      return similarityResults;

    } catch (error) {
      console.error('Vector search failed:', error);
      throw new Error(`Vector search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch update embeddings for existing relationships
   * Used for migration and maintenance operations
   */
  async batchUpdateEmbeddings(
    relationshipIds: string[],
    userId: string,
    progressCallback?: (progress: number) => void
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    const total = relationshipIds.length;

    // Process in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < relationshipIds.length; i += batchSize) {
      const batch = relationshipIds.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (relationshipId) => {
          try {
            // Get relationship context from user's subcollection
            const relationshipDoc = await this.db
              .collection('users')
              .doc(userId)
              .collection('relationships')
              .doc(relationshipId)
              .get();

            if (relationshipDoc.exists) {
              const data = relationshipDoc.data();
              const context = this.buildRelationshipContext(data);
              
              await this.storeVectorDocument(
                relationshipId,
                userId,
                context,
                'relationship_context'
              );
              
              success++;
            }
          } catch (error) {
            console.error(`Failed to update embedding for ${relationshipId}:`, error);
            failed++;
          }
        })
      );

      // Report progress
      if (progressCallback) {
        progressCallback(Math.min(i + batchSize, total) / total);
      }
    }

    return { success, failed };
  }

  /**
   * Update or create vector document for relationship changes
   * Called when relationship data is modified
   */
  async updateRelationshipVector(
    relationshipId: string,
    userId: string,
    relationshipData: any
  ): Promise<void> {
    try {
      // Build context from relationship data
      const context = this.buildRelationshipContext(relationshipData);
      
      // Check if vector document already exists
      const existingDoc = await this.db
        .collection('vectors')
        .where('relationshipId', '==', relationshipId)
        .where('userId', '==', userId)
        .where('contentType', '==', 'relationship_context')
        .limit(1)
        .get();

      if (!existingDoc.empty) {
        // Update existing document
        const docId = existingDoc.docs[0].id;
        const { embedding, metadata } = await this.generateEmbedding(context, 'relationship_context');
        
        await this.db
          .collection('vectors')
          .doc(docId)
          .update({
            embedding,
            metadata,
            searchableContent: context.substring(0, 1000),
            lastUpdated: new Date()
          });
      } else {
        // Create new vector document
        await this.storeVectorDocument(relationshipId, userId, context, 'relationship_context');
      }
    } catch (error) {
      console.error(`Failed to update vector for relationship ${relationshipId}:`, error);
      throw error;
    }
  }

  /**
   * Delete vector documents for a relationship
   * Called when relationship is deleted
   */
  async deleteRelationshipVectors(relationshipId: string, userId: string): Promise<void> {
    try {
      const vectorDocs = await this.db
        .collection('vectors')
        .where('relationshipId', '==', relationshipId)
        .where('userId', '==', userId)
        .get();

      const batch = this.db.batch();
      vectorDocs.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error(`Failed to delete vectors for relationship ${relationshipId}:`, error);
      throw error;
    }
  }

  // Private helper methods

  private async callEmbeddingCloudFunction(content: string): Promise<{ embedding: number[] }> {
    // Call Cloud Function for secure embedding generation
    // This keeps API keys secure on the server side
    const functions = require('@react-native-firebase/functions').default;
    const generateEmbedding = functions().httpsCallable('generateEmbedding');
    
    const result = await generateEmbedding({ content });
    return result.data;
  }

  private generateCacheKey(content: string, contentType: string): string {
    return `${contentType}:${this.hashContent(content)}`;
  }

  private hashContent(content: string): string {
    // Simple hash function for content deduplication
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private preprocessContent(content: string, contentType: VectorDocument['contentType']): string {
    // Content preprocessing for optimal embeddings
    let processed = content.trim();

    // Add context prefix for better embeddings
    switch (contentType) {
      case 'relationship_context':
        processed = `Relationship context: ${processed}`;
        break;
      case 'emotional_signal':
        processed = `Emotional context: ${processed}`;
        break;
      case 'interaction_summary':
        processed = `Interaction summary: ${processed}`;
        break;
      case 'life_event':
        processed = `Life event: ${processed}`;
        break;
    }

    // Limit content length for optimal embedding quality (Vertex AI recommendation)
    return processed.substring(0, 2000);
  }

  private buildRelationshipContext(relationshipData: any): string {
    // Build comprehensive context string for embedding
    const contextParts = [
      `Person: ${relationshipData.displayName || ''}`,
      `Relationship type: ${relationshipData.relationshipType || ''}`,
      `Roles: ${relationshipData.roles?.join(', ') || ''}`,
      `Tags: ${relationshipData.tags?.join(', ') || ''}`,
      `Notes: ${relationshipData.notes || ''}`,
      `Location: ${relationshipData.location?.city || ''} ${relationshipData.location?.country || ''}`,
      `Interests: ${relationshipData.demographics?.interests?.join(', ') || ''}`,
      `Communication preferences: ${relationshipData.communication?.preferredMethods?.join(', ') || ''}`,
      `Important dates: ${relationshipData.importantDates ? Object.values(relationshipData.importantDates).join(', ') : ''}`
    ].filter(part => part.split(': ')[1]); // Remove empty parts

    return contextParts.join('. ');
  }
}

// Singleton export for consistent usage across the app
export const vectorSearchService = new VectorSearchService();