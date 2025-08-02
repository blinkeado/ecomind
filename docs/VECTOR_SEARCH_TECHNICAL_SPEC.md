# 🔍 Vector Search Technical Specification

## 📋 Overview

**Purpose**: Implement semantic similarity search for relationship context, emotional signals, and AI-powered recommendations  
**Technology**: Google Cloud Firestore Vector Search + Vertex AI Text Embeddings  
**Performance Target**: <200ms search response time, 95th percentile  
**Scale Target**: Support 100K+ relationships with real-time semantic search

---

## 🏗️ Architecture Design

### **System Architecture**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Native  │    │   Cloud Function │    │   Firestore     │
│   Application   │───▶│   Embedding      │───▶│   Vector Index  │
│                 │    │   Generation     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌──────────────────┐             │
         └─────────────▶│   Vertex AI      │◀────────────┘
                        │   Text Embeddings│
                        └──────────────────┘
```

### **Data Flow**
1. **Embedding Generation**: Convert relationship context to 768-dimensional vectors
2. **Vector Storage**: Store embeddings in Firestore with metadata
3. **Semantic Search**: Query similar relationships using KNN algorithms
4. **Result Ranking**: Apply business logic for relationship relevance
5. **Real-time Updates**: Maintain embedding freshness with triggers

---

## 🔧 Technical Implementation

### **1. Vector Embedding Service**

#### **Service Interface**
```typescript
// File: src/services/vectorSearch.ts
import { getVertexAI, getGenerativeModel } from 'firebase/vertexai-preview';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { RelationshipContext, SimilaritySearchResult, VectorSearchConfig } from '../types/vectorSearch';

export interface EmbeddingMetadata {
  model: string;
  dimensions: number;
  generatedAt: Date;
  contentHash: string; // For cache invalidation
  version: string;
}

export interface VectorDocument {
  id: string;
  relationshipId: string;
  userId: string;
  contentType: 'relationship_context' | 'emotional_signal' | 'interaction_summary' | 'life_event';
  embedding: number[]; // 768-dimensional vector
  metadata: EmbeddingMetadata;
  searchableContent: string; // Original text for debugging
  lastUpdated: Date;
  isActive: boolean;
}

export class VectorSearchService {
  private db = firestore();
  private vertexAI: any;
  private embeddingModel: any;
  
  // Caching for performance optimization
  private embeddingCache = new Map<string, { embedding: number[]; timestamp: number }>();
  private readonly CACHE_TTL = 3600000; // 1 hour

  constructor() {
    this.vertexAI = getVertexAI(/* Firebase app */);
    this.initializeEmbeddingModel();
  }

  private async initializeEmbeddingModel() {
    // Use Google's latest text embedding model
    this.embeddingModel = getGenerativeModel(this.vertexAI, {
      model: 'text-embedding-004', // Latest version as of 2025
      generationConfig: {
        outputDimensionality: 768, // Optimal for relationship context
      }
    });
  }

  /**
   * Generate embedding for relationship context
   * Implements caching and batch processing for performance
   */
  async generateEmbedding(
    content: string,
    contentType: VectorDocument['contentType']
  ): Promise<{ embedding: number[]; metadata: EmbeddingMetadata }> {
    // Check cache first
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
      // Preprocess content for optimal embedding
      const processedContent = this.preprocessContent(content, contentType);
      
      // Generate embedding using Vertex AI
      const result = await this.embeddingModel.embedContent(processedContent);
      const embedding = Array.from(result.embedding.values);

      // Validate embedding dimensions
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

      // Cache the result
      this.embeddingCache.set(cacheKey, {
        embedding,
        timestamp: Date.now()
      });

      return { embedding, metadata };

    } catch (error) {
      throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store vector document in Firestore with proper indexing
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
    const docRef = await this.db
      .collection('vectors')
      .add(vectorDoc);

    return docRef.id;
  }

