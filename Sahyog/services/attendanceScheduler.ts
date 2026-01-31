/**
 * ATTENDANCE SCHEDULER SERVICE
 * Handles background scheduling of random verifications
 * Runs continuously during work sessions
 */

import { automatedAttendanceService } from './automatedAttendance';

export class AttendanceSchedulerService {
  private activeSchedules: Map<string, NodeJS.Timeout[]> = new Map();
  private workerLocations: Map<string, any> = new Map(); // Cache worker locations
  
  /**
   * Start scheduling random verifications for a work session
   */
  async startScheduling(workSessionId: string): Promise<void> {
    console.log(`🚀 Starting attendance scheduler for session: ${workSessionId}`);
    
    // Get session details (would fetch from database)
    const session = await this.getWorkSession(workSessionId);
    if (!session) {
      console.error('Work session not found');
      return;
    }
    
    const {
      assignedWorkers,
      timing,
      verificationSettings,
    } = session;
    
    // Parse work timing
    const sessionDate = new Date(timing.date);
    const [startHour, startMin] = timing.startTime.split(':').map(Number);
    const [endHour, endMin] = timing.endTime.split(':').map(Number);
    
    const startTime = new Date(sessionDate);
    startTime.setHours(startHour, startMin, 0, 0);
    
    const endTime = new Date(sessionDate);
    endTime.setHours(endHour, endMin, 0, 0);
    
    // Calculate work duration
    const workDurationMs = endTime.getTime() - startTime.getTime();
    const workDurationMinutes = workDurationMs / (1000 * 60);
    
    // Schedule verifications for each worker
    for (const userId of assignedWorkers) {
      const schedules = this.generateRandomSchedule(
        startTime,
        endTime,
        verificationSettings.randomIntervalMin,
        verificationSettings.randomIntervalMax,
        verificationSettings.minimumVerifications
      );
      
      console.log(`📋 Scheduled ${schedules.length} verifications for user ${userId}`);
      
      // Schedule each verification
      const timeouts: NodeJS.Timeout[] = [];
      
      for (const scheduledTime of schedules) {
        const delay = scheduledTime.getTime() - Date.now();
        
        if (delay > 0) {
          const timeout = setTimeout(() => {
            this.executeVerification(userId, workSessionId, scheduledTime.toISOString());
          }, delay);
          
          timeouts.push(timeout);
        }
      }
      
      // Store timeouts for cleanup
      const key = `${workSessionId}-${userId}`;
      this.activeSchedules.set(key, timeouts);
    }
    
    // Schedule session end cleanup
    const sessionEndDelay = endTime.getTime() - Date.now() + 10 * 60 * 1000; // 10 min buffer
    setTimeout(() => {
      this.stopScheduling(workSessionId);
    }, sessionEndDelay);
  }
  
  /**
   * Generate random verification schedule
   */
  private generateRandomSchedule(
    startTime: Date,
    endTime: Date,
    minInterval: number,
    maxInterval: number,
    minVerifications: number
  ): Date[] {
    
    const schedules: Date[] = [];
    let currentTime = new Date(startTime.getTime());
    
    // Skip first 15 minutes (check-in period)
    currentTime.setMinutes(currentTime.getMinutes() + 15);
    
    // Generate random intervals
    while (currentTime < endTime) {
      // Random interval between min and max
      const randomInterval = Math.floor(
        Math.random() * (maxInterval - minInterval + 1) + minInterval
      );
      
      currentTime = new Date(currentTime.getTime() + randomInterval * 60 * 1000);
      
      // Don't schedule after end time
      if (currentTime < endTime) {
        schedules.push(new Date(currentTime));
      }
    }
    
    // Ensure minimum verifications
    if (schedules.length < minVerifications) {
      // Add more verifications evenly distributed
      const workDuration = endTime.getTime() - startTime.getTime();
      const interval = workDuration / (minVerifications + 1);
      
      schedules.length = 0; // Clear existing
      
      for (let i = 1; i <= minVerifications; i++) {
        const time = new Date(startTime.getTime() + interval * i);
        schedules.push(time);
      }
    }
    
    return schedules.sort((a, b) => a.getTime() - b.getTime());
  }
  
  /**
   * Execute a single verification
   */
  private async executeVerification(
    userId: string,
    workSessionId: string,
    scheduledTime: string
  ): Promise<void> {
    
    console.log(`🔍 [${new Date().toLocaleTimeString()}] Executing verification for user ${userId}`);
    
    try {
      // Check if we have cached location (updated by mobile app)
      const cachedLocation = this.workerLocations.get(userId);
      
      if (!cachedLocation) {
        console.log(`⚠️ No location data available for user ${userId}`);
        // Send notification to update location
        await this.requestLocationUpdate(userId, workSessionId);
        return;
      }
      
      // Check if location is recent (within last 5 minutes)
      const locationAge = Date.now() - new Date(cachedLocation.timestamp).getTime();
      if (locationAge > 5 * 60 * 1000) {
        console.log(`⚠️ Location data too old for user ${userId} (${Math.round(locationAge / 1000)}s)`);
        await this.requestLocationUpdate(userId, workSessionId);
        return;
      }
      
      // Perform verification
      const result = await automatedAttendanceService.performRandomVerification(
        userId,
        workSessionId,
        scheduledTime
      );
      
      if (result.success && result.verification.verified) {
        console.log(`✅ Verification passed for user ${userId}`);
      } else {
        console.log(`❌ Verification failed for user ${userId}`);
        
        // Send alert if critical
        if (result.verification.fraudFlags?.some((f: any) => f.severity === 'high' || f.severity === 'critical')) {
          await this.sendCriticalAlert(userId, workSessionId, result.verification);
        }
      }
      
    } catch (error) {
      console.error(`Error executing verification for user ${userId}:`, error);
    }
  }
  
