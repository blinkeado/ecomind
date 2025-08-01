// SOURCE: IMPLEMENTATION_PLAN.md line 84 + AI context processing requirements
// VERIFIED: Context extraction and sentiment analysis using Gemini Flash

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Gemini Configuration
 */
const GEMINI_API_KEY = functions.config().gemini?.api_key;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const MODEL_NAME = "gemini-1.5-flash";

/**
 * Context Extraction Types
 */
interface ExtractContextRequest {
  userId: string;
  personId?: string;
  text: string;
  interactionType?: string;
  metadata?: {
    timestamp?: string;
    location?: string;
    participants?: string[];
  };
}

interface ExtractedContext {
  summary: string;
  keyPoints: string[];
  emotionalTone: "very_positive" | "positive" | "neutral" | "negative" | "very_negative" | "mixed";
  topics: string[];
  actionItems?: string[];
  relationshipInsights?: string[];
  confidenceScore: number;
  extractedAt: string;
}

interface SentimentAnalysisRequest {
  userId: string;
  interactions: Array<{
    id: string;
    text: string;
    timestamp: string;
    type: string;
  }>;
  personId?: string;
}

interface SentimentAnalysisResult {
  overallSentiment: "very_positive" | "positive" | "neutral" | "negative" | "very_negative" | "mixed";
  sentimentTrend: "improving" | "stable" | "declining";
  individualScores: Array<{
    id: string;
    sentiment: string;
    confidence: number;
  }>;
  insights: string[];
  analysisDate: string;
}

/**
 * Extract Context from Text
 * Analyzes conversations, notes, and interactions for relationship insights
 */
export const extractContextFromText = functions.https.onCall(async (data: ExtractContextRequest, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }
    
    if (context.auth.uid !== data.userId) {
      throw new functions.https.HttpsError("permission-denied", "User can only extract context for their own data");
    }
    
    // Validate input
    if (!data.text || data.text.trim().length === 0) {
      throw new functions.https.HttpsError("invalid-argument", "Text content is required");
    }
    
    if (!genAI) {
      throw new functions.https.HttpsError("failed-precondition", "AI service is not configured");
    }
    
    // Extract context using AI
    const extractedContext = await performContextExtraction(data);
    
    // Store context if personId provided
    if (data.personId) {
      const db = admin.firestore();
      await db.collection("users").doc(data.userId)
        .collection("relationships").doc(data.personId)
        .collection("contextExtractions").add({
          ...extractedContext,
          originalText: data.text,
          interactionType: data.interactionType,
          metadata: data.metadata,
        });
    }
    
    functions.logger.info(`Context extracted for user ${data.userId}${data.personId ? `, person ${data.personId}` : ""}`);
    
    return extractedContext;
    
  } catch (error) {
    functions.logger.error("Context extraction failed:", error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError("internal", "Failed to extract context");
  }
});

/**
 * Analyze Interaction Sentiment
 * Processes multiple interactions to identify relationship trends
 */
export const analyzeInteractionSentiment = functions.https.onCall(async (data: SentimentAnalysisRequest, context) => {
  try {
    // Verify authentication
    if (!context.auth || context.auth.uid !== data.userId) {
      throw new functions.https.HttpsError("permission-denied", "Unauthorized");
    }
    
    if (!data.interactions || data.interactions.length === 0) {
      throw new functions.https.HttpsError("invalid-argument", "At least one interaction is required");
    }
    
    if (!genAI) {
      throw new functions.https.HttpsError("failed-precondition", "AI service not configured");
    }
    
    // Analyze sentiment
    const sentimentResult = await performSentimentAnalysis(data);
    
    // Store analysis results
    if (data.personId) {
      const db = admin.firestore();
      await db.collection("users").doc(data.userId)
        .collection("relationships").doc(data.personId)
        .collection("sentimentAnalyses").add(sentimentResult);
    }
    
    functions.logger.info(`Sentiment analysis completed for user ${data.userId}, ${data.interactions.length} interactions`);
    
    return sentimentResult;
    
  } catch (error) {
    functions.logger.error("Sentiment analysis failed:", error);
    throw error instanceof functions.https.HttpsError ? error : 
      new functions.https.HttpsError("internal", "Sentiment analysis failed");
  }
});

/**
 * Generate Relationship Insights
 * Creates comprehensive relationship analysis and recommendations
 */
