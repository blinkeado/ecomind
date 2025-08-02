import * as functions from "firebase-functions";
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
export declare const extractContextFromText: functions.https.CallableFunction<any, Promise<ExtractedContext>, unknown>;
/**
 * Analyze Interaction Sentiment
 * Processes multiple interactions to identify relationship trends
 */
export declare const analyzeInteractionSentiment: functions.https.CallableFunction<any, Promise<SentimentAnalysisResult>, unknown>;
/**
 * Generate Relationship Insights
 * Creates comprehensive relationship analysis and recommendations
 */
export declare const generateRelationshipInsights: functions.https.CallableFunction<any, Promise<any>, unknown>;
export declare const contextExtraction: {
    extractContextFromText: functions.https.CallableFunction<any, Promise<ExtractedContext>, unknown>;
    analyzeInteractionSentiment: functions.https.CallableFunction<any, Promise<SentimentAnalysisResult>, unknown>;
    generateRelationshipInsights: functions.https.CallableFunction<any, Promise<any>, unknown>;
};
export {};
//# sourceMappingURL=contextExtraction.d.ts.map