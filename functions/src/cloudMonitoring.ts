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

import { onCall, onSchedule } from 'firebase-functions/v2';
import { logger } from 'firebase-functions';
import { MetricServiceClient } from '@google-cloud/monitoring';
import * as admin from 'firebase-admin';

// Initialize Google Cloud Monitoring client
const monitoringClient = new MetricServiceClient();
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT!;

// Official Google Cloud Monitoring metric types
const CUSTOM_METRICS = {
  RELATIONSHIP_COUNT: 'custom.googleapis.com/ecomind/relationship_count',
  AI_PROCESSING_TIME: 'custom.googleapis.com/ecomind/ai_processing_time',
  VECTOR_SEARCH_QUERIES: 'custom.googleapis.com/ecomind/vector_search_queries',
  USER_ENGAGEMENT: 'custom.googleapis.com/ecomind/user_engagement',
  EMOTIONAL_SIGNALS_PROCESSED: 'custom.googleapis.com/ecomind/emotional_signals_processed',
  RELATIONSHIP_HEALTH_SCORE: 'custom.googleapis.com/ecomind/relationship_health_score',
  GENKIT_WORKFLOW_SUCCESS_RATE: 'custom.googleapis.com/ecomind/genkit_workflow_success_rate',
  DATABASE_OPERATION_LATENCY: 'custom.googleapis.com/ecomind/database_operation_latency'
};

/**
 * Record custom metric to Google Cloud Monitoring
 * Following official Google Cloud Monitoring API patterns
 */
export const recordCustomMetric = onCall(
  {
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new Error('Authentication required');
    }

    try {
      const { metricType, value, labels = {}, timestamp } = request.data;

      if (!metricType || typeof value !== 'number') {
        throw new Error('Invalid metric data: metricType and numeric value required');
      }

      // Validate metric type
      if (!Object.values(CUSTOM_METRICS).includes(metricType)) {
        throw new Error(`Invalid metric type: ${metricType}`);
      }

      const projectPath = monitoringClient.projectPath(PROJECT_ID);
      const now = timestamp ? new Date(timestamp) : new Date();

      // Create time series data following official API structure
      const timeSeriesData = {
        metric: {
          type: metricType,
          labels: {
            user_id: request.auth.uid,
            environment: process.env.NODE_ENV || 'production',
            ...labels
          }
        },
        resource: {
          type: 'firebase_domain',
          labels: {
            domain_name: PROJECT_ID
          }
        },
        points: [
          {
            interval: {
              endTime: {
                seconds: Math.floor(now.getTime() / 1000),
                nanos: (now.getTime() % 1000) * 1000000
              }
            },
            value: {
              doubleValue: value
            }
          }
        ]
      };

      // Write time series to Cloud Monitoring
      await monitoringClient.createTimeSeries({
        name: projectPath,
        timeSeries: [timeSeriesData]
      });

      logger.info('Custom metric recorded successfully', {
        metricType,
        value,
        userId: request.auth.uid,
        labels
      });

      return { success: true, timestamp: now.toISOString() };

    } catch (error) {
      logger.error('Failed to record custom metric', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: request.auth?.uid
      });
      throw error;
    }
  }
);

/**
 * Batch record multiple metrics for efficiency
 */
export const recordBatchMetrics = onCall(
  {
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 120,
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new Error('Authentication required');
    }

    try {
      const { metrics } = request.data;

      if (!Array.isArray(metrics) || metrics.length === 0) {
        throw new Error('Invalid metrics array');
      }

      if (metrics.length > 200) {
        throw new Error('Batch size cannot exceed 200 metrics');
      }

      const projectPath = monitoringClient.projectPath(PROJECT_ID);
      const now = new Date();

      // Create time series array following official batch API patterns
      const timeSeriesArray = metrics.map((metric: any) => {
        const { metricType, value, labels = {}, timestamp } = metric;

        if (!metricType || typeof value !== 'number') {
          throw new Error(`Invalid metric data: ${JSON.stringify(metric)}`);
        }

        if (!Object.values(CUSTOM_METRICS).includes(metricType)) {
          throw new Error(`Invalid metric type: ${metricType}`);
        }

        const metricTimestamp = timestamp ? new Date(timestamp) : now;

        return {
          metric: {
            type: metricType,
            labels: {
              user_id: request.auth.uid,
              environment: process.env.NODE_ENV || 'production',
              ...labels
            }
          },
          resource: {
            type: 'firebase_domain',
            labels: {
              domain_name: PROJECT_ID
            }
          },
          points: [
            {
              interval: {
                endTime: {
                  seconds: Math.floor(metricTimestamp.getTime() / 1000),
                  nanos: (metricTimestamp.getTime() % 1000) * 1000000
                }
              },
              value: {
                doubleValue: value
              }
            }
          ]
        };
      });

      // Write batch time series to Cloud Monitoring
      await monitoringClient.createTimeSeries({
        name: projectPath,
        timeSeries: timeSeriesArray
      });

      logger.info('Batch metrics recorded successfully', {
        metricCount: metrics.length,
        userId: request.auth.uid
      });

      return { 
        success: true, 
        recordedCount: metrics.length,
        timestamp: now.toISOString() 
      };

    } catch (error) {
      logger.error('Failed to record batch metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: request.auth?.uid
      });
      throw error;
    }
  }
);

