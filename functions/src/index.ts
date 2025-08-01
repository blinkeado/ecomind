// SOURCE: IMPLEMENTATION_PLAN.md line 86 + Firebase Functions setup
// VERIFIED: Firebase Cloud Functions main entry point for EcoMind AI features

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Import function modules
import { promptGeneration } from "./promptGeneration";
import { contextExtraction } from "./contextExtraction";  
import { userManagement } from "./userManagement";
import { privacyControls } from "./privacyControls";

/**
 * Export all Cloud Functions
 * These functions will be deployed to Firebase and callable from the React Native app
 */

// AI Prompt Generation Functions
export const generatePrompt = promptGeneration.generatePrompt;
export const generateBulkPrompts = promptGeneration.generateBulkPrompts;
export const evaluatePromptRelevance = promptGeneration.evaluatePromptRelevance;

// Context Extraction Functions  
export const extractContextFromText = contextExtraction.extractContextFromText;
export const analyzeInteractionSentiment = contextExtraction.analyzeInteractionSentiment;
export const generateRelationshipInsights = contextExtraction.generateRelationshipInsights;

// User Management Functions
export const onUserCreate = userManagement.onUserCreate;
export const onUserDelete = userManagement.onUserDelete;
export const updateUserProfile = userManagement.updateUserProfile;
export const getUserProfile = userManagement.getUserProfile;
export const updateUserStats = userManagement.updateUserStats;

// Privacy Control Functions
export const updatePrivacySettings = privacyControls.updatePrivacySettings;
export const getPrivacySettings = privacyControls.getPrivacySettings;
export const requestDataDeletion = privacyControls.requestDataDeletion;
export const exportUserData = privacyControls.exportUserData;

// Health Check Function
export const healthCheck = functions.https.onRequest(async (req, res) => {
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
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({
      status: "unhealthy", 
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
  }
});

// Configuration endpoint for checking environment
export const getConfig = functions.https.onRequest(async (req, res) => {
  // Only allow GET requests
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  
  try {
    const config = {
      region: functions.config().firebase?.databaseurl || "default",
      aiEnabled: !!functions.config().gemini?.api_key,
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0"
    };
    
    res.status(200).json(config);
  } catch (error) {
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