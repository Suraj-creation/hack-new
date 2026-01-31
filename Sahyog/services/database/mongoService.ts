/**
 * SAHAYOG MongoDB Service
 * Secure database connection for user data, conversations, and fraud detection
 * 
 * Based on unified.md:
 * - Module 2: Progressive Information Gathering
 * - Module 10: Trust-Based Data Collection
 * - Module 11: Fraud Detection & Protection
 */

// MongoDB connection configuration from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://surajcreationinfinity_db_user:RG6RNyXHW9fZjikj@shahyog.kvdzkcs.mongodb.net/?appName=shahyog';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'sahayog';

// Log connection status
console.log('[MongoDB] URI:', MONGODB_URI ? `${MONGODB_URI.substring(0, 30)}...` : 'NOT SET');
console.log('[MongoDB] Database:', MONGODB_DB_NAME);

// For browser environment, we'll use a REST API approach
// In production, this would connect to a backend service

export interface MongoDBConfig {
  uri: string;
  dbName: string;
  collections: {
    users: string;
    conversations: string;
    grievances: string;
    workRecords: string;
    payments: string;
    fraudAlerts: string;
    consentLogs: string;
    skillProgress: string;
  };
}

export const dbConfig: MongoDBConfig = {
  uri: MONGODB_URI,
  dbName: MONGODB_DB_NAME,
  collections: {
    users: 'users',
    conversations: 'conversations',
    grievances: 'grievances',
    workRecords: 'work_records',
    payments: 'payments',
    fraudAlerts: 'fraud_alerts',
    consentLogs: 'consent_logs',
    skillProgress: 'skill_progress'
  }
};

// ============================================
// DATABASE SERVICE (Browser-Compatible)
// Uses fetch API to communicate with backend
// ============================================

export interface DBResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  insertedId?: string;
}

class MongoDBService {
  private baseUrl: string;
  private isConnected: boolean = false;
  private connectionPromise: Promise<boolean> | null = null;

  constructor() {
    // In production, this would be your backend API URL
    // For development, we'll use localStorage as a mock
    this.baseUrl = '/api/db';
  }

  /**
   * Initialize database connection
   */
  async connect(): Promise<boolean> {
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = new Promise(async (resolve) => {
      try {
        console.log('[MongoDB] 🔄 Initializing database connection...');
        
        // For browser environment, we'll use IndexedDB as local cache
        // and sync with MongoDB backend when online
        await this.initLocalStorage();
        
        this.isConnected = true;
        console.log('[MongoDB] ✅ Database service initialized');
        resolve(true);
      } catch (error) {
        console.error('[MongoDB] ❌ Connection failed:', error);
        resolve(false);
      }
    });

    return this.connectionPromise;
  }

  private async initLocalStorage(): Promise<void> {
    // Initialize local storage collections if not exists
    const collections = Object.values(dbConfig.collections);
    for (const collection of collections) {
      if (!localStorage.getItem(`sahayog_${collection}`)) {
        localStorage.setItem(`sahayog_${collection}`, JSON.stringify([]));
      }
    }
  }

