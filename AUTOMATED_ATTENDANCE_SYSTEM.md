# 🎯 Automated Attendance System Documentation

## Overview

The **Automated Attendance System** is a location-based attendance tracking solution for MGNREGA work sessions. It uses GPS geofencing and random interval verification to ensure workers are present at work sites throughout the day, preventing fraud and automating wage calculations.

## Key Features

### 1. **Official/Sarpanch Features**
- ✅ Create work sessions with custom timings
- 📍 Set geofence boundaries for work sites
- 👷 Assign workers to sessions
- 🎲 Configure random verification intervals
- 📊 Real-time attendance monitoring
- 💰 Automated wage calculation
- 🚨 Fraud detection alerts

### 2. **Worker Features**
- 📱 One-tap check-in/check-out
- 📍 Automatic location tracking
- 🔔 Verification notifications
- 💰 Real-time wage preview
- 🌐 Offline mode support (with sync)

### 3. **System Features**
- 🎲 **Random Interval Verification**: System randomly checks worker location 4-6 times during work hours
- 🛡️ **Fraud Detection**: 5-signal fraud detection system (location, attendance, payment, identity, collusion)
- 🗺️ **Geofencing**: Workers must be within defined radius (50-500m) of work site
- 📊 **Real-time Analytics**: Live dashboard for officials
- 🔐 **Secure & Auditable**: Complete audit trail of all location verifications

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTOMATED ATTENDANCE SYSTEM               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Official/Admin  │         │     Worker       │          │
│  │    Interface     │         │   Mobile App     │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                            │                     │
│           │ Create Session             │ Check-in/out        │
│           │ Set Timings                │ Location Updates    │
│           │ Assign Workers             │                     │
│           ▼                            ▼                     │
│  ┌────────────────────────────────────────────────┐         │
│  │      AutomatedAttendanceService                │         │
│  │  ├─ createWorkSession()                        │         │
│  │  ├─ autoCheckIn()                              │         │
│  │  ├─ performRandomVerification()                │         │
│  │  └─ autoCheckOut()                             │         │
│  └──────────────────┬─────────────────────────────┘         │
│                     │                                        │
│                     ▼                                        │
│  ┌────────────────────────────────────────────────┐         │
│  │      AttendanceSchedulerService                │         │
│  │  ├─ startScheduling()                          │         │
│  │  ├─ generateRandomSchedule()                   │         │
│  │  ├─ executeVerification()                      │         │
│  │  └─ stopScheduling()                           │         │
│  └──────────────────┬─────────────────────────────┘         │
│                     │                                        │
│                     ▼                                        │
│  ┌────────────────────────────────────────────────┐         │
│  │      LocationTrackingService                   │         │
│  │  ├─ startTracking()                            │         │
│  │  ├─ captureAndSendLocation()                   │         │
│  │  └─ stopTracking()                             │         │
│  └──────────────────┬─────────────────────────────┘         │
│                     │                                        │
│                     ▼                                        │
│  ┌────────────────────────────────────────────────┐         │
│  │           MongoDB Collections                  │         │
│  │  ├─ work_sessions                              │         │
│  │  ├─ auto_attendance_records                    │         │
│  │  ├─ location_verification_logs                 │         │
│  │  └─ attendance_notifications                   │         │
│  └────────────────────────────────────────────────┘         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Session Creation Flow

```
Official → createWorkSession() → Store in DB → Schedule Notifications → Schedule Random Verifications → Start Scheduler
```

### 2. Check-in Flow

```
Worker Arrives → Gets GPS Location → autoCheckIn() → Verify Geofence → Store Attendance → Start Location Tracking
```

### 3. Random Verification Flow

```
Scheduler Triggers → Request Location → performRandomVerification() → Check Geofence → Detect Fraud Patterns → Update Attendance → Send Alert (if failed)
```

### 4. Check-out Flow

```
Worker Leaves → autoCheckOut() → Calculate Work Hours → Calculate Verification Rate → Calculate Wage → Update Status → Stop Tracking
```

---

## Database Schema

### WorkSessionDocument

