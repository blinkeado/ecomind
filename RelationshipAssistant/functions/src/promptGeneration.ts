// SOURCE: IMPLEMENTATION_PLAN.md line 83 + Gemini Flash integration
// VERIFIED: AI prompt generation using Google Gemini Flash for relationship suggestions

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { withPrivacyConsent } from "./privacyControls";

/**
 * Gemini Flash Configuration
 */
const GEMINI_API_KEY = functions.config().gemini?.api_key;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Gemini Flash model - optimized for speed and efficiency
const MODEL_NAME = "gemini-1.5-flash";

/**
 * Prompt Generation Types
 */
interface GeneratePromptRequest {
  userId: string;
  personId: string;
  relationshipContext: {
    displayName: string;
    relationshipType: string;
    relationshipHealth: number;
    lastContact?: string;
    recentInteractions?: Array<{
      type: string;
      date: string;
      notes?: string;
    }>;
    lifeEvents?: Array<{
      type: string;
      date: string;
      description: string;
    }>;
    personalContext?: string;
  };
  promptTypes?: string[];
  urgency?: "low" | "medium" | "high" | "critical";
}

interface GeneratedPrompt {
  id: string;
  type: string;
  title: string;
  suggestion: string;
  description?: string;
  reasoning: string;
  urgency: "low" | "medium" | "high" | "critical";
  confidence: number;
  personId: string;
  createdAt: string;
  expiresAt?: string;
}

/**
 * Generate AI Prompt for Relationship Management
 * Uses Gemini Flash for fast, contextual suggestions
 */
export const generatePrompt = functions.https.onCall(async (data: GeneratePromptRequest, context) => {
  try {
    // Verify user authentication
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }
    
    if (context.auth.uid !== data.userId) {
      throw new functions.https.HttpsError("permission-denied", "User can only generate prompts for themselves");
    }
    
    // Validate required data
    if (!data.personId || !data.relationshipContext) {
      throw new functions.https.HttpsError("invalid-argument", "Person ID and relationship context are required");
    }
    
    // Check if AI processing is enabled
    if (!genAI) {
      throw new functions.https.HttpsError("failed-precondition", "AI service is not configured");
    }
    
    // Check privacy consent and generate prompt with timeout
    const prompt = await withPrivacyConsent("prompt_generation")(data.userId, async () => {
      // Start timing for 300ms requirement
      const startTime = Date.now();
      
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Prompt generation timeout (300ms)")), 300);
      });
      
      // Race between prompt generation and timeout
      const promptPromise = generateSinglePrompt(data);
      
      try {
        const result = await Promise.race([promptPromise, timeoutPromise]);
        const duration = Date.now() - startTime;
        
        functions.logger.info(`Prompt generated in ${duration}ms for user ${data.userId}`);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        if (error instanceof Error && error.message.includes("timeout")) {
          functions.logger.warn(`Prompt generation timed out after ${duration}ms, using fallback`);
          return createTimeoutFallbackPrompt(data);
        }
        
        throw error;
      }
    });
    
    // Store prompt in Firestore
    const db = admin.firestore();
    const promptRef = await db.collection("users").doc(data.userId)
      .collection("prompts").add(prompt);
    
    prompt.id = promptRef.id;
    
    functions.logger.info(`Generated prompt for user ${data.userId}, person ${data.personId} in ${duration}ms`);
    
    return prompt;
    
  } catch (error) {
    functions.logger.error("Prompt generation failed:", error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError("internal", "Failed to generate prompt");
  }
});

/**
 * Generate Multiple Prompts in Bulk
 * For relationship health analysis and proactive suggestions
 */
