/**
 * Google Cloud Monitoring Integration
 * Official implementation following Google Cloud Monitoring documentation
 * https://cloud.google.com/monitoring/docs/monitoring-overview
 * https://cloud.google.com/monitoring/api/v3
 *
 * Features:
 * - Custom metrics for relationship analytics
 * - Performance monitoring integration
 * - Business KPI tracking
 * - Automated alerting setup
 */
/**
 * Record custom metric to Google Cloud Monitoring
 * Following official Google Cloud Monitoring API patterns
 */
export declare const recordCustomMetric: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    timestamp: string;
}>, unknown>;
/**
 * Batch record multiple metrics for efficiency
 */
export declare const recordBatchMetrics: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    recordedCount: number;
    timestamp: string;
}>, unknown>;
/**
 * Scheduled function to collect and report system metrics
 * Runs every 5 minutes following official scheduling patterns
 */
export declare const collectSystemMetrics: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * Get metrics data for dashboard
 */
export declare const getMetricsData: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    metricsData: {};
    timeRange: {
        startTime: string;
        endTime: string;
    };
}>, unknown>;
/**
 * Create alerting policy for critical metrics
 */
export declare const createAlertingPolicy: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    policyName: string;
    displayName: string;
}>, unknown>;
//# sourceMappingURL=cloudMonitoring.d.ts.map