```typescript
{
  sessionId: string;
  workOpportunityId: string;
  workSiteName: string;
  workType: string;
  
  timing: {
    date: string;
    startTime: string; // "08:00"
    endTime: string;   // "17:00"
    breakStartTime?: string;
    breakEndTime?: string;
    totalWorkHours: number;
  };
  
  workSiteLocation: {
    latitude: number;
    longitude: number;
    radius: number; // meters
    address: string;
  };
  
  verificationSettings: {
    randomIntervalMin: number; // 15 minutes
    randomIntervalMax: number; // 45 minutes
    minimumVerifications: number; // 4
    locationAccuracyRequired: number; // 50 meters
    allowOfflineMode: boolean;
  };
  
  assignedWorkers: string[];
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}
```

### AutoAttendanceRecord

```typescript
{
  attendanceId: string;
  userId: string;
  workSessionId: string;
  date: string;
  status: 'present' | 'absent' | 'half_day' | 'late';
  
  checkIn: {
    timestamp: string;
    location: { latitude, longitude, accuracy };
    withinGeofence: boolean;
    distanceFromWorkSite: number;
  };
  
  checkOut: { ... };
  
  randomVerifications: Array<{
    verificationId: string;
    timestamp: string;
    location: { ... };
    verified: boolean;
    fraudFlags: Array<{ flag, severity, description }>;
  }>;
  
  summary: {
    totalWorkHours: number;
    verificationSuccessRate: number;
    isFullDay: boolean;
  };
  
  fraudAnalysis: {
    overallRiskScore: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    suspiciousPatterns: string[];
    requiresManualReview: boolean;
  };
  
  wageCalculation: {
    baseWagePerDay: number;
    actualWageEarned: number;
    deductions: number;
    finalWage: number;
  };
}
```

---

## API Reference

### 1. Create Work Session

```typescript
await automatedAttendanceService.createWorkSession(
  officialId: string,
  officialName: string,
  officialRole: 'sarpanch' | 'block_officer' | 'district_officer',
  sessionData: {
    workOpportunityId: string;
    workSiteName: string;
    workType: string;
    date: string;
    startTime: string;
    endTime: string;
    workSiteLocation: {
      latitude: number;
      longitude: number;
      radius?: number;
      address: string;
    };
    assignedWorkers: string[];
  }
);
```

**Returns**: `WorkSessionDocument`

### 2. Auto Check-in

```typescript
await automatedAttendanceService.autoCheckIn(
  userId: string,
  userName: string,
  workSessionId: string,
  locationData: { latitude, longitude, accuracy },
  deviceInfo: { deviceId, platform, batteryLevel }
);
```

**Returns**: 
```typescript
{
  success: boolean;
  message: string;
  messageHindi: string;
  attendance?: AutoAttendanceRecord;
}
```

### 3. Random Verification

```typescript
await automatedAttendanceService.performRandomVerification(
  userId: string,
  workSessionId: string,
  scheduledTime: string
);
```

**Returns**:
```typescript
{
  success: boolean;
  verification: {
    verified: boolean;
    withinGeofence: boolean;
    distanceFromWorkSite: number;
    fraudFlags: Array<...>;
  };
}
```

### 4. Auto Check-out

```typescript
await automatedAttendanceService.autoCheckOut(
  userId: string,
  workSessionId: string,
  locationData: { ... },
  deviceInfo: { ... }
);
```

**Returns**:
```typescript
{
  success: boolean;
  message: string;
  summary: {
    totalWorkHours: number;
    finalWage: number;
    verificationSuccessRate: number;
  };
}
```

---

## Fraud Detection System

### 5-Signal Fraud Detection

#### 1. **Location Signals** (8 signals)
- Outside geofence
- Suspiciously accurate GPS (possible spoofing)
- Location jumping (teleportation)
- Impossible speed between checks
- Same location for multiple workers (device sharing)

#### 2. **Attendance Signals** (12 signals)
- Too perfect attendance (>98%)
- Biometric failures
- Late check-ins
- Early check-outs
- Missing random verifications

#### 3. **Payment Signals** (10 signals)
- Suspicious bank account changes
- Withdrawal patterns
- Shared bank accounts
- Unusual transaction patterns

#### 4. **Identity Signals** (8 signals)
- Ghost workers (no previous work history)
- Duplicate profiles
- Invalid Aadhaar patterns
- Missing biometric data

#### 5. **Collusion Signals** (12 signals)
- Multiple workers same device
- Coordinated movements
- Family member clusters
- Official-worker relationships

### Fraud Scoring