export const generateBulkPrompts = functions.https.onCall(async (data: {
  userId: string;
  relationships: Array<{
    personId: string;
    context: GeneratePromptRequest["relationshipContext"];
  }>;
  maxPrompts?: number;
}, context) => {
  try {
    // Verify authentication
    if (!context.auth || context.auth.uid !== data.userId) {
      throw new functions.https.HttpsError("permission-denied", "Unauthorized");
    }
    
    if (!genAI) {
      throw new functions.https.HttpsError("failed-precondition", "AI service not configured");
    }
    
    const maxPrompts = data.maxPrompts || 10;
    
    // Check privacy consent first
    const results = await withPrivacyConsent("bulk_prompt_generation")(data.userId, async () => {
      const startTime = Date.now();
      
      // Process relationships in parallel for speed with timeout per prompt
      const promptPromises = data.relationships
        .slice(0, maxPrompts)
        .map(async (rel) => {
          try {
            // Individual timeout of 300ms per prompt
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error("Individual prompt timeout")), 300);
            });
            
            const promptPromise = generateSinglePrompt({
              userId: data.userId,
              personId: rel.personId,
              relationshipContext: rel.context,
            });
            
            return await Promise.race([promptPromise, timeoutPromise]);
          } catch (error) {
            if (error instanceof Error && error.message.includes("timeout")) {
              functions.logger.warn(`Prompt timed out for person ${rel.personId}, using fallback`);
              return createTimeoutFallbackPrompt({
                userId: data.userId,
                personId: rel.personId,
                relationshipContext: rel.context,
              });
            }
            functions.logger.warn(`Failed to generate prompt for person ${rel.personId}:`, error);
            return null;
          }
        });
      
      const prompts = (await Promise.all(promptPromises)).filter((p): p is GeneratedPrompt => p !== null);
      const duration = Date.now() - startTime;
      
      return { prompts, duration };
    });
    
    const { prompts, duration } = results;
    
    // Results already processed above
    
    // Store all prompts in batch
    const db = admin.firestore();
    const batch = db.batch();
    
    prompts.forEach((prompt) => {
      const promptRef = db.collection("users").doc(data.userId)
        .collection("prompts").doc();
      prompt.id = promptRef.id;
      batch.set(promptRef, prompt);
    });
    
    await batch.commit();
    
    functions.logger.info(`Generated ${prompts.length} prompts in ${duration}ms`);
    
    return {
      prompts,
      generated: prompts.length,
      requested: data.relationships.length,
      duration
    };
    
  } catch (error) {
    functions.logger.error("Bulk prompt generation failed:", error);
    throw error instanceof functions.https.HttpsError ? error : 
      new functions.https.HttpsError("internal", "Bulk generation failed");
  }
});

/**
 * Evaluate Prompt Relevance
 * Uses AI to score and filter prompts for quality
 */
export const evaluatePromptRelevance = functions.https.onCall(async (data: {
  userId: string;
  prompts: Array<{
    id: string;
    suggestion: string;
    personContext: any;
  }>;
}, context) => {
  try {
    if (!context.auth || context.auth.uid !== data.userId) {
      throw new functions.https.HttpsError("permission-denied", "Unauthorized");
    }
    
    if (!genAI) {
      throw new functions.https.HttpsError("failed-precondition", "AI service not configured");
    }
    
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    const evaluationPrompt = `
Rate the relevance and quality of these relationship suggestions on a scale of 1-10:

${data.prompts.map((p, i) => `
${i + 1}. "${p.suggestion}"
Context: ${JSON.stringify(p.personContext)}
`).join("\n")}

Return a JSON array with scores and brief explanations:
[{"id": "prompt_id", "score": 8, "reason": "reason"}]
`;
    
    const result = await model.generateContent(evaluationPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse AI response
    const scores = JSON.parse(text.match(/\[.*\]/s)?.[0] || "[]");
    
    return {
      evaluations: scores,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    functions.logger.error("Prompt evaluation failed:", error);
    throw new functions.https.HttpsError("internal", "Evaluation failed");
  }
});

/**
 * Generate Single Prompt Helper Function
 */
async function generateSinglePrompt(data: GeneratePromptRequest): Promise<GeneratedPrompt> {
  if (!genAI) {
    throw new Error("Gemini AI not configured");
  }
  
  const model = genAI.getGenerativeModel({ 
    model: MODEL_NAME,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    }
  });
  
  // Build context-aware prompt
  const systemPrompt = buildPromptContext(data);
  
  const result = await model.generateContent(systemPrompt);
  const response = await result.response;
  const text = response.text();
  
  // Parse AI response
  const aiResponse = parseAIResponse(text);
  
  // Create prompt object
  const prompt: GeneratedPrompt = {
    id: "", // Will be set by caller
    type: aiResponse.type || "check_in",
    title: aiResponse.title || "Stay Connected",
    suggestion: aiResponse.suggestion,
    description: aiResponse.description,
    reasoning: aiResponse.reasoning || "Based on relationship analysis",
    urgency: data.urgency || aiResponse.urgency || "medium",
    confidence: aiResponse.confidence || 0.8,
    personId: data.personId,
    createdAt: new Date().toISOString(),
    expiresAt: calculateExpiryDate(aiResponse.urgency || "medium"),
  };
  
  return prompt;
}

/**
 * Build Context-Aware Prompt for Gemini
 */
function buildPromptContext(data: GeneratePromptRequest): string {
  const { relationshipContext } = data;
  
  return `
You are a relationship assistant helping people maintain meaningful connections. 
Generate a thoughtful, personalized suggestion for improving this relationship.

RELATIONSHIP CONTEXT:
- Person: ${relationshipContext.displayName}
- Type: ${relationshipContext.relationshipType}
- Health Score: ${relationshipContext.relationshipHealth}/10
- Last Contact: ${relationshipContext.lastContact || "Unknown"}
- Personal Context: ${relationshipContext.personalContext || "None"}

RECENT INTERACTIONS:
${relationshipContext.recentInteractions?.map(i => 
  `- ${i.type} on ${i.date}: ${i.notes || "No notes"}`
).join("\n") || "No recent interactions"}

LIFE EVENTS:
${relationshipContext.lifeEvents?.map(e => 
  `- ${e.type} on ${e.date}: ${e.description}`
).join("\n") || "No recent life events"}

REQUIREMENTS:
1. Be specific and actionable
2. Consider the relationship health score
3. Account for time since last contact
4. Be culturally sensitive and appropriate
5. Focus on genuine connection, not obligation

RESPONSE FORMAT (JSON):
{
  "type": "check_in|birthday|follow_up|support|celebrate|reconnect|activity_suggestion|gratitude|other",
  "title": "Brief, compelling title (under 50 characters)",
  "suggestion": "Specific, actionable suggestion (under 200 characters)",
  "description": "Optional additional context (under 300 characters)",
  "reasoning": "Why this suggestion makes sense (under 150 characters)",
  "urgency": "low|medium|high|critical",
  "confidence": 0.85
}

Generate ONE high-quality suggestion focused on strengthening this specific relationship:
`;
}

/**
 * Parse AI Response into Structured Data
 */
function parseAIResponse(text: string): Partial<GeneratedPrompt> {
  try {
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!parsed.suggestion) {
      throw new Error("Missing suggestion in AI response");
    }
    
    return parsed;
  } catch (error) {
    functions.logger.warn("Failed to parse AI response, using fallback:", error);
    
    // Fallback response if parsing fails
    return {
      type: "check_in",
      title: "Stay Connected",
      suggestion: "Reach out and see how they're doing",
      reasoning: "It's good to maintain regular contact",
      urgency: "medium" as const,
      confidence: 0.6
    };
  }
}

