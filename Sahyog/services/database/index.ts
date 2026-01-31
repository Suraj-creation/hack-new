/**
 * SAHAYOG Database Module
 * Central export for all database services
 */

// MongoDB Service
export { mongoService, dbConfig, type MongoDBConfig, type DBResponse } from './mongoService';

// Schemas
export * from './schemas';

// ML Database Schemas
export * from './mlSchemas';

// Dummy Data Generator
export * from './dummyDataGenerator';

// Data Collector
export { 
  DataCollectorService, 
  createDataCollector, 
  DATA_FIELDS,
  type DataFieldDefinition 
} from './dataCollector';

// Fraud Detection
export { 
  fraudDetectionService, 
  FraudDetectionService 
} from './fraudDetection';

// Database Tests (for development)
export { runAllDatabaseTests } from './__tests__/database.test';

// Initialize database on import
import { mongoService } from './mongoService';

// Auto-connect when module is loaded
mongoService.connect().then(connected => {
  if (connected) {
    console.log('[Database] ✅ SAHAYOG database module initialized');
  } else {
    console.warn('[Database] ⚠️ Database connection failed, using local storage');
  }
});
