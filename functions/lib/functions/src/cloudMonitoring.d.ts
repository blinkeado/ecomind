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
export declare const recordCustomMetric: any;
/**
 * Batch record multiple metrics for efficiency
 */
export declare const recordBatchMetrics: any;
/**
 * Scheduled function to collect and report system metrics
 * Runs every 5 minutes following official scheduling patterns
 */
export declare const collectSystemMetrics: any;
/**
 * Get metrics data for dashboard
 */
export declare const getMetricsData: any;
/**
 * Create alerting policy for critical metrics
 */
export declare const createAlertingPolicy: any;
//# sourceMappingURL=cloudMonitoring.d.ts.map