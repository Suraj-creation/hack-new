/**
 * ATTENDANCE MANAGEMENT MODULE
 * For Government Officials/Sarpanch to manage work sessions and attendance
 */

import React, { useState, useEffect } from 'react';
import { automatedAttendanceService } from '../../services/automatedAttendance';
import { attendanceScheduler } from '../../services/attendanceScheduler';
import type { WorkSessionDocument, AutoAttendanceRecord } from '../../services/automatedAttendance';

export const AttendanceManagementModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'active' | 'history' | 'analytics'>('create');
  const [sessions, setSessions] = useState<WorkSessionDocument[]>([]);
  const [selectedSession, setSelectedSession] = useState<WorkSessionDocument | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AutoAttendanceRecord[]>([]);
  
  // Form state for creating session
  const [formData, setFormData] = useState({
    workOpportunityId: '',
    workSiteName: '',
    workType: 'road_construction',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '17:00',
    breakStartTime: '12:00',
    breakEndTime: '13:00',
    latitude: 0,
    longitude: 0,
    radius: 100,
    address: '',
    assignedWorkers: [] as string[],
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // ============================================
  // CREATE WORK SESSION
  // ============================================
  
  const handleCreateSession = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      // Validate form
      if (!formData.workSiteName || !formData.address || formData.assignedWorkers.length === 0) {
        throw new Error('Please fill all required fields');
      }
      
      // Create session
      const session = await automatedAttendanceService.createWorkSession(
        'official123', // Would come from auth context
        'Ramesh Kumar',
        'sarpanch',
        {
          workOpportunityId: formData.workOpportunityId || `work-${Date.now()}`,
          workSiteName: formData.workSiteName,
          workType: formData.workType,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          breakStartTime: formData.breakStartTime || undefined,
          breakEndTime: formData.breakEndTime || undefined,
          workSiteLocation: {
            latitude: formData.latitude,
            longitude: formData.longitude,
            radius: formData.radius,
            address: formData.address,
          },
          assignedWorkers: formData.assignedWorkers,
        }
      );
      
      // Start scheduler
      await attendanceScheduler.startScheduling(session.sessionId);
      
      setMessage({
        type: 'success',
        text: `Work session created successfully! ${session.totalWorkers} workers assigned.`,
      });
      
      // Reset form
      setFormData({
        ...formData,
        workSiteName: '',
        address: '',
        assignedWorkers: [],
      });
      
      // Switch to active sessions tab
      setActiveTab('active');
      
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to create work session',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setMessage({
            type: 'success',
            text: 'Location captured successfully',
          });
        },
        (error) => {
          setMessage({
            type: 'error',
            text: 'Failed to get location. Please enable GPS.',
          });
        }
      );
    } else {
      setMessage({
        type: 'error',
        text: 'Geolocation not supported by your device',
      });
    }
  };
  
  // ============================================
  // VIEW ATTENDANCE RECORDS
  // ============================================
  
  const viewAttendanceRecords = async (sessionId: string) => {
    setIsLoading(true);
    try {
      // Fetch attendance records for this session
      // const records = await mongoService.find('auto_attendance_records', { workSessionId: sessionId });
      // setAttendanceRecords(records);
      
      // Mock data for demo
      const mockRecords: AutoAttendanceRecord[] = [
        {
          attendanceId: 'att-1',
          userId: 'user1',
          userName: 'Ramesh Singh',
          workSessionId: sessionId,
          workOpportunityId: 'work-123',
          date: new Date().toISOString().split('T')[0],
          status: 'present',
          checkIn: {
            timestamp: new Date().toISOString(),
            location: { latitude: 28.6139, longitude: 77.2090, accuracy: 15 },
            deviceInfo: { deviceId: 'device1', platform: 'android' },
            method: 'auto',
            withinGeofence: true,
            distanceFromWorkSite: 25,
          },
          randomVerifications: [
            {
              verificationId: 'ver-1',
              timestamp: new Date().toISOString(),
              scheduledAt: new Date().toISOString(),
              actualAt: new Date().toISOString(),
              timeDifference: 5,
              location: { latitude: 28.6139, longitude: 77.2090, accuracy: 20 },
              withinGeofence: true,
              distanceFromWorkSite: 30,
              verified: true,
              fraudFlags: [],
            },
          ],
          summary: {
            totalWorkHours: 8,
            expectedWorkHours: 8,
            workPercentage: 100,
            totalVerifications: 4,
            successfulVerifications: 4,
            failedVerifications: 0,
            verificationSuccessRate: 100,
            isFullDay: true,
            isHalfDay: false,
          },
          fraudAnalysis: {
            overallRiskScore: 5,
            riskLevel: 'low',
            suspiciousPatterns: [],
            requiresManualReview: false,
          },
          wageCalculation: {
            baseWagePerDay: 350,
            actualWageEarned: 350,
            deductions: 0,
            finalWage: 350,
            calculatedAt: new Date().toISOString(),
          },
          approval: {
            status: 'pending',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      setAttendanceRecords(mockRecords);
      
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="attendance-management-module" style={{ padding: '20px' }}>
      <h1>🎯 Automated Attendance Management</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Manage work sessions with location-based automated attendance tracking
      </p>
      
      {/* Message Alert */}
      {message && (
        <div
          style={{
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '8px',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          }}
        >
          {message.text}
        </div>
      )}
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #e0e0e0' }}>
        {['create', 'active', 'history', 'analytics'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderBottom: activeTab === tab ? '3px solid #2196F3' : 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              color: activeTab === tab ? '#2196F3' : '#666',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'create' && '➕ '}
            {tab === 'active' && '🔄 '}
            {tab === 'history' && '📜 '}
            {tab === 'analytics' && '📊 '}
            {tab}
          </button>
        ))}
      </div>
      
      {/* Create Session Tab */}
      {activeTab === 'create' && (
        <div className="create-session-form" style={{ maxWidth: '800px' }}>
          <h2>Create New Work Session</h2>
          
          <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
            {/* Work Site Name */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Work Site Name *
              </label>
              <input
                type="text"
                value={formData.workSiteName}
                onChange={(e) => setFormData({ ...formData, workSiteName: e.target.value })}
                placeholder="e.g., Village Road Construction - Phase 2"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>
            
            {/* Work Type */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Work Type
              </label>
              <select
                value={formData.workType}
                onChange={(e) => setFormData({ ...formData, workType: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value="road_construction">Road Construction</option>
                <option value="pond_digging">Pond Digging</option>
                <option value="tree_plantation">Tree Plantation</option>
                <option value="drainage_work">Drainage Work</option>
                <option value="building_construction">Building Construction</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            {/* Date and Timing */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Start Time *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  End Time *
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                  }}
                />
              </div>
            </div>
            
            {/* Break Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Break Start (Optional)
                </label>
                <input
                  type="time"
                  value={formData.breakStartTime}
                  onChange={(e) => setFormData({ ...formData, breakStartTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Break End (Optional)
                </label>
                <input
                  type="time"
                  value={formData.breakEndTime}
                  onChange={(e) => setFormData({ ...formData, breakEndTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                  }}
                />
              </div>
            </div>
            
            {/* Location */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Work Site Location *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px' }}>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                  placeholder="Latitude"
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                  }}
                />
                <input
                  type="number"
                  step="0.000001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                  placeholder="Longitude"
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                  }}
                />
                <button
                  onClick={handleGetCurrentLocation}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  📍 Get GPS
                </button>
              </div>
            </div>
            
            {/* Address */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Address *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address of work site"
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>
            
            {/* Geofence Radius */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Geofence Radius: {formData.radius}m
              </label>
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={formData.radius}
                onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Workers must be within this radius to mark attendance
              </p>
            </div>
            
            {/* Assigned Workers */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Assigned Workers * ({formData.assignedWorkers.length} selected)
              </label>
              <button
                onClick={() => {
                  // Mock: Add sample workers
                  setFormData({
                    ...formData,
                    assignedWorkers: ['user1', 'user2', 'user3', 'user4', 'user5'],
                  });
                }}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Select Workers
              </button>
            </div>
            
            {/* Submit Button */}
            <button
              onClick={handleCreateSession}
              disabled={isLoading}
              style={{
                padding: '16px',
                backgroundColor: isLoading ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginTop: '20px',
              }}
            >
              {isLoading ? 'Creating...' : '✅ Create Work Session & Start Attendance'}
            </button>
          </div>
        </div>
      )}
      
      {/* Active Sessions Tab */}
      {activeTab === 'active' && (
        <div className="active-sessions">
          <h2>Active Work Sessions</h2>
          <p style={{ color: '#666' }}>
            Real-time attendance tracking with automated location verification
          </p>
          
          <div style={{ marginTop: '20px' }}>
            <div
              style={{
                padding: '20px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9',
              }}
            >
              <h3>🏗️ Village Road Construction - Phase 2</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                <p><strong>Time:</strong> 08:00 - 17:00</p>
                <p><strong>Workers:</strong> 25 assigned, 23 checked in</p>
                <p><strong>Status:</strong> <span style={{ color: '#4CAF50' }}>● Ongoing</span></p>
              </div>
              
              <button
                onClick={() => viewAttendanceRecords('session-123')}
                style={{
                  marginTop: '15px',
                  padding: '10px 20px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                View Attendance Records
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Attendance Records */}
      {attendanceRecords.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>Attendance Records</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Worker</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Check-in</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Verifications</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Work %</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Wage</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Fraud Risk</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record) => (
                  <tr key={record.attendanceId}>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{record.userName}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: record.status === 'present' ? '#d4edda' : '#f8d7da',
                          color: record.status === 'present' ? '#155724' : '#721c24',
                        }}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      {record.checkIn ? new Date(record.checkIn.timestamp).toLocaleTimeString() : '-'}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      {record.summary.successfulVerifications}/{record.summary.totalVerifications} (
                      {record.summary.verificationSuccessRate.toFixed(0)}%)
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      {record.summary.workPercentage.toFixed(0)}%
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      ₹{record.wageCalculation.finalWage.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      <span
                        style={{
                          color:
                            record.fraudAnalysis.riskLevel === 'low'
                              ? '#4CAF50'
                              : record.fraudAnalysis.riskLevel === 'medium'
                              ? '#FF9800'
                              : '#f44336',
                        }}
                      >
                        {record.fraudAnalysis.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagementModule;
