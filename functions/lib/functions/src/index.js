"use strict";
// SOURCE: IMPLEMENTATION_PLAN.md line 86 + Firebase Functions setup
// VERIFIED: Firebase Cloud Functions main entry point for EcoMind AI features
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = exports.healthCheck = exports.createAlertingPolicy = exports.getMetricsData = exports.collectSystemMetrics = exports.recordBatchMetrics = exports.recordCustomMetric = exports.checkGenkitServiceHealth = exports.multiModalRelationshipAnalysis = exports.advancedRelationshipInsights = exports.checkEmbeddingServiceHealth = exports.generateBatchEmbeddings = exports.generateEmbedding = exports.exportUserData = exports.requestDataDeletion = exports.getPrivacySettings = exports.updatePrivacySettings = exports.updateUserStats = exports.getUserProfile = exports.updateUserProfile = exports.onUserDelete = exports.onUserCreate = exports.generateRelationshipInsights = exports.analyzeInteractionSentiment = exports.extractContextFromText = exports.evaluatePromptRelevance = exports.generateBulkPrompts = exports.generatePrompt = void 0;
// Updated for Firebase Functions v6.4.0 - v2 functions (breaking change from v6.0.0)
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK
admin.initializeApp();
// Import function modules
const promptGeneration_1 = require("./promptGeneration");
const contextExtraction_1 = require("./contextExtraction");
const userManagement_1 = require("./userManagement");
const privacyControls_1 = require("./privacyControls");
const embeddingGeneration_1 = require("./embeddingGeneration");
Object.defineProperty(exports, "generateEmbedding", { enumerable: true, get: function () { return embeddingGeneration_1.generateEmbedding; } });
Object.defineProperty(exports, "generateBatchEmbeddings", { enumerable: true, get: function () { return embeddingGeneration_1.generateBatchEmbeddings; } });
Object.defineProperty(exports, "checkEmbeddingServiceHealth", { enumerable: true, get: function () { return embeddingGeneration_1.checkEmbeddingServiceHealth; } });
const genkitWorkflows_1 = require("./genkitWorkflows");
Object.defineProperty(exports, "advancedRelationshipInsights", { enumerable: true, get: function () { return genkitWorkflows_1.advancedRelationshipInsights; } });
Object.defineProperty(exports, "multiModalRelationshipAnalysis", { enumerable: true, get: function () { return genkitWorkflows_1.multiModalRelationshipAnalysis; } });
Object.defineProperty(exports, "checkGenkitServiceHealth", { enumerable: true, get: function () { return genkitWorkflows_1.checkGenkitServiceHealth; } });
const cloudMonitoring_1 = require("./cloudMonitoring");
Object.defineProperty(exports, "recordCustomMetric", { enumerable: true, get: function () { return cloudMonitoring_1.recordCustomMetric; } });
Object.defineProperty(exports, "recordBatchMetrics", { enumerable: true, get: function () { return cloudMonitoring_1.recordBatchMetrics; } });
Object.defineProperty(exports, "collectSystemMetrics", { enumerable: true, get: function () { return cloudMonitoring_1.collectSystemMetrics; } });
Object.defineProperty(exports, "getMetricsData", { enumerable: true, get: function () { return cloudMonitoring_1.getMetricsData; } });
Object.defineProperty(exports, "createAlertingPolicy", { enumerable: true, get: function () { return cloudMonitoring_1.createAlertingPolicy; } });
/**
 * Export all Cloud Functions
 * These functions will be deployed to Firebase and callable from the React Native app
 */
// AI Prompt Generation Functions
exports.generatePrompt = promptGeneration_1.promptGeneration.generatePrompt;
exports.generateBulkPrompts = promptGeneration_1.promptGeneration.generateBulkPrompts;
exports.evaluatePromptRelevance = promptGeneration_1.promptGeneration.evaluatePromptRelevance;
// Context Extraction Functions  
exports.extractContextFromText = contextExtraction_1.contextExtraction.extractContextFromText;
exports.analyzeInteractionSentiment = contextExtraction_1.contextExtraction.analyzeInteractionSentiment;
exports.generateRelationshipInsights = contextExtraction_1.contextExtraction.generateRelationshipInsights;
// User Management Functions
exports.onUserCreate = userManagement_1.userManagement.onUserCreate;
exports.onUserDelete = userManagement_1.userManagement.onUserDelete;
exports.updateUserProfile = userManagement_1.userManagement.updateUserProfile;
exports.getUserProfile = userManagement_1.userManagement.getUserProfile;
exports.updateUserStats = userManagement_1.userManagement.updateUserStats;
// Privacy Control Functions
exports.updatePrivacySettings = privacyControls_1.privacyControls.updatePrivacySettings;
exports.getPrivacySettings = privacyControls_1.privacyControls.getPrivacySettings;
exports.requestDataDeletion = privacyControls_1.privacyControls.requestDataDeletion;
exports.exportUserData = privacyControls_1.privacyControls.exportUserData;
// Health Check Function - Migrated to v2 (Firebase Functions v6.4.0)
exports.healthCheck = (0, https_1.onRequest)(async (req, res) => {
    try {
        // Basic health check
        const timestamp = new Date().toISOString();
        const status = {
            status: "healthy",
            timestamp,
            version: "1.0.0",
            services: {
                firestore: "connected",
                ai: "available",
                functions: "active"
            }
        };
        // Test Firestore connection
        await admin.firestore().collection("_health").doc("check").set({
            lastCheck: timestamp
        });
        res.status(200).json(status);
    }
    catch (error) {
        console.error("Health check failed:", error);
        res.status(500).json({
            status: "unhealthy",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString()
        });
    }
});
// Configuration endpoint for checking environment - Migrated to v2 (Firebase Functions v6.4.0)
exports.getConfig = (0, https_1.onRequest)(async (req, res) => {
    // Only allow GET requests
    if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    try {
        // Migrated from deprecated functions.config() to environment variables (Firebase Functions v6.4.0)
        const config = {
            region: process.env.FIREBASE_DATABASE_URL || "default",
            aiEnabled: !!process.env.GEMINI_API_KEY,
            environment: process.env.NODE_ENV || "development",
            version: "1.0.0"
        };
        res.status(200).json(config);
    }
    catch (error) {
        console.error("Config check failed:", error);
        res.status(500).json({
            error: "Failed to get config",
            timestamp: new Date().toISOString()
        });
    }
});
// Error handling for uncaught exceptions
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
});
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
//# sourceMappingURL=index.js.map