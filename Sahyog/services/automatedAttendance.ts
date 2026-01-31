/**
 * SAHAYOG AUTOMATED ATTENDANCE SYSTEM
 * Location-based attendance with random interval verification
 * 
 * Features:
 * 1. Officials set work timings
 * 2. Automatic location-based attendance
 * 3. Random interval verification (fraud prevention)
 * 4. Real-time attendance tracking
 * 5. Geofencing validation
 */

// ============================================
// ATTENDANCE SCHEMAS
// ============================================

export interface WorkSessionDocument {
  _id?: string;
  sessionId: string;
  
  // Work Details
  workOpportunityId: string;
  workSiteName: string;
  workType: string;
  
  // Timing (Set by Official/Sarpanch)
  timing: {
    date: string; // YYYY-MM-DD
    startTime: string; // HH:MM (24-hour format)
    endTime: string; // HH:MM
    breakStartTime?: string; // Optional lunch break
    breakEndTime?: string;
    totalWorkHours: number; // Expected work hours
  };
  
  // Location (Geofence)
  workSiteLocation: {
    latitude: number;
    longitude: number;
    radius: number; // meters (geofence radius, default 100m)
    address: string;
  };
  
  // Session Status
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  
  // Verification Settings
  verificationSettings: {
    randomIntervalMin: number; // Minimum minutes between checks (default 15)
    randomIntervalMax: number; // Maximum minutes between checks (default 45)
    minimumVerifications: number; // Minimum checks per session (default 4)
    locationAccuracyRequired: number; // meters (default 50)
    allowOfflineMode: boolean; // Cache for offline verification
  };
  
  // Participants
  assignedWorkers: string[]; // Array of user IDs
  totalWorkers: number;
  
