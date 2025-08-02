import * as functions from "firebase-functions";
/**
 * Generate AI Prompt for Relationship Management
 * Uses Gemini Flash for fast, contextual suggestions
 */
export declare const generatePrompt: functions.https.CallableFunction<any, Promise<any>, unknown>;
/**
 * Generate Multiple Prompts in Bulk
 * For relationship health analysis and proactive suggestions
 */
export declare const generateBulkPrompts: functions.https.CallableFunction<any, Promise<{
    prompts: any;
    generated: any;
    requested: number;
    duration: any;
}>, unknown>;
/**
 * Evaluate Prompt Relevance
 * Uses AI to score and filter prompts for quality
 */
export declare const evaluatePromptRelevance: functions.https.CallableFunction<any, Promise<{
    evaluations: any;
    timestamp: string;
}>, unknown>;
export declare const promptGeneration: {
    generatePrompt: functions.https.CallableFunction<any, Promise<any>, unknown>;
    generateBulkPrompts: functions.https.CallableFunction<any, Promise<{
        prompts: any;
        generated: any;
        requested: number;
        duration: any;
    }>, unknown>;
    evaluatePromptRelevance: functions.https.CallableFunction<any, Promise<{
        evaluations: any;
        timestamp: string;
    }>, unknown>;
};
//# sourceMappingURL=promptGeneration.d.ts.map