```typescript
// Score calculation
let fraudScore = 0;

// Failed verifications (40 points)
fraudScore += (failedVerifications / totalVerifications) * 40;

// Fraud flags (40 points)
fraudScore += Math.min(totalFraudFlags * 10, 40);

// Low work hours (20 points)
if (workPercentage < 50) fraudScore += 20;

// Risk levels
if (fraudScore > 70) return 'critical';
if (fraudScore > 50) return 'high';
if (fraudScore > 30) return 'medium';
return 'low';
```

---

## Wage Calculation Logic

```typescript
// Base calculation
let actualWage = baseWagePerDay; // ₹350

// Adjust for work hours
if (workPercentage >= 80 && verificationRate >= 75) {
  // Full day
  actualWage = baseWagePerDay;
} else if (workPercentage >= 40 && verificationRate >= 60) {
  // Half day
  actualWage = baseWagePerDay * 0.5;
} else {
  // Proportional
  actualWage = baseWagePerDay * (workPercentage / 100);
}

// Deductions for failed verifications
const verificationPenalty = (100 - verificationSuccessRate) * 0.005;
const deductions = actualWage * verificationPenalty;

// Final wage
const finalWage = actualWage - deductions;
```

---

## Random Verification Algorithm

```typescript
function generateRandomSchedule(
  startTime: Date,
  endTime: Date,
  minInterval: number,  // 15 min
  maxInterval: number,  // 45 min
  minVerifications: number  // 4
): Date[] {
  
  const schedules: Date[] = [];
  let currentTime = new Date(startTime.getTime() + 15 * 60 * 1000); // Skip first 15 min
  
  while (currentTime < endTime) {
    // Random interval
    const randomInterval = Math.floor(
      Math.random() * (maxInterval - minInterval + 1) + minInterval
    );
    
    currentTime = new Date(currentTime.getTime() + randomInterval * 60 * 1000);
    
    if (currentTime < endTime) {
      schedules.push(new Date(currentTime));
    }
  }
  
  // Ensure minimum verifications
  if (schedules.length < minVerifications) {
    // Distribute evenly
    const interval = (endTime - startTime) / (minVerifications + 1);
    schedules = [];
    for (let i = 1; i <= minVerifications; i++) {
      schedules.push(new Date(startTime.getTime() + interval * i));
    }
  }
  
  return schedules.sort((a, b) => a.getTime() - b.getTime());
}
```

**Example Output** (8:00 AM - 5:00 PM):
- Check 1: 9:23 AM
- Check 2: 10:45 AM
- Check 3: 12:18 PM
- Check 4: 2:05 PM
- Check 5: 3:47 PM

---

## Integration Guide

### Step 1: Add to App.tsx

```typescript
import AttendanceManagementModule from './components/Modules/AttendanceManagementModule';
import WorkerAttendanceModule from './components/Modules/WorkerAttendanceModule';

// In your routing/module selection
{role === 'official' && <AttendanceManagementModule />}
{role === 'worker' && <WorkerAttendanceModule />}
```

### Step 2: Initialize Scheduler on Server Startup

```typescript
import { initializeAttendanceScheduler } from './services/attendanceScheduler';

// In your server initialization
await initializeAttendanceScheduler();
```

### Step 3: Setup MongoDB Collections

```bash
use sahayog_db

db.createCollection('work_sessions')
db.createCollection('auto_attendance_records')
db.createCollection('location_verification_logs')
db.createCollection('attendance_notifications')

# Indexes for performance
db.work_sessions.createIndex({ sessionId: 1 })
db.work_sessions.createIndex({ status: 1, 'timing.date': 1 })
db.auto_attendance_records.createIndex({ userId: 1, workSessionId: 1 })
db.auto_attendance_records.createIndex({ date: 1, status: 1 })
```

### Step 4: Configure Background Jobs

```typescript
// Cron job for daily session cleanup
import cron from 'node-cron';

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  // Archive completed sessions
  await mongoService.updateMany(
    'work_sessions',
    { status: 'ongoing', 'timing.date': { $lt: new Date().toISOString().split('T')[0] } },
    { $set: { status: 'completed' } }
  );
});
```

---

## Testing Guide

### 1. Test Geofencing