  // Created by
  createdBy: {
    officialId: string;
    officialName: string;
    officialRole: 'sarpanch' | 'block_officer' | 'district_officer';
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface AutoAttendanceRecord {
  _id?: string;
  attendanceId: string;
  
  // References
  userId: string;
  userName: string;
  workSessionId: string;
  workOpportunityId: string;
  
  // Date
  date: string; // YYYY-MM-DD
  
  // Attendance Status
  status: 'present' | 'absent' | 'half_day' | 'late' | 'early_leave';
  
  // Check-in/Check-out
  checkIn?: {
    timestamp: string;
    location: {
      latitude: number;
      longitude: number;
      accuracy: number; // GPS accuracy in meters
    };
    deviceInfo: {
      deviceId: string;
      platform: 'android' | 'ios' | 'web';
      batteryLevel?: number;
    };
    method: 'auto' | 'manual';
    withinGeofence: boolean;
    distanceFromWorkSite: number; // meters
  };
  
  checkOut?: {
    timestamp: string;
    location: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
    deviceInfo: {
      deviceId: string;
      platform: 'android' | 'ios' | 'web';
      batteryLevel?: number;
    };
    method: 'auto' | 'manual';
    withinGeofence: boolean;
    distanceFromWorkSite: number;
  };
  
  // Random Interval Verifications
  randomVerifications: Array<{
    verificationId: string;
    timestamp: string;
    scheduledAt: string; // When it was supposed to happen
    actualAt: string; // When it actually happened
    timeDifference: number; // seconds difference
    
    location: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
    
    withinGeofence: boolean;
    distanceFromWorkSite: number;
    
    // Verification Result
    verified: boolean;
    failureReason?: 'location_mismatch' | 'timeout' | 'device_offline' | 'gps_disabled';
    
    // Fraud Detection
    fraudFlags: Array<{
      flag: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
    }>;
  }>;
  
  // Attendance Summary
  summary: {
    totalWorkHours: number; // Actual hours worked
    expectedWorkHours: number;
    workPercentage: number; // (actual / expected) * 100
    totalVerifications: number;
    successfulVerifications: number;
    failedVerifications: number;
    verificationSuccessRate: number; // percentage
    isFullDay: boolean;
    isHalfDay: boolean;
  };
  
  // Fraud Detection Summary
  fraudAnalysis: {
    overallRiskScore: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    suspiciousPatterns: string[];
    requiresManualReview: boolean;
  };
  
  // Wage Calculation
  wageCalculation: {
    baseWagePerDay: number;
    actualWageEarned: number;
    deductions: number;
    finalWage: number;
    calculatedAt: string;
  };
  
  // Approval
  approval: {
    status: 'pending' | 'approved' | 'rejected' | 'under_review';
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface LocationVerificationLog {
  _id?: string;
  logId: string;
  userId: string;
  workSessionId: string;
  timestamp: string;
  
  // Location Data
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    speed?: number;
    heading?: number;
  };
  
  // Device Data
  device: {
    deviceId: string;
    platform: string;
    osVersion: string;
    appVersion: string;
    batteryLevel: number;
    isCharging: boolean;
    networkType: 'wifi' | '4g' | '3g' | '2g' | 'offline';
  };
  
  // Verification Result
  verification: {
    withinGeofence: boolean;
    distanceFromWorkSite: number;
    expectedLocation: { latitude: number; longitude: number };
    isValid: boolean;
    fraudScore: number;
  };
  
  // Sensor Data (for fraud detection)
  sensorData?: {
    accelerometer?: { x: number; y: number; z: number };
    gyroscope?: { x: number; y: number; z: number };
    magnetometer?: { x: number; y: number; z: number };
    ambientLight?: number;
    proximityDetection?: boolean;
  };
  
  createdAt: string;
}

export interface AttendanceNotification {
  _id?: string;
  notificationId: string;
  userId: string;
  workSessionId: string;
  
  type: 'check_in_reminder' | 'verification_required' | 'check_out_reminder' | 
        'verification_failed' | 'session_started' | 'session_ending';
  
  message: string;
  messageHindi: string;
  
  scheduledAt: string;
  sentAt?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  
  // Action Required
  requiresAction: boolean;
  actionDeadline?: string;
  actionType?: 'mark_location' | 'verify_presence' | 'check_out';
  
  createdAt: string;
}

// ============================================
// AUTOMATED ATTENDANCE SERVICE
// ============================================

export class AutomatedAttendanceService {
  
  /**
   * Officials create work session with timings
   */
  async createWorkSession(
    officialId: string,
    officialName: string,
    officialRole: 'sarpanch' | 'block_officer' | 'district_officer',
    sessionData: {
      workOpportunityId: string;
      workSiteName: string;
      workType: string;
      date: string;
      startTime: string; // "08:00"
      endTime: string; // "17:00"
      breakStartTime?: string; // "12:00"
      breakEndTime?: string; // "13:00"
      workSiteLocation: {
        latitude: number;
        longitude: number;
        radius?: number;
        address: string;
      };
      assignedWorkers: string[];
      verificationSettings?: Partial<WorkSessionDocument['verificationSettings']>;
    }
  ): Promise<WorkSessionDocument> {
    
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate total work hours
    const startMinutes = this.timeToMinutes(sessionData.startTime);
    const endMinutes = this.timeToMinutes(sessionData.endTime);
    let breakMinutes = 0;
    
    if (sessionData.breakStartTime && sessionData.breakEndTime) {
      const breakStart = this.timeToMinutes(sessionData.breakStartTime);
      const breakEnd = this.timeToMinutes(sessionData.breakEndTime);
      breakMinutes = breakEnd - breakStart;
    }
    
    const totalWorkMinutes = endMinutes - startMinutes - breakMinutes;
    const totalWorkHours = totalWorkMinutes / 60;
    
    const session: WorkSessionDocument = {
      sessionId,
      workOpportunityId: sessionData.workOpportunityId,
      workSiteName: sessionData.workSiteName,
      workType: sessionData.workType,
      
      timing: {
        date: sessionData.date,
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        breakStartTime: sessionData.breakStartTime,
        breakEndTime: sessionData.breakEndTime,
        totalWorkHours,
      },
      
      workSiteLocation: {
        latitude: sessionData.workSiteLocation.latitude,
        longitude: sessionData.workSiteLocation.longitude,
        radius: sessionData.workSiteLocation.radius || 100, // Default 100m
        address: sessionData.workSiteLocation.address,
      },
      
      status: 'scheduled',
      
      verificationSettings: {
        randomIntervalMin: sessionData.verificationSettings?.randomIntervalMin || 15,
        randomIntervalMax: sessionData.verificationSettings?.randomIntervalMax || 45,
        minimumVerifications: sessionData.verificationSettings?.minimumVerifications || 4,
        locationAccuracyRequired: sessionData.verificationSettings?.locationAccuracyRequired || 50,
        allowOfflineMode: sessionData.verificationSettings?.allowOfflineMode || false,
      },
      
      assignedWorkers: sessionData.assignedWorkers,
      totalWorkers: sessionData.assignedWorkers.length,
      
      createdBy: {
        officialId,
        officialName,
        officialRole,
      },
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Store in database
    // await mongoService.insertOne('work_sessions', session);
    
    // Schedule notifications for all workers
    await this.scheduleSessionNotifications(session);
    
    // Schedule random verifications
    await this.scheduleRandomVerifications(session);
    
    console.log(`✅ Work session created: ${sessionId}`);
    console.log(`📍 Location: ${session.workSiteLocation.address}`);
    console.log(`⏰ Time: ${session.timing.startTime} - ${session.timing.endTime}`);
    console.log(`👷 Workers: ${session.totalWorkers}`);
    
    return session;
  }
  
  /**
   * Auto check-in when worker arrives at work site
   */
  async autoCheckIn(
    userId: string,
    userName: string,
    workSessionId: string,
    locationData: {
      latitude: number;
      longitude: number;
      accuracy: number;
    },
    deviceInfo: {
      deviceId: string;
      platform: 'android' | 'ios' | 'web';
      batteryLevel?: number;
    }
  ): Promise<{ success: boolean; message: string; messageHindi: string; attendance?: AutoAttendanceRecord }> {
    
    // Get work session
    const session = await this.getWorkSession(workSessionId);
    if (!session) {
      return {
        success: false,
        message: 'Work session not found',
        messageHindi: 'कार्य सत्र नहीं मिला',
      };
    }
    
    // Check if user is assigned
    if (!session.assignedWorkers.includes(userId)) {
      return {
        success: false,
        message: 'You are not assigned to this work session',
        messageHindi: 'आप इस कार्य सत्र के लिए निर्धारित नहीं हैं',
      };
    }
    
    // Check timing
    const now = new Date();
    const sessionDate = new Date(session.timing.date);
    const startTime = this.parseTime(session.timing.startTime);
    
    const sessionStart = new Date(sessionDate);
    sessionStart.setHours(startTime.hours, startTime.minutes, 0, 0);
    
    const earlyCheckInThreshold = 30; // minutes
    const lateCheckInThreshold = 30; // minutes
    
    const timeDiffMinutes = (now.getTime() - sessionStart.getTime()) / (1000 * 60);
    
    if (timeDiffMinutes < -earlyCheckInThreshold) {
      return {
        success: false,
        message: `Too early to check in. Work starts at ${session.timing.startTime}`,
        messageHindi: `चेक इन करने में बहुत जल्दी है। काम ${session.timing.startTime} बजे शुरू होता है`,
      };
    }
    
    // Verify location (geofencing)
    const distance = this.calculateDistance(
      locationData.latitude,
      locationData.longitude,
      session.workSiteLocation.latitude,
      session.workSiteLocation.longitude
    );
    
    const withinGeofence = distance <= session.workSiteLocation.radius;
    
    if (!withinGeofence) {
      // Log suspicious activity
      await this.logFraudulentAttempt(userId, workSessionId, 'check_in_outside_geofence', {
        distance,
        allowedRadius: session.workSiteLocation.radius,
        location: locationData,
      });
      
      return {
        success: false,
        message: `You are ${Math.round(distance)}m away from work site. Please move closer (within ${session.workSiteLocation.radius}m)`,
        messageHindi: `आप कार्यस्थल से ${Math.round(distance)} मीटर दूर हैं। कृपया करीब आएं (${session.workSiteLocation.radius} मीटर के भीतर)`,
      };
    }
    
    // Check GPS accuracy
    if (locationData.accuracy > session.verificationSettings.locationAccuracyRequired) {
      return {
        success: false,
        message: 'GPS accuracy is too low. Please move to an open area with better signal',
        messageHindi: 'GPS सटीकता बहुत कम है। कृपया बेहतर सिग्नल वाले खुले क्षेत्र में जाएं',
      };
    }
    
    // Create attendance record
    const attendanceId = `att-${Date.now()}-${userId.substr(-4)}`;
    
    let status: AutoAttendanceRecord['status'];
    if (timeDiffMinutes > lateCheckInThreshold) {
      status = 'late';
    } else {
      status = 'present';
    }
    
    const attendance: AutoAttendanceRecord = {
      attendanceId,
      userId,
      userName,
      workSessionId,
      workOpportunityId: session.workOpportunityId,
      date: session.timing.date,
      status,
      
      checkIn: {
        timestamp: now.toISOString(),
        location: locationData,
        deviceInfo,
        method: 'auto',
        withinGeofence,
        distanceFromWorkSite: distance,
      },
      
      randomVerifications: [],
      
      summary: {
        totalWorkHours: 0,
        expectedWorkHours: session.timing.totalWorkHours,
        workPercentage: 0,
        totalVerifications: 0,
        successfulVerifications: 0,
        failedVerifications: 0,
        verificationSuccessRate: 0,
        isFullDay: false,
        isHalfDay: false,
      },
      
      fraudAnalysis: {
        overallRiskScore: 0,
        riskLevel: 'low',
        suspiciousPatterns: [],
        requiresManualReview: false,
      },
      
      wageCalculation: {
        baseWagePerDay: 350, // Would be fetched from config
        actualWageEarned: 0,
        deductions: 0,
        finalWage: 0,
        calculatedAt: '',
      },
      
      approval: {
        status: 'pending',
      },
      
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    
    // Store attendance
    // await mongoService.insertOne('auto_attendance_records', attendance);
    
    // Log location
    await this.logLocationVerification(userId, workSessionId, locationData, deviceInfo, true);
    
    console.log(`✅ Auto check-in successful: ${userName}`);
    console.log(`📍 Distance from work site: ${Math.round(distance)}m`);
    console.log(`⏰ Check-in time: ${now.toLocaleTimeString()}`);
    
    return {
      success: true,
      message: `Checked in successfully at ${now.toLocaleTimeString()}`,
      messageHindi: `${now.toLocaleTimeString()} बजे सफलतापूर्वक चेक इन किया गया`,
      attendance,
    };
  }
  
  /**
   * Random interval verification (runs automatically in background)
   */
  async performRandomVerification(
    userId: string,
    workSessionId: string,
    scheduledTime: string
  ): Promise<{ success: boolean; verification: any }> {
    
    console.log(`🔍 Performing random verification for user ${userId}...`);
    
    // Get current location from device
    const locationData = await this.getCurrentLocation(userId);
    if (!locationData) {
      return {
        success: false,
        verification: {
          verified: false,
          failureReason: 'device_offline',
        },
      };
    }
    
    // Get work session
    const session = await this.getWorkSession(workSessionId);
    if (!session) {
      return { success: false, verification: null };
    }
    
    // Verify location
    const distance = this.calculateDistance(
      locationData.latitude,
      locationData.longitude,
      session.workSiteLocation.latitude,
      session.workSiteLocation.longitude
    );
    
    const withinGeofence = distance <= session.workSiteLocation.radius;
    const actualTime = new Date().toISOString();
    const timeDifference = (new Date(actualTime).getTime() - new Date(scheduledTime).getTime()) / 1000;
    
    // Detect fraud patterns
    const fraudFlags = this.detectFraudPatterns(locationData, distance, withinGeofence, timeDifference);
    
    const verification = {
      verificationId: `ver-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: actualTime,
      scheduledAt: scheduledTime,
      actualAt: actualTime,
      timeDifference,
      location: locationData,
      withinGeofence,
      distanceFromWorkSite: distance,
      verified: withinGeofence && fraudFlags.length === 0,
      failureReason: !withinGeofence ? 'location_mismatch' : undefined,
      fraudFlags,
    };
    
    // Update attendance record
    // await mongoService.updateOne('auto_attendance_records', 
    //   { userId, workSessionId, date: session.timing.date },
    //   { $push: { randomVerifications: verification } }
    // );
    
    // Log verification
    await this.logLocationVerification(
      userId,
      workSessionId,
      locationData,
      { deviceId: 'auto', platform: 'auto' },
      withinGeofence
    );
    
    // If verification failed, send notification
    if (!verification.verified) {
      await this.sendVerificationFailedNotification(userId, workSessionId, verification);
    }
    
    console.log(`${verification.verified ? '✅' : '❌'} Verification ${verification.verified ? 'passed' : 'failed'}: ${Math.round(distance)}m from site`);
    
    return { success: true, verification };
  }
  
  /**
   * Auto check-out when work session ends
   */
  async autoCheckOut(
    userId: string,
    workSessionId: string,
    locationData: {
      latitude: number;
      longitude: number;
      accuracy: number;
    },
    deviceInfo: {
      deviceId: string;
      platform: 'android' | 'ios' | 'web';
      batteryLevel?: number;
    }
  ): Promise<{ success: boolean; message: string; summary?: any }> {
    
    // Get attendance record
    const attendance = await this.getAttendanceRecord(userId, workSessionId);
    if (!attendance) {
      return {
        success: false,
        message: 'Attendance record not found',
      };
    }
    
    if (!attendance.checkIn) {
      return {
        success: false,
        message: 'Cannot check out without checking in first',
      };
    }
    
    // Get work session
    const session = await this.getWorkSession(workSessionId);
    if (!session) {
      return { success: false, message: 'Work session not found' };
    }
    
    // Verify location
    const distance = this.calculateDistance(
      locationData.latitude,
      locationData.longitude,
      session.workSiteLocation.latitude,
      session.workSiteLocation.longitude
    );
    
    const withinGeofence = distance <= session.workSiteLocation.radius;
    
    const now = new Date();
    
    // Calculate work hours
    const checkInTime = new Date(attendance.checkIn.timestamp);
    const totalMinutes = (now.getTime() - checkInTime.getTime()) / (1000 * 60);
    const totalWorkHours = totalMinutes / 60;
    
    // Calculate verification success rate
    const totalVerifications = attendance.randomVerifications.length;
    const successfulVerifications = attendance.randomVerifications.filter(v => v.verified).length;
    const verificationSuccessRate = totalVerifications > 0 
      ? (successfulVerifications / totalVerifications) * 100 
      : 100;
    
    // Determine status
    const workPercentage = (totalWorkHours / session.timing.totalWorkHours) * 100;
    const isFullDay = workPercentage >= 80 && verificationSuccessRate >= 75;
    const isHalfDay = workPercentage >= 40 && workPercentage < 80 && verificationSuccessRate >= 60;
    
    let finalStatus: AutoAttendanceRecord['status'];
    if (isFullDay) finalStatus = 'present';
    else if (isHalfDay) finalStatus = 'half_day';
    else finalStatus = 'absent';
    
    // Calculate wage
    const baseWage = 350;
    let actualWage = baseWage;
    
    if (isHalfDay) {
      actualWage = baseWage * 0.5;
    } else if (!isFullDay) {
      actualWage = baseWage * (workPercentage / 100);
    }
    
    // Apply deductions for failed verifications
    const verificationPenalty = (100 - verificationSuccessRate) * 0.005; // 0.5% per failed verification
    const deductions = actualWage * verificationPenalty;
    const finalWage = actualWage - deductions;
    
    // Fraud analysis
    const fraudScore = this.calculateFraudScore(attendance);
    const fraudRiskLevel = fraudScore > 70 ? 'critical' : fraudScore > 50 ? 'high' : fraudScore > 30 ? 'medium' : 'low';
    
    // Update attendance record
    const updatedAttendance: Partial<AutoAttendanceRecord> = {
      checkOut: {
        timestamp: now.toISOString(),
        location: locationData,
        deviceInfo,
        method: 'auto',
        withinGeofence,
        distanceFromWorkSite: distance,
      },
      status: finalStatus,
      summary: {
        totalWorkHours,
        expectedWorkHours: session.timing.totalWorkHours,
        workPercentage,
        totalVerifications,
        successfulVerifications,
        failedVerifications: totalVerifications - successfulVerifications,
        verificationSuccessRate,
        isFullDay,
        isHalfDay,
      },
      fraudAnalysis: {
        overallRiskScore: fraudScore,
        riskLevel: fraudRiskLevel,
        suspiciousPatterns: this.getSuspiciousPatterns(attendance),
        requiresManualReview: fraudScore > 50,
      },
      wageCalculation: {
        baseWagePerDay: baseWage,
        actualWageEarned: actualWage,
        deductions,
        finalWage,
        calculatedAt: now.toISOString(),
      },
      updatedAt: now.toISOString(),
    };
    
    // await mongoService.updateOne('auto_attendance_records',
    //   { attendanceId: attendance.attendanceId },
    //   { $set: updatedAttendance }
    // );
    
    console.log(`✅ Auto check-out successful`);
    console.log(`⏰ Total hours: ${totalWorkHours.toFixed(2)}`);
    console.log(`💰 Final wage: ₹${finalWage.toFixed(2)}`);
    console.log(`📊 Verification rate: ${verificationSuccessRate.toFixed(1)}%`);
    
    return {
      success: true,
      message: `Checked out successfully. Final wage: ₹${finalWage.toFixed(2)}`,
      summary: updatedAttendance,
    };
  }
  
  // ============================================
  // HELPER METHODS
  // ============================================
  
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  private parseTime(time: string): { hours: number; minutes: number } {
    const [hours, minutes] = time.split(':').map(Number);
    return { hours, minutes };
  }
  
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }
  
  private detectFraudPatterns(
    location: any,
    distance: number,
    withinGeofence: boolean,
    timeDifference: number
  ): Array<{ flag: string; severity: string; description: string }> {
    
    const flags: any[] = [];
    
    // Location outside geofence
    if (!withinGeofence) {
      flags.push({
        flag: 'location_outside_geofence',
        severity: 'high',
        description: `${Math.round(distance)}m away from work site`,
      });
    }
    
    // Too perfect GPS accuracy (possible spoofing)
    if (location.accuracy < 5) {
      flags.push({
        flag: 'suspiciously_accurate_gps',
        severity: 'medium',
        description: 'GPS accuracy too perfect, possible location spoofing',
      });
    }
    
    // Delayed response
    if (Math.abs(timeDifference) > 300) { // 5 minutes
      flags.push({
        flag: 'delayed_verification',
        severity: 'low',
        description: `Response delayed by ${Math.round(timeDifference / 60)} minutes`,
      });
    }
    
    return flags;
  }
  
  private calculateFraudScore(attendance: AutoAttendanceRecord): number {
    let score = 0;
    
    // Failed verifications
    const failureRate = attendance.summary.failedVerifications / Math.max(attendance.summary.totalVerifications, 1);
    score += failureRate * 40;
    
    // Fraud flags in verifications
    const totalFraudFlags = attendance.randomVerifications.reduce(
      (sum, v) => sum + v.fraudFlags.length,
      0
    );
    score += Math.min(totalFraudFlags * 10, 40);
    
    // Low work hours
    if (attendance.summary.workPercentage < 50) {
      score += 20;
    }
    
    return Math.min(score, 100);
  }
  
  private getSuspiciousPatterns(attendance: AutoAttendanceRecord): string[] {
    const patterns: string[] = [];
    
    if (attendance.summary.verificationSuccessRate < 60) {
      patterns.push('Low verification success rate');
    }
    
    if (attendance.summary.workPercentage < 50) {
      patterns.push('Insufficient work hours');
    }
    
    const avgDistance = attendance.randomVerifications.reduce(
      (sum, v) => sum + v.distanceFromWorkSite, 0
    ) / attendance.randomVerifications.length;
    
    if (avgDistance > 50) {
      patterns.push('Frequently outside work site geofence');
    }
    
    return patterns;
  }
  
  private async scheduleSessionNotifications(session: WorkSessionDocument): Promise<void> {
    // Schedule notifications for workers
    console.log(`📅 Scheduling notifications for ${session.totalWorkers} workers`);
  }
  
  private async scheduleRandomVerifications(session: WorkSessionDocument): Promise<void> {
    // Schedule random interval checks
    console.log(`🎲 Scheduling random verifications for session ${session.sessionId}`);
  }
  
  private async getWorkSession(sessionId: string): Promise<WorkSessionDocument | null> {
    // Fetch from database
    return null; // Placeholder
  }
  
  private async getAttendanceRecord(userId: string, workSessionId: string): Promise<AutoAttendanceRecord | null> {
    // Fetch from database
    return null; // Placeholder
  }
  
  private async getCurrentLocation(userId: string): Promise<any> {
    // Get current location from device
    return null; // Placeholder
  }
  
  private async logLocationVerification(
    userId: string,
    workSessionId: string,
    location: any,
    device: any,
    verified: boolean
  ): Promise<void> {
    console.log(`📍 Logging location verification: ${verified ? 'PASS' : 'FAIL'}`);
  }
  
  private async logFraudulentAttempt(
    userId: string,
    workSessionId: string,
    attemptType: string,
    details: any
  ): Promise<void> {
    console.log(`🚨 Logging fraudulent attempt: ${attemptType}`);
  }
  
  private async sendVerificationFailedNotification(
    userId: string,
    workSessionId: string,
    verification: any
  ): Promise<void> {
    console.log(`📱 Sending verification failed notification to user ${userId}`);
  }
}

// ============================================
// EXPORT
// ============================================

export const automatedAttendanceService = new AutomatedAttendanceService();
