/**
 * Firebase Studio Genkit AI Workflows
 * Advanced AI workflow orchestration using official Genkit framework
 *
 * UPGRADED TO GENKIT v1.15.5 (August 2025)
 * Official implementation following Firebase Genkit documentation
 *
 * v1.15.5 Features:
 * - Enhanced streaming support and abort signal handling
 * - New model support (Veo 2, Imagen 3)
 * - Google AI plugin with improved API compatibility
 * - Dynamic model and tool support
 * - Multi-step AI workflows with Gemini 1.5 Flash
 * - Advanced relationship analysis and insights
 * - Multi-modal processing capabilities
 * - Production-ready error handling and monitoring
 */
export declare const advancedRelationshipInsights: import("firebase-functions/v2/https").CallableFunction<any, Promise<any>, unknown>;
export declare const multiModalRelationshipAnalysis: import("firebase-functions/v2/https").CallableFunction<any, Promise<any>, unknown>;
export declare const checkGenkitServiceHealth: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    status: string;
    services: {
        genkit_core: boolean;
        gemini_model: boolean;
        workflow_orchestration: boolean;
        multi_modal: boolean;
    };
    performance: {
        responseTime: number;
        timestamp: string;
    };
    error?: undefined;
} | {
    status: string;
    services: {
        genkit_core: boolean;
        gemini_model: boolean;
        workflow_orchestration: boolean;
        multi_modal: boolean;
    };
    error: string;
    performance?: undefined;
}>, unknown>;
//# sourceMappingURL=genkitWorkflows.d.ts.map