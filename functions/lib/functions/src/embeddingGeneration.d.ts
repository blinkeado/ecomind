/**
 * Cloud Function for Secure Embedding Generation
 * Uses Vertex AI text-embedding-004 model
 * Keeps API keys secure on server side
 *
 * Official implementation following Google Cloud best practices
 */
import { EmbeddingRequest, EmbeddingResponse } from '../../src/types/vectorSearch';
export declare const generateEmbedding: import("firebase-functions/v2/https").CallableFunction<EmbeddingRequest, Promise<EmbeddingResponse>, unknown>;
/**
 * Batch embedding generation for migration and bulk operations
 */
export declare const generateBatchEmbeddings: import("firebase-functions/v2/https").CallableFunction<{
    contents: string[];
    contentType?: string | undefined;
}, Promise<{
    embeddings: number[][];
    errors: string[];
}>, unknown>;
/**
 * Health check function for monitoring embedding service
 */
export declare const checkEmbeddingServiceHealth: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    healthy: boolean;
    responseTime: number;
    model: string;
    dimensions: number;
    timestamp: string;
    error?: undefined;
} | {
    healthy: boolean;
    error: string;
    timestamp: string;
    responseTime?: undefined;
    model?: undefined;
    dimensions?: undefined;
}>, unknown>;
//# sourceMappingURL=embeddingGeneration.d.ts.map