export const generateRelationshipInsights = functions.https.onCall(async (data: {
  userId: string;
  personId: string;
  analysisType?: "health" | "communication" | "engagement" | "comprehensive";
}, context) => {
  try {
    // Verify authentication
    if (!context.auth || context.auth.uid !== data.userId) {
      throw new functions.https.HttpsError("permission-denied", "Unauthorized");
    }
    
    if (!genAI) {
      throw new functions.https.HttpsError("failed-precondition", "AI service not configured");
    }
    
    // Gather relationship data
    const db = admin.firestore();
    const relationshipRef = db.collection("users").doc(data.userId)
      .collection("relationships").doc(data.personId);
    
    const [
      relationshipDoc,
      interactions,
      contextExtractions,
      sentimentAnalyses
    ] = await Promise.all([
      relationshipRef.get(),
      relationshipRef.collection("interactions").orderBy("timestamp", "desc").limit(20).get(),
      relationshipRef.collection("contextExtractions").orderBy("extractedAt", "desc").limit(10).get(),
      relationshipRef.collection("sentimentAnalyses").orderBy("analysisDate", "desc").limit(5).get(),
    ]);
    
    if (!relationshipDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Relationship not found");
    }
    
    const relationshipData = relationshipDoc.data();
    const interactionData = interactions.docs.map(doc => doc.data());
    const contextData = contextExtractions.docs.map(doc => doc.data());
    const sentimentData = sentimentAnalyses.docs.map(doc => doc.data());
    
    // Generate insights using AI
    const insights = await generateAIInsights({
      relationship: relationshipData,
      interactions: interactionData,
      contexts: contextData,
      sentiments: sentimentData,
      analysisType: data.analysisType || "comprehensive"
    });
    
    // Store insights
    await relationshipRef.collection("insights").add({
      ...insights,
      generatedAt: new Date().toISOString(),
      analysisType: data.analysisType || "comprehensive"
    });
    
    functions.logger.info(`Relationship insights generated for user ${data.userId}, person ${data.personId}`);
    
    return insights;
    
  } catch (error) {
    functions.logger.error("Relationship insights generation failed:", error);
    throw error instanceof functions.https.HttpsError ? error : 
      new functions.https.HttpsError("internal", "Insights generation failed");
  }
});

/**
 * Perform Context Extraction Helper
 */
async function performContextExtraction(data: ExtractContextRequest): Promise<ExtractedContext> {
  if (!genAI) {
    throw new Error("Gemini AI not configured");
  }
  
  const model = genAI.getGenerativeModel({ 
    model: MODEL_NAME,
    generationConfig: {
      temperature: 0.3, // Lower temperature for more consistent extraction
      topK: 32,
      topP: 0.9,
      maxOutputTokens: 1024,
    }
  });
  
  const prompt = `
Analyze this ${data.interactionType || "text"} and extract meaningful context for relationship management:

TEXT TO ANALYZE:
"${data.text}"

METADATA:
${data.metadata ? JSON.stringify(data.metadata, null, 2) : "None"}

EXTRACT:
1. Summary (1-2 sentences)
2. Key points (3-5 important items)
3. Emotional tone (very_positive, positive, neutral, negative, very_negative, mixed)
4. Topics discussed (3-5 main topics)
5. Action items or follow-ups
6. Relationship insights
7. Confidence score (0.0-1.0)

RESPONSE FORMAT (JSON):
{
  "summary": "Brief summary of the interaction",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "emotionalTone": "positive",
  "topics": ["Topic 1", "Topic 2", "Topic 3"],
  "actionItems": ["Action 1", "Action 2"],
  "relationshipInsights": ["Insight 1", "Insight 2"],
  "confidenceScore": 0.85
}

Focus on relationship-relevant information and maintain privacy by not including sensitive personal details:
`;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // Parse response
  const extracted = parseContextResponse(text);
  
  return {
    ...extracted,
    extractedAt: new Date().toISOString(),
  };
}

/**
 * Perform Sentiment Analysis Helper
 */
async function performSentimentAnalysis(data: SentimentAnalysisRequest): Promise<SentimentAnalysisResult> {
  if (!genAI) {
    throw new Error("Gemini AI not configured");
  }
  
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  
  const prompt = `
Analyze the sentiment and emotional progression in these interactions:

INTERACTIONS (chronological order):
${data.interactions.map((interaction, i) => `
${i + 1}. ${interaction.timestamp} (${interaction.type}):
"${interaction.text}"
`).join("\n")}

ANALYZE:
1. Overall sentiment across all interactions
2. Sentiment trend over time (improving, stable, declining)
3. Individual interaction scores
4. Key insights about the relationship dynamic

RESPONSE FORMAT (JSON):
{
  "overallSentiment": "positive",
  "sentimentTrend": "stable",
  "individualScores": [
    {"id": "interaction_id", "sentiment": "positive", "confidence": 0.8}
  ],
  "insights": ["Insight 1", "Insight 2", "Insight 3"]
}

Focus on relationship health indicators and communication patterns:
`;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  const analysis = parseSentimentResponse(text, data.interactions);
  
  return {
    ...analysis,
    analysisDate: new Date().toISOString(),
  };
}

