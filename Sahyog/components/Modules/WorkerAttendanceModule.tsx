/**
 * WORKER ATTENDANCE MODULE
 * Mobile interface for workers to manage automated attendance
 */

import React, { useState, useEffect } from 'react';
import { automatedAttendanceService } from '../../services/automatedAttendance';
import { locationTrackingService } from '../../services/attendanceScheduler';

export const WorkerAttendanceModule: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<'not_started' | 'checked_in' | 'checked_out'>('not_started');
  const [locationPermission, setLocationPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string; textHindi: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCount, setVerificationCount] = useState(0);
  const [distanceFromSite, setDistanceFromSite] = useState<number | null>(null);
  
  // Mock user data (would come from auth context)
  const userId = 'user123';
  const userName = 'Ramesh Singh';
  
  // Check location permission on mount
  useEffect(() => {
    checkLocationPermission();
    updateCurrentLocation();
    
    // Update location every 30 seconds
    const locationInterval = setInterval(() => {
      if (attendanceStatus === 'checked_in') {
        updateCurrentLocation();
      }
    }, 30000);
    
    return () => clearInterval(locationInterval);
  }, [attendanceStatus]);
  
  // ============================================
  // LOCATION FUNCTIONS
  // ============================================
  
  const checkLocationPermission = async () => {
    const hasPermission = await locationTrackingService.checkLocationPermission();
    setLocationPermission(hasPermission);
    
    if (!hasPermission) {
      setMessage({
        type: 'error',
        text: 'Location permission required. Please enable GPS.',
        textHindi: 'स्थान अनुमति आवश्यक है। कृपया GPS सक्षम करें।',
      });
    }
  };
  
  const updateCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCurrentLocation(location);
          
          // Calculate distance from work site if session is active
          if (currentSession) {
            const distance = calculateDistance(
              location.latitude,
              location.longitude,
              currentSession.workSiteLocation.latitude,
              currentSession.workSiteLocation.longitude
            );
            setDistanceFromSite(distance);
          }
        },
        (error) => {
          console.error('Location error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }
  };
  
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  };
  
  // ============================================
  // CHECK-IN/CHECK-OUT
  // ============================================
  
  const handleCheckIn = async () => {
    if (!currentSession) {
      setMessage({
        type: 'error',
        text: 'No active work session found',
        textHindi: 'कोई सक्रिय कार्य सत्र नहीं मिला',
      });
      return;
    }
    
    if (!currentLocation) {
      setMessage({
        type: 'error',
        text: 'Fetching location... Please try again',
        textHindi: 'स्थान प्राप्त कर रहे हैं... कृपया पुनः प्रयास करें',
      });
      updateCurrentLocation();
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await automatedAttendanceService.autoCheckIn(
        userId,
        userName,
        currentSession.sessionId,
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: 15, // Mock accuracy
        },
        {
          deviceId: 'device-' + userId,
          platform: 'web',
          batteryLevel: 85,
        }
      );
      
      if (result.success) {
        setAttendanceStatus('checked_in');
        setMessage({
          type: 'success',
          text: result.message,
          textHindi: result.messageHindi,
        });
        
        // Start location tracking
        await locationTrackingService.startTracking(userId, currentSession.sessionId);
      } else {
        setMessage({
          type: 'error',
          text: result.message,
          textHindi: result.messageHindi,
        });
      }
      
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Check-in failed',
        textHindi: 'चेक-इन विफल',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCheckOut = async () => {
    if (!currentSession || !currentLocation) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await automatedAttendanceService.autoCheckOut(
        userId,
        currentSession.sessionId,
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: 15,
        },
        {
          deviceId: 'device-' + userId,
          platform: 'web',
          batteryLevel: 75,
        }
      );
      
      if (result.success) {
        setAttendanceStatus('checked_out');
        setMessage({
          type: 'success',
          text: result.message,
          textHindi: `सफलतापूर्वक चेक आउट किया गया। मजदूरी: ₹${result.summary?.wageCalculation.finalWage.toFixed(2)}`,
        });
        
        // Stop location tracking
        locationTrackingService.stopTracking();
      } else {
        setMessage({
          type: 'error',
          text: result.message,
          textHindi: 'चेक-आउट विफल',
        });
      }
      
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Check-out failed',
        textHindi: 'चेक-आउट विफल',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Mock: Load today's work session
  useEffect(() => {
    // Mock session data
    const mockSession = {
      sessionId: 'session-123',
      workSiteName: 'Village Road Construction - Phase 2',
      workType: 'Road Construction',
      timing: {
        date: new Date().toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '17:00',
        totalWorkHours: 8,
      },
      workSiteLocation: {
        latitude: 28.6139,
        longitude: 77.2090,
        radius: 100,
        address: 'Village Rampur, Block Sadar, District XYZ',
      },
      status: 'ongoing',
    };
    
    setCurrentSession(mockSession);
  }, []);
  
  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="worker-attendance-module" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>🎯 Automated Attendance</h1>
        <p style={{ color: '#666' }}>स्वचालित उपस्थिति प्रणाली</p>
      </div>
      
      {/* Message Alert */}
      {message && (
        <div
          style={{
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '8px',
            backgroundColor:
              message.type === 'success' ? '#d4edda' : message.type === 'error' ? '#f8d7da' : '#d1ecf1',
            border: `1px solid ${
              message.type === 'success' ? '#c3e6cb' : message.type === 'error' ? '#f5c6cb' : '#bee5eb'
            }`,
          }}
        >
          <p style={{ margin: 0, fontWeight: 'bold' }}>{message.text}</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>{message.textHindi}</p>
        </div>
      )}
      
      {/* Location Status */}
      <div
        style={{
          padding: '15px',
          backgroundColor: locationPermission ? '#d4edda' : '#f8d7da',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <p style={{ margin: 0, fontWeight: 'bold' }}>
            {locationPermission ? '✅ GPS Active' : '❌ GPS Disabled'}
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
            {locationPermission ? 'GPS सक्रिय है' : 'GPS बंद है'}
          </p>
        </div>
        {!locationPermission && (
          <button
            onClick={checkLocationPermission}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Enable
          </button>
        )}
      </div>
      
      {/* Current Session Info */}
      {currentSession && (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ marginTop: 0 }}>📍 Today's Work</h3>
          <div style={{ fontSize: '14px' }}>
            <p><strong>Site:</strong> {currentSession.workSiteName}</p>
            <p><strong>Type:</strong> {currentSession.workType}</p>
            <p>
              <strong>Time:</strong> {currentSession.timing.startTime} - {currentSession.timing.endTime} (
              {currentSession.timing.totalWorkHours} hours)
            </p>
            <p><strong>Location:</strong> {currentSession.workSiteLocation.address}</p>
            
            {distanceFromSite !== null && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: distanceFromSite <= currentSession.workSiteLocation.radius ? '#d4edda' : '#fff3cd',
                  borderRadius: '6px',
                }}
              >
                <p style={{ margin: 0, fontWeight: 'bold' }}>
                  📍 Distance from site: {Math.round(distanceFromSite)}m
                </p>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
                  {distanceFromSite <= currentSession.workSiteLocation.radius
                    ? '✅ Within geofence / भू-बाड़ के भीतर'
                    : `⚠️ Outside geofence (${currentSession.workSiteLocation.radius}m required)`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Attendance Status Card */}
      <div
        style={{
          padding: '30px',
          backgroundColor:
            attendanceStatus === 'not_started'
              ? '#ffffff'
              : attendanceStatus === 'checked_in'
              ? '#d4edda'
              : '#fff3cd',
          border: '2px solid #e0e0e0',
          borderRadius: '12px',
          textAlign: 'center',
          marginBottom: '20px',
        }}
      >
        {attendanceStatus === 'not_started' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⏰</div>
            <h2>Ready to Check In</h2>
            <p style={{ color: '#666' }}>चेक इन के लिए तैयार</p>
            <button
              onClick={handleCheckIn}
              disabled={isLoading || !locationPermission}
              style={{
                marginTop: '20px',
                padding: '16px 32px',
                fontSize: '18px',
                fontWeight: 'bold',
                backgroundColor: isLoading || !locationPermission ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading || !locationPermission ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Checking In...' : '✅ Check In / चेक इन करें'}
            </button>
          </>
        )}
        
        {attendanceStatus === 'checked_in' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
            <h2>Attendance Active</h2>
            <p style={{ color: '#666' }}>उपस्थिति सक्रिय है</p>
            
            {/* Live Status */}
            <div
              style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                textAlign: 'left',
              }}
            >
              <p style={{ margin: '5px 0' }}>
                <strong>Check-in Time:</strong> {new Date().toLocaleTimeString()}
              </p>
              <p style={{ margin: '5px 0' }}>
                <strong>Location Updates:</strong> Every 2 minutes
              </p>
              <p style={{ margin: '5px 0' }}>
                <strong>Random Verifications:</strong> {verificationCount} completed
              </p>
              <div
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#4CAF50',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite',
                  }}
                />
                <span style={{ fontSize: '14px', color: '#4CAF50' }}>
                  Live Tracking Active / लाइव ट्रैकिंग सक्रिय
                </span>
              </div>
            </div>
            
            <button
              onClick={handleCheckOut}
              disabled={isLoading}
              style={{
                marginTop: '20px',
                padding: '16px 32px',
                fontSize: '18px',
                fontWeight: 'bold',
                backgroundColor: isLoading ? '#ccc' : '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Checking Out...' : '🚪 Check Out / चेक आउट करें'}
            </button>
          </>
        )}
        
        {attendanceStatus === 'checked_out' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎉</div>
            <h2>Work Complete!</h2>
            <p style={{ color: '#666' }}>कार्य पूर्ण!</p>
            <p style={{ marginTop: '15px', fontSize: '14px' }}>
              Your attendance has been recorded. Wage will be calculated and approved by officials.
            </p>
            <p style={{ fontSize: '14px' }}>
              आपकी उपस्थिति दर्ज कर ली गई है। मजदूरी की गणना और अधिकारियों द्वारा अनुमोदित की जाएगी।
            </p>
          </>
        )}
      </div>
      
      {/* Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div
          style={{
            padding: '15px',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '32px' }}>🎲</div>
          <p style={{ margin: '10px 0 0 0', fontWeight: 'bold' }}>Random Checks</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>स्वचालित सत्यापन</p>
        </div>
        
        <div
          style={{
            padding: '15px',
            backgroundColor: '#f3e5f5',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '32px' }}>🛡️</div>
          <p style={{ margin: '10px 0 0 0', fontWeight: 'bold' }}>Fraud Prevention</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>धोखाधड़ी रोकथाम</p>
        </div>
      </div>
      
      {/* How It Works */}
      <div
        style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
        }}
      >
        <h3>How It Works / यह कैसे काम करता है</h3>
        <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
          <li>✅ Check in when you arrive at work site / कार्यस्थल पर पहुंचने पर चेक इन करें</li>
          <li>📍 Keep GPS enabled throughout work / काम के दौरान GPS सक्षम रखें</li>
          <li>🎲 System verifies your location randomly / सिस्टम यादृच्छिक रूप से आपकी स्थिति सत्यापित करता है</li>
          <li>🚪 Check out when work ends / काम खत्म होने पर चेक आउट करें</li>
          <li>💰 Wage calculated automatically / मजदूरी स्वचालित रूप से गणना की जाती है</li>
        </ol>
      </div>
      
      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default WorkerAttendanceModule;