  /**
   * Update worker location (called by mobile app)
   */
  async updateWorkerLocation(
    userId: string,
    locationData: {
      latitude: number;
      longitude: number;
      accuracy: number;
      timestamp: string;
    }
  ): Promise<void> {
    
    this.workerLocations.set(userId, locationData);
    console.log(`📍 Location updated for user ${userId}: (${locationData.latitude}, ${locationData.longitude})`);
  }
  
  /**
   * Request location update from worker's device
   */
  private async requestLocationUpdate(userId: string, workSessionId: string): Promise<void> {
    console.log(`📱 Requesting location update from user ${userId}`);
    
    // Send push notification or trigger location service
    // This would integrate with Firebase Cloud Messaging or similar
    
    // For now, log the request
    // await notificationService.send(userId, {
    //   type: 'location_update_required',
    //   workSessionId,
    //   priority: 'high',
    // });
  }
  
  /**
   * Send critical alert to officials
   */
  private async sendCriticalAlert(
    userId: string,
    workSessionId: string,
    verification: any
  ): Promise<void> {
    
    console.log(`🚨 CRITICAL ALERT: Potential fraud detected for user ${userId}`);
    console.log(`Fraud flags:`, verification.fraudFlags);
    
    // Send alert to officials
    // await notificationService.sendToOfficials(workSessionId, {
    //   type: 'fraud_alert',
    //   userId,
    //   severity: 'critical',
    //   details: verification,
    // });
  }
  
  /**
   * Stop scheduling for a work session
   */
  stopScheduling(workSessionId: string): void {
    console.log(`🛑 Stopping scheduler for session: ${workSessionId}`);
    
    // Clear all timeouts for this session
    for (const [key, timeouts] of this.activeSchedules.entries()) {
      if (key.startsWith(workSessionId)) {
        timeouts.forEach(timeout => clearTimeout(timeout));
        this.activeSchedules.delete(key);
      }
    }
    
    console.log(`✅ Scheduler stopped for session: ${workSessionId}`);
  }
  
  /**
   * Get active schedules count
   */
  getActiveSchedulesCount(): number {
    return this.activeSchedules.size;
  }
  
  /**
   * Helper: Get work session
   */
  private async getWorkSession(sessionId: string): Promise<any> {
    // Fetch from database
    // For now, return mock data
    return {
      sessionId,
      assignedWorkers: ['user1', 'user2', 'user3'],
      timing: {
        date: new Date().toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '17:00',
      },
      verificationSettings: {
        randomIntervalMin: 15,
        randomIntervalMax: 45,
        minimumVerifications: 4,
      },
    };
  }
}

// ============================================
// LOCATION SERVICE (for mobile apps)
// ============================================

export class LocationTrackingService {
  private locationUpdateInterval: NodeJS.Timeout | null = null;
  private isTracking = false;
  
  /**
   * Start continuous location tracking during work session
   * Called by mobile app when worker checks in
   */
  async startTracking(
    userId: string,
    workSessionId: string,
    updateIntervalSeconds: number = 120 // Update every 2 minutes
  ): Promise<void> {
    
    if (this.isTracking) {
      console.log('Location tracking already active');
      return;
    }
    
    console.log(`📍 Starting location tracking for user ${userId}`);
    this.isTracking = true;
    
    // Get location immediately
    await this.captureAndSendLocation(userId, workSessionId);
    
    // Set up periodic updates
    this.locationUpdateInterval = setInterval(async () => {
      if (this.isTracking) {
        await this.captureAndSendLocation(userId, workSessionId);
      }
    }, updateIntervalSeconds * 1000);
  }
  
  /**
   * Stop location tracking
   * Called when worker checks out
   */
  stopTracking(): void {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }
    this.isTracking = false;
    console.log('📍 Location tracking stopped');
  }
  
  /**
   * Capture and send current location
   */
  private async captureAndSendLocation(userId: string, workSessionId: string): Promise<void> {
    try {
      // Get device location
      const location = await this.getDeviceLocation();
      
      if (location) {
        // Send to scheduler service
        await attendanceScheduler.updateWorkerLocation(userId, {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: new Date().toISOString(),
        });
        
        console.log(`✅ Location sent: ${location.coords.latitude}, ${location.coords.longitude}`);
      }
      
    } catch (error) {
      console.error('Error capturing location:', error);
    }
  }
  
  /**
   * Get device location (browser/mobile)
   */
  private async getDeviceLocation(): Promise<GeolocationPosition | null> {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => {
            console.error('Geolocation error:', error);
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } else {
        console.error('Geolocation not supported');
        resolve(null);
      }
    });
  }
  
  /**
   * Check if location services are enabled
   */
  async checkLocationPermission(): Promise<boolean> {
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state === 'granted';
      } catch (error) {
        return false;
      }
    }
    return 'geolocation' in navigator;
  }
}

// ============================================
// EXPORTS
// ============================================

export const attendanceScheduler = new AttendanceSchedulerService();
export const locationTrackingService = new LocationTrackingService();

// ============================================
// AUTO-START SCHEDULER (for existing sessions)
// ============================================

export async function initializeAttendanceScheduler(): Promise<void> {
  console.log('🔧 Initializing attendance scheduler...');
  
  // Get all active work sessions from database
  // const activeSessions = await mongoService.find('work_sessions', { status: 'ongoing' });
  
  // Start scheduler for each active session
  // for (const session of activeSessions) {
  //   await attendanceScheduler.startScheduling(session.sessionId);
  // }
  
  console.log('✅ Attendance scheduler initialized');
}

// Call on app startup
// initializeAttendanceScheduler();