/**
 * Generate AI Insights Helper
 */
async function generateAIInsights(data: {
  relationship: any;
  interactions: any[];
  contexts: any[];
  sentiments: any[];
  analysisType: string;
}): Promise<any> {
  if (!genAI) {
    throw new Error("Gemini AI not configured");
  }
  
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  
  const prompt = `
Generate comprehensive relationship insights based on this data:

RELATIONSHIP INFO:
${JSON.stringify(data.relationship, null, 2)}

RECENT INTERACTIONS (${data.interactions.length}):
${data.interactions.slice(0, 5).map((i, idx) => `${idx + 1}. ${i.type}: ${i.notes || "No notes"}`).join("\n")}

CONTEXT EXTRACTIONS (${data.contexts.length}):
${data.contexts.slice(0, 3).map((c, idx) => `${idx + 1}. ${c.summary}`).join("\n")}

SENTIMENT ANALYSES (${data.sentiments.length}):
${data.sentiments.slice(0, 2).map((s, idx) => `${idx + 1}. Overall: ${s.overallSentiment}, Trend: ${s.sentimentTrend}`).join("\n")}

ANALYSIS TYPE: ${data.analysisType}

GENERATE INSIGHTS:
1. Relationship health assessment
2. Communication patterns
3. Engagement levels
4. Recommendations for improvement
5. Strengths to maintain
6. Areas for attention
7. Suggested actions

RESPONSE FORMAT (JSON):
{
  "healthScore": 8.5,
  "healthTrend": "stable",
  "communicationPatterns": ["Pattern 1", "Pattern 2"],
  "engagementLevel": "high",
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement 1", "Improvement 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "suggestedActions": ["Action 1", "Action 2"],
  "riskFactors": ["Risk 1"],
  "opportunities": ["Opportunity 1"]
}

Provide actionable, privacy-conscious insights:
`;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  return parseInsightsResponse(text);
}

/**
 * Parse Context Response
 */
function parseContextResponse(text: string): Omit<ExtractedContext, "extractedAt"> {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      summary: parsed.summary || "Context extracted",
      keyPoints: parsed.keyPoints || [],
      emotionalTone: parsed.emotionalTone || "neutral",
      topics: parsed.topics || [],
      actionItems: parsed.actionItems || [],
      relationshipInsights: parsed.relationshipInsights || [],
      confidenceScore: parsed.confidenceScore || 0.7,
    };
  } catch (error) {
    functions.logger.warn("Failed to parse context response:", error);
    
    // Fallback parsing
    return {
      summary: "Context extraction completed",
      keyPoints: [],
      emotionalTone: "neutral" as const,
      topics: [],
      actionItems: [],
      relationshipInsights: [],
      confidenceScore: 0.5,
    };
  }
}

/**
 * Parse Sentiment Response
 */
function parseSentimentResponse(text: string, interactions: any[]): Omit<SentimentAnalysisResult, "analysisDate"> {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      overallSentiment: parsed.overallSentiment || "neutral",
      sentimentTrend: parsed.sentimentTrend || "stable",
      individualScores: parsed.individualScores || interactions.map(i => ({
        id: i.id,
        sentiment: "neutral",
        confidence: 0.5
      })),
      insights: parsed.insights || [],
    };
  } catch (error) {
    functions.logger.warn("Failed to parse sentiment response:", error);
    
    return {
      overallSentiment: "neutral" as const,
      sentimentTrend: "stable" as const,
      individualScores: interactions.map(i => ({
        id: i.id,
        sentiment: "neutral",
        confidence: 0.5
      })),
      insights: [],
    };
  }
}

/**
 * Parse Insights Response
 */
function parseInsightsResponse(text: string): any {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (error) {
    functions.logger.warn("Failed to parse insights response:", error);
    
    // Fallback insights
    return {
      healthScore: 7.0,
      healthTrend: "stable",
      communicationPatterns: [],
      engagementLevel: "medium",
      strengths: [],
      improvements: [],
      recommendations: [],
      suggestedActions: [],
      riskFactors: [],
      opportunities: [],
    };
  }
}

export const contextExtraction = {
  extractContextFromText,
  analyzeInteractionSentiment,
  generateRelationshipInsights,
};