```typescript
// Test case: Worker outside geofence
const result = await automatedAttendanceService.autoCheckIn(
  'user123',
  'Test User',
  'session-123',
  { latitude: 28.7041, longitude: 77.1025, accuracy: 15 }, // 10km away
  { deviceId: 'test-device', platform: 'web' }
);

expect(result.success).toBe(false);
expect(result.message).toContain('away from work site');
```

### 2. Test Random Verification

```typescript
// Simulate verification at scheduled time
const verification = await automatedAttendanceService.performRandomVerification(
  'user123',
  'session-123',
  new Date().toISOString()
);

expect(verification.success).toBe(true);
expect(verification.verification.verified).toBe(true);
```

### 3. Test Wage Calculation

```typescript
// Mock attendance with 90% work and 100% verification
const result = await automatedAttendanceService.autoCheckOut(...);

expect(result.summary.wageCalculation.finalWage).toBeCloseTo(350, 0);
```

---

## Security Considerations

### 1. **GPS Spoofing Prevention**
- Check for suspiciously perfect GPS accuracy (<5m)
- Validate speed between location updates
- Cross-reference with cell tower data
- Use device sensor data (accelerometer, gyroscope)

### 2. **Device Sharing Prevention**
- Track device fingerprints
- Monitor multiple workers from same device
- Require biometric authentication at check-in

### 3. **Data Privacy**
- Encrypt location data at rest
- Store only necessary geolocation info
- Anonymize location logs after 90 days
- GDPR compliant data retention

---

## Performance Optimization

### 1. **Location Update Frequency**
- **Check-in period**: Every 30 seconds (first 5 minutes)
- **Normal work**: Every 2 minutes
- **Low battery**: Every 5 minutes
- **On verification request**: Immediate

### 2. **Database Optimization**
- Index on `userId`, `workSessionId`, `date`
- Archive old attendance records (>90 days)
- Use read replicas for analytics
- Cache active sessions in Redis

### 3. **Scheduler Optimization**
- Use Node.js `setTimeout` for individual schedules
- Cluster mode for horizontal scaling
- Queue-based verification processing
- Graceful shutdown handling

---

## Troubleshooting

### Issue 1: Worker Cannot Check In

**Possible Causes:**
- GPS disabled
- Outside geofence
- Low GPS accuracy
- Session not found

**Solution:**
```typescript
// Debug information
console.log('Location:', locationData);
console.log('Session geofence:', session.workSiteLocation);
console.log('Distance:', distance);
console.log('Within geofence:', withinGeofence);
```

### Issue 2: Verifications Not Triggering

**Possible Causes:**
- Scheduler not started
- Session not in 'ongoing' status
- Worker not checked in

**Solution:**
```typescript
// Check scheduler status
console.log('Active schedules:', attendanceScheduler.getActiveSchedulesCount());

// Manually trigger verification
await attendanceScheduler.executeVerification(userId, sessionId, scheduledTime);
```

### Issue 3: Incorrect Wage Calculation

**Possible Causes:**
- Incomplete check-out
- Failed verifications not counted
- Break time not excluded

**Solution:**
```typescript
// Verify summary data
console.log('Work hours:', attendance.summary.totalWorkHours);
console.log('Expected hours:', attendance.summary.expectedWorkHours);
console.log('Verification rate:', attendance.summary.verificationSuccessRate);
```

---

## Future Enhancements

1. **Offline Mode with Sync**
   - Cache location data when offline
   - Sync when connectivity restored
   - Blockchain-based proof of location

2. **Advanced Fraud Detection**
   - Machine learning fraud scoring
   - Behavioral pattern analysis
   - Image verification (selfie at work site)

3. **Real-time Dashboard**
   - Live map of worker locations
   - Heat map of attendance
   - Predictive analytics for no-shows

4. **Integration with Existing Systems**
   - Aadhaar-based biometric authentication
   - NREGA MIS integration
   - Bank payment automation

5. **Worker App Features**
   - Break time tracking
   - Task completion photos
   - Peer-to-peer verification
   - Gamification (attendance streaks)

---

## Support & Contact

For technical support or questions:
- **Documentation**: `/docs/attendance-system`
- **API Reference**: `/api/attendance`
- **GitHub Issues**: [Suraj-creation/Sahyog/issues](https://github.com/Suraj-creation/Sahyog/issues)

---

## License

This system is part of the SAHAYOG platform, MIT License.

---

**Last Updated**: January 31, 2026
**Version**: 1.0.0
**Author**: SAHAYOG Development Team