/**
 * Scheduled function to collect and report system metrics
 * Runs every 5 minutes following official scheduling patterns
 */
export const collectSystemMetrics = onSchedule(
  {
    schedule: 'every 5 minutes',
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 240,
  },
  async (event) => {
    try {
      logger.info('Starting system metrics collection');

      const db = admin.firestore();
      const now = new Date();
      const projectPath = monitoringClient.projectPath(PROJECT_ID);

      // Collect relationship metrics
      const relationshipsSnapshot = await db.collectionGroup('relationships').get();
      const totalRelationships = relationshipsSnapshot.size;

      // Collect user engagement metrics
      const usersSnapshot = await db.collection('users').get();
      const totalUsers = usersSnapshot.size;

      // Collect vector search metrics
      const vectorsSnapshot = await db.collection('vectors').get();
      const totalVectors = vectorsSnapshot.size;

      // Collect emotional signals metrics
      const emotionalSignalsSnapshot = await db.collectionGroup('emotionalSignals').get();
      const totalEmotionalSignals = emotionalSignalsSnapshot.size;

      // Create system metrics time series
      const systemMetrics = [
        {
          metric: {
            type: CUSTOM_METRICS.RELATIONSHIP_COUNT,
            labels: {
              metric_source: 'system_collection',
              environment: process.env.NODE_ENV || 'production'
            }
          },
          resource: {
            type: 'firebase_domain',
            labels: {
              domain_name: PROJECT_ID
            }
          },
          points: [
            {
              interval: {
                endTime: {
                  seconds: Math.floor(now.getTime() / 1000),
                  nanos: (now.getTime() % 1000) * 1000000
                }
              },
              value: {
                int64Value: totalRelationships
              }
            }
          ]
        },
        {
          metric: {
            type: CUSTOM_METRICS.USER_ENGAGEMENT,
            labels: {
              metric_source: 'system_collection',
              engagement_type: 'total_users',
              environment: process.env.NODE_ENV || 'production'
            }
          },
          resource: {
            type: 'firebase_domain',
            labels: {
              domain_name: PROJECT_ID
            }
          },
          points: [
            {
              interval: {
                endTime: {
                  seconds: Math.floor(now.getTime() / 1000),
                  nanos: (now.getTime() % 1000) * 1000000
                }
              },
              value: {
                int64Value: totalUsers
              }
            }
          ]
        },
        {
          metric: {
            type: CUSTOM_METRICS.VECTOR_SEARCH_QUERIES,
            labels: {
              metric_source: 'system_collection',
              query_type: 'total_vectors',
              environment: process.env.NODE_ENV || 'production'
            }
          },
          resource: {
            type: 'firebase_domain',
            labels: {
              domain_name: PROJECT_ID
            }
          },
          points: [
            {
              interval: {
                endTime: {
                  seconds: Math.floor(now.getTime() / 1000),
                  nanos: (now.getTime() % 1000) * 1000000
                }
              },
              value: {
                int64Value: totalVectors
              }
            }
          ]
        },
        {
          metric: {
            type: CUSTOM_METRICS.EMOTIONAL_SIGNALS_PROCESSED,
            labels: {
              metric_source: 'system_collection',
              environment: process.env.NODE_ENV || 'production'
            }
          },
          resource: {
            type: 'firebase_domain',
            labels: {
              domain_name: PROJECT_ID
            }
          },
          points: [
            {
              interval: {
                endTime: {
                  seconds: Math.floor(now.getTime() / 1000),
                  nanos: (now.getTime() % 1000) * 1000000
                }
              },
              value: {
                int64Value: totalEmotionalSignals
              }
            }
          ]
        }
      ];

      // Write system metrics to Cloud Monitoring
      await monitoringClient.createTimeSeries({
        name: projectPath,
        timeSeries: systemMetrics
      });

      logger.info('System metrics collected successfully', {
        totalRelationships,
        totalUsers,
        totalVectors,
        totalEmotionalSignals,
        timestamp: now.toISOString()
      });

    } catch (error) {
      logger.error('Failed to collect system metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get metrics data for dashboard
 */
export const getMetricsData = onCall(
  {
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new Error('Authentication required');
    }

    try {
      const { 
        metricTypes = Object.values(CUSTOM_METRICS), 
        startTime, 
        endTime = new Date(),
        interval = '1h'
      } = request.data;

      const projectPath = monitoringClient.projectPath(PROJECT_ID);
      const endTimeObj = new Date(endTime);
      const startTimeObj = new Date(startTime || new Date(endTimeObj.getTime() - 24 * 60 * 60 * 1000));

      const metricsData = {};

      // Query each metric type following official API patterns
      for (const metricType of metricTypes) {
        try {
          const listTimeSeriesRequest = {
            name: projectPath,
            filter: `metric.type="${metricType}"`,
            interval: {
              startTime: {
                seconds: Math.floor(startTimeObj.getTime() / 1000)
              },
              endTime: {
                seconds: Math.floor(endTimeObj.getTime() / 1000)
              }
            },
            view: 'FULL'
          };

          const [timeSeries] = await monitoringClient.listTimeSeries(listTimeSeriesRequest);
          
          metricsData[metricType] = timeSeries.map(ts => ({
            labels: ts.metric?.labels || {},
            points: ts.points?.map(point => ({
              timestamp: point.interval?.endTime,
              value: point.value?.doubleValue || point.value?.int64Value || 0
            })) || []
          }));

        } catch (metricError) {
          logger.warn(`Failed to fetch metric ${metricType}`, {
            error: metricError instanceof Error ? metricError.message : 'Unknown error'
          });
          metricsData[metricType] = [];
        }
      }

      return {
        metricsData,
        timeRange: {
          startTime: startTimeObj.toISOString(),
          endTime: endTimeObj.toISOString()
        }
      };

    } catch (error) {
      logger.error('Failed to get metrics data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: request.auth?.uid
      });
      throw error;
    }
  }
);

/**
 * Create alerting policy for critical metrics
 */
export const createAlertingPolicy = onCall(
  {
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new Error('Authentication required');
    }

    try {
      const { 
        metricType, 
        threshold, 
        comparisonType = 'COMPARISON_GREATER_THAN',
        displayName,
        notificationChannels = []
      } = request.data;

      if (!metricType || typeof threshold !== 'number') {
        throw new Error('metricType and threshold are required');
      }

      const projectPath = monitoringClient.projectPath(PROJECT_ID);

      // Create alerting policy following official patterns
      const alertPolicy = {
        displayName: displayName || `Alert for ${metricType}`,
        conditions: [
          {
            displayName: `${metricType} threshold condition`,
            conditionThreshold: {
              filter: `metric.type="${metricType}"`,
              comparison: comparisonType,
              thresholdValue: threshold,
              duration: {
                seconds: 300 // 5 minutes
              },
              aggregations: [
                {
                  alignmentPeriod: {
                    seconds: 60
                  },
                  perSeriesAligner: 'ALIGN_MEAN',
                  crossSeriesReducer: 'REDUCE_MEAN',
                  groupByFields: ['metric.label.user_id']
                }
              ]
            }
          }
        ],
        notificationChannels,
        alertStrategy: {
          autoClose: {
            seconds: 1800 // 30 minutes
          }
        },
        enabled: true
      };

      const [policy] = await monitoringClient.createAlertPolicy({
        name: projectPath,
        alertPolicy
      });

      logger.info('Alert policy created successfully', {
        policyName: policy.name,
        metricType,
        threshold,
        userId: request.auth.uid
      });

      return {
        success: true,
        policyName: policy.name,
        displayName: policy.displayName
      };

    } catch (error) {
      logger.error('Failed to create alert policy', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: request.auth?.uid
      });
      throw error;
    }
  }
);