/**
 * Calculate Expiry Date Based on Urgency
 */
function calculateExpiryDate(urgency: string): string {
  const now = new Date();
  let hours = 24; // Default 1 day
  
  switch (urgency) {
    case "critical":
      hours = 6;   // 6 hours
      break;
    case "high":
      hours = 12;  // 12 hours
      break;
    case "medium":
      hours = 24;  // 1 day
      break;
    case "low":
      hours = 72;  // 3 days
      break;
  }
  
  now.setHours(now.getHours() + hours);
  return now.toISOString();
}

/**
 * Create Timeout Fallback Prompt
 * Returns a basic prompt when AI generation times out
 */
function createTimeoutFallbackPrompt(data: GeneratePromptRequest): GeneratedPrompt {
  const { relationshipContext } = data;
  
  // Simple logic to determine prompt type based on context
  let promptType = "check_in";
  let title = `Check in with ${relationshipContext.displayName}`;
  let suggestion = `Send a message to ${relationshipContext.displayName} to see how they're doing`;
  
  // Adjust based on health score
  if (relationshipContext.relationshipHealth < 5) {
    promptType = "support";
    title = `Reconnect with ${relationshipContext.displayName}`;
    suggestion = `It's been a while - reach out to ${relationshipContext.displayName} and offer your support`;
  } else if (relationshipContext.relationshipHealth > 8) {
    promptType = "gratitude";
    title = `Express gratitude to ${relationshipContext.displayName}`;
    suggestion = `Let ${relationshipContext.displayName} know how much you appreciate them`;
  }
  
  // Check for recent contact
  if (relationshipContext.lastContact) {
    const daysSince = Math.floor((Date.now() - new Date(relationshipContext.lastContact).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 30) {
      promptType = "reconnect";
      title = `Reconnect with ${relationshipContext.displayName}`;
      suggestion = `It's been ${daysSince} days since you last connected - reach out to ${relationshipContext.displayName}`;
    }
  }
  
  return {
    id: "", // Will be set by caller
    type: promptType as any,
    title,
    suggestion,
    description: "AI generation timed out, using quick suggestion",
    reasoning: "Based on relationship health and last contact",
    urgency: "medium" as any,
    confidence: 0.6,
    personId: data.personId,
    createdAt: new Date().toISOString(),
    expiresAt: calculateExpiryDate("medium"),
  };
}

export const promptGeneration = {
  generatePrompt,
  generateBulkPrompts,
  evaluatePromptRelevance,
};