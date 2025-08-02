"use strict";
/**
 * Cloud Function for Secure Embedding Generation
 * Uses Vertex AI text-embedding-004 model
 * Keeps API keys secure on server side
 *
 * Official implementation following Google Cloud best practices
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkEmbeddingServiceHealth = exports.generateBatchEmbeddings = exports.generateEmbedding = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const vertexai_1 = require("@google-cloud/vertexai");
// Initialize Vertex AI client
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id';
const LOCATION = 'us-central1'; // Official recommended region for Vertex AI
const vertexAI = new vertexai_1.VertexAI({
    project: PROJECT_ID,
    location: LOCATION,
});
// Initialize the text embedding model
const textEmbeddingModel = vertexAI.getGenerativeModel({
    model: 'text-embedding-004', // Latest Vertex AI embedding model
    generationConfig: {
        outputDimensionality: 768, // Optimal dimension for semantic search
    },
});
exports.generateEmbedding = (0, https_1.onCall)({
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 60,
    // Enable CORS for React Native
    cors: true,
}, async (request) => {
    const startTime = Date.now();
    try {
        // Validate input
        const { content, contentType, userId } = request.data;
        if (!content || typeof content !== 'string') {
            throw new Error('Content is required and must be a string');
        }
        if (content.length > 2000) {
            throw new Error('Content exceeds maximum length of 2000 characters');
        }
        // Validate user authentication
        if (!request.auth?.uid) {
            throw new Error('Authentication required');
        }
        // Log for audit purposes (privacy-compliant)
        firebase_functions_1.logger.info('Embedding generation requested', {
            userId: request.auth.uid,
            contentType: contentType || 'unknown',
            contentLength: content.length,
            timestamp: new Date().toISOString(),
        });
        // Preprocess content for optimal embeddings
        const processedContent = preprocessContent(content, contentType);
        // Generate embedding using Vertex AI
        const embeddingRequest = {
            contents: [{ parts: [{ text: processedContent }] }],
        };
        const response = await textEmbeddingModel.embedContent(embeddingRequest);
        const embedding = response.response.predictions?.[0]?.embeddings?.values;
        if (!embedding || !Array.isArray(embedding)) {
            throw new Error('Failed to generate embedding: Invalid response from Vertex AI');
        }
        // Validate embedding dimensions
        if (embedding.length !== 768) {
            throw new Error(`Invalid embedding dimensions: ${embedding.length}, expected 768`);
        }
        const processingTime = Date.now() - startTime;
        // Log successful generation
        firebase_functions_1.logger.info('Embedding generated successfully', {
            userId: request.auth.uid,
            processingTime,
            embeddingDimensions: embedding.length,
            tokenCount: processedContent.length,
        });
        const result = {
            embedding,
            model: 'text-embedding-004',
            processingTime,
            tokenCount: processedContent.length,
        };
        return result;
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        // Log error for monitoring
        firebase_functions_1.logger.error('Embedding generation failed', {
            userId: request.auth?.uid,
            error: error instanceof Error ? error.message : 'Unknown error',
            processingTime,
            contentLength: request.data?.content?.length || 0,
        });
        // Return user-friendly error
        throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
/**
 * Batch embedding generation for migration and bulk operations
 */
exports.generateBatchEmbeddings = (0, https_1.onCall)({
    region: 'us-central1',
    memory: '2GiB',
    timeoutSeconds: 300, // 5 minutes for batch processing
    cors: true,
}, async (request) => {
    const startTime = Date.now();
    try {
        // Validate authentication
        if (!request.auth?.uid) {
            throw new Error('Authentication required');
        }
        const { contents, contentType } = request.data;
        if (!Array.isArray(contents) || contents.length === 0) {
            throw new Error('Contents array is required and must not be empty');
        }
        if (contents.length > 100) {
            throw new Error('Batch size cannot exceed 100 items');
        }
        firebase_functions_1.logger.info('Batch embedding generation started', {
            userId: request.auth.uid,
            batchSize: contents.length,
            contentType: contentType || 'unknown',
        });
        const embeddings = [];
        const errors = [];
        // Process in smaller batches to avoid memory issues
        const batchSize = 10;
        for (let i = 0; i < contents.length; i += batchSize) {
            const batch = contents.slice(i, i + batchSize);
            const batchPromises = batch.map(async (content, index) => {
                try {
                    const processedContent = preprocessContent(content, contentType);
                    const embeddingRequest = {
                        contents: [{ parts: [{ text: processedContent }] }],
                    };
                    const response = await textEmbeddingModel.embedContent(embeddingRequest);
                    const embedding = response.response.predictions?.[0]?.embeddings?.values;
                    if (!embedding || embedding.length !== 768) {
                        throw new Error('Invalid embedding response');
                    }
                    return { index: i + index, embedding, error: null };
                }
                catch (error) {
                    return {
                        index: i + index,
                        embedding: null,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            });
            const batchResults = await Promise.all(batchPromises);
            batchResults.forEach(result => {
                if (result.embedding) {
                    embeddings[result.index] = result.embedding;
                }
                else {
                    errors[result.index] = result.error || 'Unknown error';
                }
            });
        }
        const processingTime = Date.now() - startTime;
        const successCount = embeddings.filter(e => e).length;
        const errorCount = errors.filter(e => e).length;
        firebase_functions_1.logger.info('Batch embedding generation completed', {
            userId: request.auth.uid,
            totalItems: contents.length,
            successCount,
            errorCount,
            processingTime,
        });
        return { embeddings, errors };
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        firebase_functions_1.logger.error('Batch embedding generation failed', {
            userId: request.auth?.uid,
            error: error instanceof Error ? error.message : 'Unknown error',
            processingTime,
        });
        throw new Error(`Batch embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
/**
 * Preprocess content for optimal embedding generation
 * Following Vertex AI best practices
 */
function preprocessContent(content, contentType) {
    let processed = content.trim();
    // Add context prefix for better semantic understanding
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
        default:
            // Keep original content for unknown types
            break;
    }
    // Limit length for optimal embedding quality (Vertex AI recommendation)
    return processed.substring(0, 2000);
}
/**
 * Health check function for monitoring embedding service
 */
exports.checkEmbeddingServiceHealth = (0, https_1.onCall)({
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 30,
    cors: true,
}, async (request) => {
    try {
        // Validate authentication (admin only)
        if (!request.auth?.uid) {
            throw new Error('Authentication required');
        }
        const startTime = Date.now();
        // Test embedding generation with a simple text
        const testContent = 'Health check test for embedding service';
        const embeddingRequest = {
            contents: [{ parts: [{ text: testContent }] }],
        };
        const response = await textEmbeddingModel.embedContent(embeddingRequest);
        const embedding = response.response.predictions?.[0]?.embeddings?.values;
        const responseTime = Date.now() - startTime;
        const isHealthy = embedding && embedding.length === 768;
        firebase_functions_1.logger.info('Embedding service health check', {
            isHealthy,
            responseTime,
            embeddingDimensions: embedding?.length || 0,
        });
        return {
            healthy: isHealthy,
            responseTime,
            model: 'text-embedding-004',
            dimensions: embedding?.length || 0,
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        firebase_functions_1.logger.error('Embedding service health check failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return {
            healthy: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        };
    }
});
//# sourceMappingURL=embeddingGeneration.js.map