  /**
   * Semantic similarity search using Firestore vector search
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

    try {
      // Generate query embedding
      const { embedding: queryEmbedding } = await this.generateEmbedding(
        queryText,
        'relationship_context'
      );

      // Build Firestore vector query
      let query = this.db.collection('vectors')
        .where('isActive', '==', true);

      // Apply user filter for privacy
      if (userId) {
        query = query.where('userId', '==', userId);
      }

      // Apply content type filter
      if (contentTypes.length > 0) {
        query = query.where('contentType', 'in', contentTypes);
      }

      // Execute vector similarity search
      const vectorQuery = query.findNearest(
        'embedding',
        queryEmbedding,
        {
          limit: Math.min(limit, 100), // Firestore limit
          distanceMeasure: 'COSINE', // Best for semantic similarity
          distanceThreshold: 1 - threshold // Convert similarity to distance
        }
      );

      const results = await vectorQuery.get();

      // Process and rank results
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

      return similarityResults;

    } catch (error) {
      throw new Error(`Vector search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch update embeddings for existing relationships
   * Used for migration and maintenance
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
            // Get relationship context
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

  // Private helper methods
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

    // Limit content length for optimal embedding quality
    return processed.substring(0, 2000);
  }

  private buildRelationshipContext(relationshipData: any): string {
    // Build comprehensive context string for embedding
    const contextParts = [
      `Person: ${relationshipData.displayName}`,
      `Relationship type: ${relationshipData.relationshipType}`,
      `Roles: ${relationshipData.roles?.join(', ') || ''}`,
      `Tags: ${relationshipData.tags?.join(', ') || ''}`,
      `Notes: ${relationshipData.notes || ''}`,
      `Location: ${relationshipData.location?.city || ''} ${relationshipData.location?.country || ''}`,
      `Interests: ${relationshipData.demographics?.interests?.join(', ') || ''}`
    ].filter(part => part.split(': ')[1]); // Remove empty parts

    return contextParts.join('. ');
  }
}

export const vectorSearchService = new VectorSearchService();
```

### **2. TypeScript Interfaces**

```typescript
// File: src/types/vectorSearch.ts
export interface VectorSearchConfig {
  limit?: number;
  threshold?: number; // Similarity threshold (0-1)
  contentTypes?: VectorDocument['contentType'][];
  userId?: string;
  excludeRelationshipIds?: string[];
  includeMetadata?: boolean;
}

export interface SimilaritySearchResult {
  id: string;
  relationshipId: string;
  contentType: VectorDocument['contentType'];
  similarity: number; // 0-1 score
  content: string;
  metadata: EmbeddingMetadata;
  lastUpdated: Date;
}

export interface VectorSearchAnalytics {
  totalSearches: number;
  averageResponseTime: number;
  averageSimilarityScore: number;
  topContentTypes: Array<{ type: string; count: number }>;
  cacheHitRate: number;
}
```

### **3. Firestore Index Configuration**

```json
// Addition to firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "vectors",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "contentType", "order": "ASCENDING" },
        { "fieldPath": "embedding", "vectorConfig": {"dimension": 768, "flat": {}} }
      ]
    },
    {
      "collectionGroup": "vectors",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "relationshipId", "order": "ASCENDING" },
        { "fieldPath": "lastUpdated", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 🎯 Performance Optimization

### **1. Caching Strategy**
- **In-Memory Cache**: 1-hour TTL for frequently accessed embeddings
- **Query Result Cache**: Cache similar search results for 30 minutes
- **Batch Processing**: Process multiple embeddings in parallel

### **2. Index Optimization**
- **Composite Indexes**: Optimize for common query patterns
- **Selective Indexing**: Only index active, relevant vectors
- **Dimension Optimization**: Use 768 dimensions (optimal for text embeddings)

### **3. Query Optimization**
- **Pre-filtering**: Apply user/content filters before vector search
- **Result Limiting**: Cap results at 100 per query (Firestore limit)
- **Parallel Processing**: Execute independent operations concurrently

---

## 🧪 Testing Strategy

### **1. Unit Tests**
```typescript
// File: src/services/__tests__/vectorSearch.test.ts
describe('VectorSearchService', () => {
  test('should generate valid embeddings', async () => {
    const service = new VectorSearchService();
    const { embedding, metadata } = await service.generateEmbedding(
      'Test relationship context',
      'relationship_context'
    );
    
    expect(embedding).toHaveLength(768);
    expect(metadata.model).toBe('text-embedding-004');
    expect(metadata.dimensions).toBe(768);
  });

  test('should find similar content', async () => {
    const service = new VectorSearchService();
    const results = await service.findSimilarContent('friend', {
      limit: 5,
      threshold: 0.7
    });
    
    expect(results).toBeDefined();
    expect(results.length).toBeLessThanOrEqual(5);
    results.forEach(result => {
      expect(result.similarity).toBeGreaterThanOrEqual(0.7);
    });
  });
});
```

### **2. Integration Tests**
- Test with real Firestore data
- Validate search accuracy with curated datasets
- Performance benchmarking under load

### **3. Load Testing**
- Concurrent embedding generation
- High-volume search queries
- Cache performance under pressure

---

## 📈 Monitoring & Analytics

### **1. Performance Metrics**
- Embedding generation time
- Search query response time
- Cache hit/miss rates
- API quota usage

### **2. Business Metrics**
- Search result relevance scores
- User engagement with suggested content
- Feature adoption rates

### **3. Error Monitoring**
- API failure rates
- Invalid embedding detection
- Search timeout occurrences

---

## 🚀 Deployment Plan

### **Phase 1: Development (Week 1)**
- Implement core vector service
- Basic embedding generation and storage
- Unit test coverage

### **Phase 2: Integration (Week 2)**
- Integrate with existing relationship services
- Implement similarity search functionality
- Integration test suite

### **Phase 3: Optimization (Week 3)**
- Performance tuning and caching
- Load testing and optimization
- Production monitoring setup

### **Phase 4: Production (Week 4)**
- Gradual rollout with feature flags
- Production monitoring validation
- User acceptance testing

---

**Success Criteria**: 
- ✅ <200ms search response time (95th percentile)
- ✅ >0.8 average similarity relevance score
- ✅ >95% cache hit rate for common queries
- ✅ Zero embedding generation failures
- ✅ Horizontal scaling to 100K+ relationships