  /**
   * Insert a document into a collection
   */
  async insertOne<T extends object>(collection: string, document: T): Promise<DBResponse<T>> {
    try {
      await this.connect();
      
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const docWithId = { _id: id, ...document, createdAt: new Date().toISOString() };
      
      // Store locally
      const data = this.getLocalCollection(collection);
      data.push(docWithId);
      this.setLocalCollection(collection, data);
      
      console.log(`[MongoDB] ✅ Inserted into ${collection}:`, id);
      
      // Queue for sync with MongoDB (when backend is available)
      this.queueForSync('insert', collection, docWithId);
      
      return { success: true, data: docWithId as T, insertedId: id };
    } catch (error: any) {
      console.error(`[MongoDB] ❌ Insert failed:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Find documents in a collection
   */
  async find<T>(collection: string, query: Record<string, any> = {}): Promise<DBResponse<T[]>> {
    try {
      await this.connect();
      
      const data = this.getLocalCollection(collection);
      
      // Simple query matching
      const results = data.filter((doc: any) => {
        return Object.entries(query).every(([key, value]) => doc[key] === value);
      });
      
      return { success: true, data: results };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Find one document
   */
  async findOne<T>(collection: string, query: Record<string, any>): Promise<DBResponse<T | null>> {
    const result = await this.find<T>(collection, query);
    return {
      success: result.success,
      data: result.data?.[0] || null,
      error: result.error
    };
  }

  /**
   * Update a document
   */
  async updateOne(
    collection: string, 
    query: Record<string, any>, 
    update: Record<string, any>
  ): Promise<DBResponse<any>> {
    try {
      await this.connect();
      
      const data = this.getLocalCollection(collection);
      const index = data.findIndex((doc: any) => {
        return Object.entries(query).every(([key, value]) => doc[key] === value);
      });
      
      if (index === -1) {
        return { success: false, error: 'Document not found' };
      }
      
      data[index] = { ...data[index], ...update, updatedAt: new Date().toISOString() };
      this.setLocalCollection(collection, data);
      
      this.queueForSync('update', collection, { query, update });
      
      return { success: true, data: data[index] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Count documents matching query
   */
  async count(collection: string, query: Record<string, any> = {}): Promise<number> {
    try {
      await this.connect();
      const data = this.getLocalCollection(collection);
      
      if (Object.keys(query).length === 0) {
        return data.length;
      }
      
      const matchedDocs = data.filter((doc: any) => {
        return Object.entries(query).every(([key, value]) => {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Handle operators
            return Object.entries(value).every(([op, opVal]) => {
              switch (op) {
                case '$gte': return doc[key] >= opVal;
                case '$gt': return doc[key] > opVal;
                case '$lte': return doc[key] <= opVal;
                case '$lt': return doc[key] < opVal;
                case '$in': return (opVal as any[]).includes(doc[key]);
                case '$ne': return doc[key] !== opVal;
                default: return false;
              }
            });
          }
          return doc[key] === value;
        });
      });
      
      return matchedDocs.length;
    } catch (error) {
      console.error('Count error:', error);
      return 0;
    }
  }

  /**
   * Delete a document
   */
  async deleteOne(collection: string, query: Record<string, any>): Promise<DBResponse> {
    try {
      await this.connect();
      
      const data = this.getLocalCollection(collection);
      const index = data.findIndex((doc: any) => {
        return Object.entries(query).every(([key, value]) => doc[key] === value);
      });
      
      if (index === -1) {
        return { success: false, error: 'Document not found' };
      }
      
      data.splice(index, 1);
      this.setLocalCollection(collection, data);
      
      this.queueForSync('delete', collection, query);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Aggregate pipeline (simplified for local storage)
   */
  async aggregate<T>(collection: string, pipeline: any[]): Promise<DBResponse<T[]>> {
    try {
      await this.connect();
      let data = this.getLocalCollection(collection);
      
      // Simple aggregation support
      for (const stage of pipeline) {
        if (stage.$match) {
          data = data.filter((doc: any) => {
            return Object.entries(stage.$match).every(([key, value]) => {
              if (typeof value === 'object' && value !== null) {
                // Handle operators like $gte, $lte
                return Object.entries(value).every(([op, opVal]) => {
                  switch (op) {
                    case '$gte': return doc[key] >= opVal;
                    case '$lte': return doc[key] <= opVal;
                    case '$gt': return doc[key] > opVal;
                    case '$lt': return doc[key] < opVal;
                    case '$in': return (opVal as any[]).includes(doc[key]);
                    default: return doc[key] === opVal;
                  }
                });
              }
              return doc[key] === value;
            });
          });
        }
        if (stage.$sort) {
          const [field, order] = Object.entries(stage.$sort)[0];
          data.sort((a: any, b: any) => {
            if (order === 1) return a[field] > b[field] ? 1 : -1;
            return a[field] < b[field] ? 1 : -1;
          });
        }
        if (stage.$limit) {
          data = data.slice(0, stage.$limit);
        }
      }
      
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private getLocalCollection(collection: string): any[] {
    const data = localStorage.getItem(`sahayog_${collection}`);
    return data ? JSON.parse(data) : [];
  }

  private setLocalCollection(collection: string, data: any[]): void {
    localStorage.setItem(`sahayog_${collection}`, JSON.stringify(data));
  }

  private queueForSync(operation: string, collection: string, data: any): void {
    // Queue operations for syncing with MongoDB when backend is available
    const queue = JSON.parse(localStorage.getItem('sahayog_sync_queue') || '[]');
    queue.push({
      operation,
      collection,
      data,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('sahayog_sync_queue', JSON.stringify(queue));
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalUsers: number;
    totalConversations: number;
    totalGrievances: number;
    pendingSync: number;
  }> {
    return {
      totalUsers: this.getLocalCollection(dbConfig.collections.users).length,
      totalConversations: this.getLocalCollection(dbConfig.collections.conversations).length,
      totalGrievances: this.getLocalCollection(dbConfig.collections.grievances).length,
      pendingSync: JSON.parse(localStorage.getItem('sahayog_sync_queue') || '[]').length
    };
  }

  /**
   * Clear all local data (for testing)
   */
  async clearAll(): Promise<void> {
    const collections = Object.values(dbConfig.collections);
    for (const collection of collections) {
      localStorage.removeItem(`sahayog_${collection}`);
    }
    localStorage.removeItem('sahayog_sync_queue');
    console.log('[MongoDB] 🗑️ All local data cleared');
  }
}

// Export singleton instance
export const mongoService = new MongoDBService();
export default mongoService;
