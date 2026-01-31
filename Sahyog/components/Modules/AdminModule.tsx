import React, { useState, useEffect, useCallback } from 'react';
import { generateAllData, GeneratedData } from '../../services/database/dummyDataGenerator';
import { MLUserDocument, MGNREGAWorkRecord, PaymentTransaction, GrievanceRecord, SchemeEnrollment, MLFeatureRecord } from '../../services/database/mlSchemas';
import { authService, AdminSession } from '../../services/authService';
import { schemeService, MGNREGAJobPosting, ALL_SCHEMES, AdminJobCreationRequest } from '../../services/schemeService';
import { grievanceService } from '../../services/grievanceService';
import { userDataService, RAMESH_SINGH } from '../../services/userDataService';

// ============================================
// TYPES
// ============================================

type TabType = 'overview' | 'users' | 'work' | 'payments' | 'grievances' | 'schemes' | 'ml' | 'settings' | 'jobs' | 'create-job';

interface TabConfig {
  id: TabType;
  label: string;
  icon: string;
}

// ============================================
// COMPONENT
// ============================================

const AdminModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [data, setData] = useState<GeneratedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<MLUserDocument | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [loginError, setLoginError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Job management state
  const [jobs, setJobs] = useState<MGNREGAJobPosting[]>([]);
  const [liveGrievances, setLiveGrievances] = useState<any[]>([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [jobForm, setJobForm] = useState<Partial<AdminJobCreationRequest>>({
    title: '',
    titleHindi: '',
    description: '',
    descriptionHindi: '',
    workType: 'earth_work',
    village: '',
    gramPanchayat: '',
    block: '',
    district: '',
    state: 'Madhya Pradesh',
    wagePerDay: 352,
    totalSlots: 20,
    requiredSkills: [],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    priorityCategories: [],
    supervisorName: '',
    supervisorPhone: '',
    materialProvided: false,
    toolsProvided: false
  });

  // Tab configuration
  const tabs: TabConfig[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'jobs', label: 'Jobs', icon: '💼' },
    { id: 'create-job', label: 'Create Job', icon: '➕' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'work', label: 'Work Records', icon: '🏗️' },
    { id: 'payments', label: 'Payments', icon: '💰' },
    { id: 'grievances', label: 'Grievances', icon: '📝' },
    { id: 'schemes', label: 'Schemes', icon: '📋' },
    { id: 'ml', label: 'ML Features', icon: '🤖' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  // Check existing session on mount
  useEffect(() => {
    const session = authService.getAdminSession();
    if (session) {
      setAdminSession(session);
      setIsLoggedIn(true);
    }
  }, []);

  // Load jobs and live data
  useEffect(() => {
    if (isLoggedIn) {
      setJobs(schemeService.getAllJobs());
      setLiveGrievances(grievanceService.getAllGrievances());
    }
  }, [isLoggedIn, activeTab]);

  // Load data from localStorage or generate fresh
  useEffect(() => {
    const storedData = localStorage.getItem('sahayog_admin_data');
    if (storedData) {
      try {
        setData(JSON.parse(storedData));
      } catch (e) {
        console.error('Failed to parse stored data:', e);
      }
    }
  }, []);

  // Auth handlers
  const handleLogin = async () => {
    setLoginError('');
    const session = await authService.loginAdmin(username, password);
    if (session) {
      setAdminSession(session);
      setIsLoggedIn(true);
    } else {
      setLoginError('Invalid credentials. Please try again.');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setAdminSession(null);
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  // Job handlers
  const handleCreateJob = async () => {
    try {
      if (!jobForm.title || !jobForm.village || !jobForm.startDate) {
        setMessage({ text: 'Please fill required fields', type: 'error' });
        return;
      }

      const job = await schemeService.createJob(jobForm as AdminJobCreationRequest, adminSession?.adminId || 'admin');
      
      if (job) {
        setMessage({ text: '✅ Job created successfully!', type: 'success' });
        setJobs(schemeService.getAllJobs());
        setTimeout(() => {
          setActiveTab('jobs');
          setMessage({ text: '', type: '' });
        }, 1500);
        
        // Reset form
        setJobForm({
          title: '',
          titleHindi: '',
          description: '',
          descriptionHindi: '',
          workType: 'earth_work',
          village: '',
          gramPanchayat: '',
          block: '',
          district: '',
          state: 'Madhya Pradesh',
          wagePerDay: 352,
          totalSlots: 20,
          requiredSkills: [],
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          priorityCategories: [],
          supervisorName: '',
          supervisorPhone: '',
          materialProvided: false,
          toolsProvided: false
        });
      }
    } catch (error) {
      setMessage({ text: '❌ Failed to create job', type: 'error' });
    }
  };

  const handleApproveApplication = async (jobId: string, applicantId: string) => {
    const result = await schemeService.approveApplication(jobId, applicantId, adminSession?.userId || 'admin');
    if (result) {
      setMessage({ text: '✅ Application approved!', type: 'success' });
      setJobs(schemeService.getAllJobs());
      setTimeout(() => setMessage({ text: '', type: '' }), 2000);
    }
  };

  const handleRejectApplication = async (jobId: string, applicantId: string) => {
    const result = schemeService.rejectApplication(jobId, applicantId, 'Does not meet requirements');
    if (result.success) {
      setMessage({ text: 'Application rejected', type: 'info' });
      setJobs(schemeService.getAllJobs());
      setTimeout(() => setMessage({ text: '', type: '' }), 2000);
    }
  };

  const handleUpdateGrievanceStatus = async (grievanceId: string, status: string) => {
    grievanceService.updateStatus(grievanceId, status as any, 'Status updated by admin');
    setMessage({ text: '✅ Grievance status updated!', type: 'success' });
    setLiveGrievances(grievanceService.getAllGrievances());
    setTimeout(() => setMessage({ text: '', type: '' }), 2000);
  };

  // Generate fresh dummy data
  const handleGenerateData = useCallback(() => {
    setIsLoading(true);
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const newData = generateAllData();
      setData(newData);
      localStorage.setItem('sahayog_admin_data', JSON.stringify(newData));
      setIsLoading(false);
    }, 100);
  }, []);

  // Clear all data
  const handleClearData = useCallback(() => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setData(null);
      localStorage.removeItem('sahayog_admin_data');
    }
  }, []);

  // Filter data based on search
  const filterBySearch = useCallback(<T extends object>(items: T[], fields: (keyof T)[]): T[] => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item => 
      fields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(term);
      })
    );
  }, [searchTerm]);

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  const renderOverview = () => {
    if (!data) return renderNoData();

    const anomalousUsers = data.users.filter(u => u.mlFlags?.isAnomaly);
    const overdueGrievances = data.grievances.filter(g => g.isOverdue);
    const pendingPayments = data.payments.filter(p => p.status === 'pending');
    const failedPayments = data.payments.filter(p => p.status === 'failed');
    const flaggedPayments = data.payments.filter(p => p.isFlagged);

    const stats = [
      { label: 'Total Users', value: data.users.length, icon: '👥', color: 'bg-blue-100 text-blue-800' },
      { label: 'Work Records', value: data.workRecords.length, icon: '🏗️', color: 'bg-green-100 text-green-800' },
      { label: 'Payments', value: data.payments.length, icon: '💰', color: 'bg-purple-100 text-purple-800' },
      { label: 'Grievances', value: data.grievances.length, icon: '📝', color: 'bg-yellow-100 text-yellow-800' },
      { label: 'Scheme Enrollments', value: data.schemeEnrollments.length, icon: '📋', color: 'bg-indigo-100 text-indigo-800' },
      { label: 'ML Features', value: data.mlFeatures.length, icon: '🤖', color: 'bg-pink-100 text-pink-800' }
    ];

    const alerts = [
      { label: 'Anomalous Users (Fraud Risk)', value: anomalousUsers.length, icon: '⚠️', color: 'bg-red-100 text-red-800' },
      { label: 'Overdue Grievances', value: overdueGrievances.length, icon: '⏰', color: 'bg-orange-100 text-orange-800' },
      { label: 'Pending Payments', value: pendingPayments.length, icon: '⏳', color: 'bg-yellow-100 text-yellow-800' },
      { label: 'Failed Payments', value: failedPayments.length, icon: '❌', color: 'bg-red-100 text-red-800' },
      { label: 'Flagged Payments', value: flaggedPayments.length, icon: '🚩', color: 'bg-orange-100 text-orange-800' }
    ];

    return (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map(stat => (
            <div key={stat.label} className={`${stat.color} rounded-lg p-4 shadow-sm`}>
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              <div className="text-sm opacity-80">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Alerts Section */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">🚨 Alerts & Flags</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map(alert => (
              <div key={alert.label} className={`${alert.color} rounded-lg p-3 flex items-center justify-between`}>
                <span className="flex items-center gap-2">
                  <span>{alert.icon}</span>
                  <span className="text-sm">{alert.label}</span>
                </span>
                <span className="font-bold">{alert.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">📊 Data Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span>Generated At</span>
              <span className="font-mono">{new Date(data.metadata.generatedAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>Total Work Hours</span>
              <span className="font-mono">{data.workRecords.reduce((sum, r) => sum + r.hoursWorked, 0).toLocaleString()} hrs</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>Total Wages Paid</span>
              <span className="font-mono">₹{data.workRecords.reduce((sum, r) => sum + r.actualWageEarned, 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>Average Risk Score</span>
              <span className="font-mono">{(data.users.reduce((sum, u) => sum + (u.mlFlags?.riskScore || 0), 0) / data.users.length).toFixed(1)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Fraud Detection Rate</span>
              <span className="font-mono">{((anomalousUsers.length / data.users.length) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    if (!data) return renderNoData();
    
    const filteredUsers = filterBySearch(data.users, ['userId', 'name', 'phoneNumber', 'location']);

    return (
      <div className="space-y-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search users by name, ID, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">User ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Age/Gender</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Location</th>
                  <th className="px-4 py-3 text-left font-semibold">MGNREGA Days</th>
                  <th className="px-4 py-3 text-left font-semibold">Risk Score</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.slice(0, 50).map(user => (
                  <tr key={user.userId} className={`hover:bg-gray-50 ${user.mlFlags?.isAnomaly ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs">{user.userId}</td>
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3">{user.age} / {user.gender === 'male' ? '♂' : '♀'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.category === 'SC' ? 'bg-purple-100 text-purple-800' :
                        user.category === 'ST' ? 'bg-green-100 text-green-800' :
                        user.category === 'OBC' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{user.location.village}, {user.location.block}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${user.mgnrega.currentYearDaysWorked < 50 ? 'text-orange-600' : 'text-green-600'}`}>
                        {user.mgnrega.currentYearDaysWorked}/100
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        (user.mlFlags?.riskScore || 0) > 60 ? 'bg-red-100 text-red-800' :
                        (user.mlFlags?.riskScore || 0) > 30 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.mlFlags?.riskScore || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setSelectedUser(user); setShowModal(true); }}
                        className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Showing {Math.min(filteredUsers.length, 50)} of {filteredUsers.length} users
          </div>
        </div>
      </div>
    );
  };

  const renderWorkRecords = () => {
    if (!data) return renderNoData();
    
    const filteredRecords = filterBySearch(data.workRecords, ['recordId', 'userId', 'workerName', 'workType']);

    return (
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search work records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Record ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Worker</th>
                  <th className="px-4 py-3 text-left font-semibold">Work Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Hours</th>
                  <th className="px-4 py-3 text-left font-semibold">Wage (₹)</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.slice(0, 100).map(record => (
                  <tr key={record.recordId} className={`hover:bg-gray-50 ${record.riskScore > 50 ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs">{record.recordId}</td>
                    <td className="px-4 py-3">{record.workerName}</td>
                    <td className="px-4 py-3 capitalize">{record.workType}</td>
                    <td className="px-4 py-3">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={record.hoursWorked > 12 ? 'text-red-600 font-bold' : ''}>
                        {record.hoursWorked}h
                      </span>
                    </td>
                    <td className="px-4 py-3">₹{record.actualWageEarned}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        record.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        record.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {record.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {record.anomalyFlags.locationMismatch && <span title="Location Mismatch">📍</span>}
                        {record.anomalyFlags.timingAnomaly && <span title="Timing Anomaly">⏰</span>}
                        {record.anomalyFlags.excessiveHours && <span title="Excessive Hours">⚠️</span>}
                        {record.anomalyFlags.paymentMismatch && <span title="Payment Mismatch">💰</span>}
                        {record.mlPrediction?.isFraudulent && <span title="Fraud Detected">🚨</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Showing {Math.min(filteredRecords.length, 100)} of {filteredRecords.length} work records
          </div>
        </div>
      </div>
    );
  };

  const renderPayments = () => {
    if (!data) return renderNoData();
    
    const filteredPayments = filterBySearch(data.payments, ['transactionId', 'userId', 'recipientName']);

    return (
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search payments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Transaction ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Recipient</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Source</th>
                  <th className="px-4 py-3 text-left font-semibold">Bank</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Delay</th>
                  <th className="px-4 py-3 text-left font-semibold">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.slice(0, 100).map(payment => (
                  <tr key={payment.transactionId} className={`hover:bg-gray-50 ${payment.isFlagged ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs">{payment.transactionId}</td>
                    <td className="px-4 py-3">{payment.recipientName}</td>
                    <td className="px-4 py-3 font-medium">₹{payment.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">{payment.source}</td>
                    <td className="px-4 py-3 text-xs">{payment.bankName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        payment.status === 'success' ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={payment.delayDays > 15 ? 'text-red-600 font-bold' : ''}>
                        {payment.delayDays} days
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {payment.isFlagged && <span className="text-red-500">🚩</span>}
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                        payment.riskScore > 60 ? 'bg-red-100 text-red-800' :
                        payment.riskScore > 30 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {payment.riskScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Showing {Math.min(filteredPayments.length, 100)} of {filteredPayments.length} payments
          </div>
        </div>
      </div>
    );
  };

  const renderGrievances = () => {
    if (!data) return renderNoData();
    
    const filteredGrievances = filterBySearch(data.grievances, ['ticketNumber', 'userId', 'category']);

    return (
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search grievances..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Ticket #</th>
                  <th className="px-4 py-3 text-left font-semibold">User ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Registered</th>
                  <th className="px-4 py-3 text-left font-semibold">Days Since</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Priority</th>
                  <th className="px-4 py-3 text-left font-semibold">SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredGrievances.slice(0, 100).map(grievance => (
                  <tr key={grievance.ticketNumber} className={`hover:bg-gray-50 ${grievance.isOverdue ? 'bg-orange-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs">{grievance.ticketNumber}</td>
                    <td className="px-4 py-3 font-mono text-xs">{grievance.userId}</td>
                    <td className="px-4 py-3 capitalize">{grievance.category.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-xs">{new Date(grievance.registeredAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={grievance.daysSinceRegistration > 5 ? 'text-red-600 font-bold' : ''}>
                        {grievance.daysSinceRegistration} days
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        grievance.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        grievance.status === 'escalated' ? 'bg-red-100 text-red-800' :
                        grievance.status === 'investigating' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {grievance.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        grievance.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {grievance.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {grievance.slaBreached ? (
                        <span className="text-red-600">⚠️ Breached</span>
                      ) : grievance.isOverdue ? (
                        <span className="text-orange-600">⏰ Overdue</span>
                      ) : (
                        <span className="text-green-600">✓ On track</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Showing {Math.min(filteredGrievances.length, 100)} of {filteredGrievances.length} grievances
          </div>
        </div>
      </div>
    );
  };

  const renderSchemes = () => {
    if (!data) return renderNoData();
    
    const filteredEnrollments = filterBySearch(data.schemeEnrollments, ['enrollmentId', 'userId', 'schemeName']);

    // Group by scheme
    const schemeStats = SCHEME_NAMES.map(scheme => ({
      name: scheme,
      count: data.schemeEnrollments.filter(e => e.schemeName === scheme).length,
      approved: data.schemeEnrollments.filter(e => e.schemeName === scheme && e.status === 'approved').length,
      pending: data.schemeEnrollments.filter(e => e.schemeName === scheme && ['submitted', 'under_review'].includes(e.status)).length
    }));

    return (
      <div className="space-y-6">
        {/* Scheme Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {schemeStats.filter(s => s.count > 0).map(scheme => (
            <div key={scheme.name} className="bg-white rounded-lg shadow p-3">
              <div className="font-medium text-sm">{scheme.name}</div>
              <div className="text-2xl font-bold text-orange-600">{scheme.count}</div>
              <div className="text-xs text-gray-500">
                {scheme.approved} approved, {scheme.pending} pending
              </div>
            </div>
          ))}
        </div>

        {/* Enrollments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Enrollment ID</th>
                  <th className="px-4 py-3 text-left font-semibold">User ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Scheme</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Applied</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Benefits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEnrollments.slice(0, 100).map(enrollment => (
                  <tr key={enrollment.enrollmentId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{enrollment.enrollmentId}</td>
                    <td className="px-4 py-3 font-mono text-xs">{enrollment.userId}</td>
                    <td className="px-4 py-3 font-medium">{enrollment.schemeName}</td>
                    <td className="px-4 py-3 capitalize">{enrollment.schemeCategory}</td>
                    <td className="px-4 py-3 text-xs">{new Date(enrollment.applicationDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        enrollment.status === 'approved' ? 'bg-green-100 text-green-800' :
                        enrollment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">₹{enrollment.totalBenefitsReceived.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderMLFeatures = () => {
    if (!data) return renderNoData();
    
    const filteredFeatures = filterBySearch(data.mlFeatures, ['recordId']);

    // ML Stats
    const fraudulent = data.mlFeatures.filter(f => f.labels?.isFraudulent).length;
    const highRisk = data.mlFeatures.filter(f => f.labels?.riskLevel === 'high').length;
    const avgAnomalyScore = data.mlFeatures.reduce((sum, f) => sum + (f.labels?.anomalyScore || 0), 0) / data.mlFeatures.length;

    return (
      <div className="space-y-6">
        {/* ML Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-red-100 rounded-lg p-4">
            <div className="text-3xl font-bold text-red-800">{fraudulent}</div>
            <div className="text-sm text-red-700">Fraudulent Records</div>
          </div>
          <div className="bg-orange-100 rounded-lg p-4">
            <div className="text-3xl font-bold text-orange-800">{highRisk}</div>
            <div className="text-sm text-orange-700">High Risk Users</div>
          </div>
          <div className="bg-blue-100 rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-800">{(avgAnomalyScore * 100).toFixed(1)}%</div>
            <div className="text-sm text-blue-700">Avg Anomaly Score</div>
          </div>
        </div>

        {/* Feature Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Record ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Days Worked</th>
                  <th className="px-4 py-3 text-left font-semibold">Avg Hours</th>
                  <th className="px-4 py-3 text-left font-semibold">Location Var</th>
                  <th className="px-4 py-3 text-left font-semibold">Payment Delay</th>
                  <th className="px-4 py-3 text-left font-semibold">Cluster Score</th>
                  <th className="px-4 py-3 text-left font-semibold">Anomaly</th>
                  <th className="px-4 py-3 text-left font-semibold">Fraud</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFeatures.slice(0, 50).map(feature => (
                  <tr key={feature.recordId} className={`hover:bg-gray-50 ${feature.labels?.isFraudulent ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs">{feature.recordId}</td>
                    <td className="px-4 py-3">{feature.workFeatures?.totalDaysWorked}</td>
                    <td className="px-4 py-3">{feature.workFeatures?.avgHoursPerDay.toFixed(1)}h</td>
                    <td className="px-4 py-3">
                      <span className={(feature.workFeatures?.locationVariance || 0) > 0.1 ? 'text-red-600 font-bold' : ''}>
                        {((feature.workFeatures?.locationVariance || 0) * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={(feature.paymentFeatures?.avgPaymentDelay || 0) > 15 ? 'text-red-600 font-bold' : ''}>
                        {feature.paymentFeatures?.avgPaymentDelay} days
                      </span>
                    </td>
                    <td className="px-4 py-3">{((feature.networkFeatures?.clusterScore || 0) * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        (feature.labels?.anomalyScore || 0) > 0.5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {((feature.labels?.anomalyScore || 0) * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {feature.labels?.isFraudulent ? (
                        <span className="text-red-600 font-bold">🚨 {feature.labels.fraudType}</span>
                      ) : (
                        <span className="text-green-600">✓ Clean</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(data.mlFeatures, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'ml_features_export.json';
              a.click();
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            📥 Export ML Features (JSON)
          </button>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">🔧 Data Management</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Generate Dummy Data</div>
                <div className="text-sm text-gray-500">Create 50 users with complete records for testing</div>
              </div>
              <button
                onClick={handleGenerateData}
                disabled={isLoading}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {isLoading ? '⏳ Generating...' : '🚀 Generate Data'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Clear All Data</div>
                <div className="text-sm text-gray-500">Remove all stored data from localStorage</div>
              </div>
              <button
                onClick={handleClearData}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                🗑️ Clear Data
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Export All Data</div>
                <div className="text-sm text-gray-500">Download complete dataset as JSON</div>
              </div>
              <button
                onClick={() => {
                  if (!data) return;
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'sahayog_complete_export.json';
                  a.click();
                }}
                disabled={!data}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                📥 Export JSON
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Export as CSV</div>
                <div className="text-sm text-gray-500">Download users data as CSV for ML training</div>
              </div>
              <button
                onClick={() => {
                  if (!data) return;
                  const headers = ['userId', 'name', 'age', 'gender', 'category', 'district', 'block', 'village', 'daysWorked', 'riskScore', 'isAnomaly'];
                  const csvRows = [
                    headers.join(','),
                    ...data.users.map(u => [
                      u.userId,
                      `"${u.name}"`,
                      u.age,
                      u.gender,
                      u.category,
                      `"${u.location.district}"`,
                      `"${u.location.block}"`,
                      `"${u.location.village}"`,
                      u.mgnrega.currentYearDaysWorked,
                      u.mlFlags?.riskScore || 0,
                      u.mlFlags?.isAnomaly ? 'true' : 'false'
                    ].join(','))
                  ];
                  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'sahayog_users.csv';
                  a.click();
                }}
                disabled={!data}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                📊 Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Data Info */}
        {data && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">📈 Current Data Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Users:</span>
                <span className="font-medium">{data.users.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Work Records:</span>
                <span className="font-medium">{data.workRecords.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payments:</span>
                <span className="font-medium">{data.payments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Grievances:</span>
                <span className="font-medium">{data.grievances.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Scheme Enrollments:</span>
                <span className="font-medium">{data.schemeEnrollments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ML Features:</span>
                <span className="font-medium">{data.mlFeatures.length}</span>
              </div>
              <div className="flex justify-between col-span-2 pt-2 border-t">
                <span className="text-gray-600">Generated At:</span>
                <span className="font-mono text-xs">{new Date(data.metadata.generatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNoData = () => (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📊</div>
      <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
      <p className="text-gray-600 mb-6">Generate dummy data to explore the admin dashboard</p>
      <button
        onClick={handleGenerateData}
        disabled={isLoading}
        className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50"
      >
        {isLoading ? '⏳ Generating...' : '🚀 Generate 50 Users with Full Data'}
      </button>
    </div>
  );

  const renderUserModal = () => {
    if (!selectedUser || !showModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">👤 {selectedUser.name}</h2>
            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-700">📋 Basic Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">User ID:</span> <span className="font-mono">{selectedUser.userId}</span></div>
                <div><span className="text-gray-500">Phone:</span> {selectedUser.phoneNumber}</div>
                <div><span className="text-gray-500">Age:</span> {selectedUser.age}</div>
                <div><span className="text-gray-500">Gender:</span> {selectedUser.gender}</div>
                <div><span className="text-gray-500">Category:</span> {selectedUser.category}</div>
                <div><span className="text-gray-500">Education:</span> {selectedUser.educationLevel}</div>
                <div><span className="text-gray-500">Job Card:</span> <span className="font-mono text-xs">{selectedUser.jobCardNumber}</span></div>
                <div><span className="text-gray-500">Aadhaar:</span> {selectedUser.aadhaarNumber}</div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-700">📍 Location</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">State:</span> {selectedUser.location.state}</div>
                <div><span className="text-gray-500">District:</span> {selectedUser.location.district}</div>
                <div><span className="text-gray-500">Block:</span> {selectedUser.location.block}</div>
                <div><span className="text-gray-500">Village:</span> {selectedUser.location.village}</div>
                <div><span className="text-gray-500">GP:</span> {selectedUser.location.gramPanchayat}</div>
                <div><span className="text-gray-500">Pincode:</span> {selectedUser.location.pincode}</div>
              </div>
            </div>

            {/* MGNREGA */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-700">🏗️ MGNREGA Status</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Registered:</span> {selectedUser.mgnrega.isRegistered ? 'Yes' : 'No'}</div>
                <div><span className="text-gray-500">Status:</span> {selectedUser.mgnrega.jobCardStatus}</div>
                <div><span className="text-gray-500">Current Year Days:</span> <strong>{selectedUser.mgnrega.currentYearDaysWorked}/100</strong></div>
                <div><span className="text-gray-500">Remaining:</span> {selectedUser.mgnrega.currentYearDaysRemaining}</div>
                <div><span className="text-gray-500">Total Days:</span> {selectedUser.mgnrega.totalDaysWorked}</div>
                <div><span className="text-gray-500">Pending Wages:</span> ₹{selectedUser.mgnrega.pendingWages}</div>
                <div><span className="text-gray-500">Total Earned:</span> ₹{selectedUser.mgnrega.totalWagesEarned}</div>
                <div><span className="text-gray-500">Avg Wage/Day:</span> ₹{selectedUser.mgnrega.averageWagePerDay}</div>
              </div>
            </div>

            {/* ML Flags */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-700">🤖 ML Analysis</h3>
              <div className={`p-4 rounded-lg ${selectedUser.mlFlags?.isAnomaly ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Is Anomaly:</span> <strong className={selectedUser.mlFlags?.isAnomaly ? 'text-red-600' : 'text-green-600'}>{selectedUser.mlFlags?.isAnomaly ? 'YES' : 'No'}</strong></div>
                  <div><span className="text-gray-500">Risk Score:</span> <strong>{selectedUser.mlFlags?.riskScore}</strong></div>
                  <div><span className="text-gray-500">Fraud Probability:</span> {((selectedUser.mlFlags?.fraudProbability || 0) * 100).toFixed(1)}%</div>
                  <div><span className="text-gray-500">Last Scan:</span> {selectedUser.mlFlags?.lastMLScan ? new Date(selectedUser.mlFlags.lastMLScan).toLocaleDateString() : 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Schemes */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-700">📋 Registered Schemes</h3>
              <div className="flex flex-wrap gap-2">
                {selectedUser.registeredSchemes.map(scheme => (
                  <span key={scheme} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{scheme}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // LOGIN SCREEN
  // ============================================
  
  const renderLogin = () => (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md p-6 rounded-2xl bg-white shadow-xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🛡️</span>
          </div>
          <h2 className="text-2xl font-bold">Admin Login</h2>
          <p className="text-sm opacity-60">SAHAYOG Administration Panel</p>
        </div>

        {loginError && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {loginError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter password"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-all"
          >
            Login
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs font-bold text-blue-700 mb-2">Demo Credentials:</p>
          <div className="text-xs space-y-1 text-blue-600">
            <p><strong>Super Admin:</strong> admin / sahayog@2024</p>
            <p><strong>Block Admin:</strong> block_admin / block@123</p>
            <p><strong>District Admin:</strong> district_admin / district@123</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================
  // JOBS MANAGEMENT
  // ============================================
  
  const renderJobsManagement = () => (
    <div className="space-y-4">
      {message.text && (
        <div className={`p-3 rounded-lg text-center font-bold ${
          message.type === 'success' ? 'bg-green-100 text-green-700' :
          message.type === 'error' ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">MGNREGA Jobs ({jobs.length})</h2>
        <button
          onClick={() => setActiveTab('create-job')}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
        >
          ➕ Create Job
        </button>
      </div>

      <div className="space-y-4">
        {jobs.map(job => (
          <div key={job.id} className="bg-white p-4 rounded-xl shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold">{job.title}</h3>
                <p className="text-sm opacity-60">{job.titleHindi}</p>
                <p className="text-xs opacity-50">{job.location.village}, {job.location.block}, {job.location.district}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                job.status === 'published' ? 'bg-green-100 text-green-700' :
                job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                job.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {job.status}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center mb-3">
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-sm font-bold">₹{job.wagePerDay}</p>
                <p className="text-[10px] opacity-60">Per Day</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-sm font-bold">{job.totalSlots}</p>
                <p className="text-[10px] opacity-60">Total Slots</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-sm font-bold">{job.availableSlots}</p>
                <p className="text-[10px] opacity-60">Available</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-sm font-bold">{job.applicants?.length || 0}</p>
                <p className="text-[10px] opacity-60">Applicants</p>
              </div>
            </div>

            {job.applicants && job.applicants.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-sm font-bold mb-2">Applicants:</p>
                <div className="space-y-2">
                  {job.applicants.map(app => (
                    <div key={app.userId} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                      <div>
                        <p className="font-bold text-sm">{app.name}</p>
                        <p className="text-xs opacity-60">{app.phone} | {app.category}</p>
                      </div>
                      <div className="flex gap-2">
                        {app.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleApproveApplication(job.id, app.userId)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleRejectApplication(job.id, app.userId)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-bold hover:bg-red-200"
                            >
                              ✗ Reject
                            </button>
                          </>
                        ) : (
                          <span className={`px-3 py-1 rounded text-xs font-bold ${
                            app.status === 'approved' ? 'bg-green-100 text-green-700' :
                            app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {app.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {jobs.length === 0 && (
          <div className="text-center py-8 opacity-60">
            <p className="text-4xl mb-3">📋</p>
            <p>No jobs created yet</p>
            <button
              onClick={() => setActiveTab('create-job')}
              className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg font-bold"
            >
              Create First Job
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ============================================
  // CREATE JOB FORM
  // ============================================
  
  const renderCreateJobForm = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Create New MGNREGA Job</h2>

      {message.text && (
        <div className={`p-3 rounded-lg text-center font-bold ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">Title (English) *</label>
            <input
              type="text"
              value={jobForm.title}
              onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
              className="w-full p-2 border rounded-lg"
              placeholder="e.g., Pond Deepening Work"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Title (Hindi)</label>
            <input
              type="text"
              value={jobForm.titleHindi}
              onChange={(e) => setJobForm({...jobForm, titleHindi: e.target.value})}
              className="w-full p-2 border rounded-lg"
              placeholder="e.g., तालाब गहरीकरण कार्य"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Description</label>
          <textarea
            value={jobForm.description}
            onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
            className="w-full p-2 border rounded-lg"
            rows={2}
            placeholder="Describe the work..."
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Work Type *</label>
          <select
            value={jobForm.workType}
            onChange={(e) => setJobForm({...jobForm, workType: e.target.value as any})}
            className="w-full p-2 border rounded-lg"
          >
            <option value="earth_work">Earth Work / मिट्टी का काम</option>
            <option value="water_conservation">Water Conservation / जल संरक्षण</option>
            <option value="road_construction">Road Construction / सड़क निर्माण</option>
            <option value="plantation">Plantation / वृक्षारोपण</option>
            <option value="building_construction">Building Construction / भवन निर्माण</option>
            <option value="irrigation">Irrigation / सिंचाई</option>
            <option value="other">Other / अन्य</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">Village *</label>
            <input
              type="text"
              value={jobForm.village}
              onChange={(e) => setJobForm({...jobForm, village: e.target.value})}
              className="w-full p-2 border rounded-lg"
              placeholder="Village name"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Block *</label>
            <input
              type="text"
              value={jobForm.block}
              onChange={(e) => setJobForm({...jobForm, block: e.target.value})}
              className="w-full p-2 border rounded-lg"
              placeholder="Block name"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">District *</label>
            <input
              type="text"
              value={jobForm.district}
              onChange={(e) => setJobForm({...jobForm, district: e.target.value})}
              className="w-full p-2 border rounded-lg"
              placeholder="District name"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">State</label>
            <input
              type="text"
              value={jobForm.state}
              onChange={(e) => setJobForm({...jobForm, state: e.target.value})}
              className="w-full p-2 border rounded-lg"
              placeholder="State"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">Wage/Day (₹)</label>
            <input
              type="number"
              value={jobForm.wagePerDay}
              onChange={(e) => setJobForm({...jobForm, wagePerDay: parseInt(e.target.value)})}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Total Slots</label>
            <input
              type="number"
              value={jobForm.totalSlots}
              onChange={(e) => setJobForm({...jobForm, totalSlots: parseInt(e.target.value)})}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Start Date *</label>
            <input
              type="date"
              value={jobForm.startDate}
              onChange={(e) => setJobForm({...jobForm, startDate: e.target.value})}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">End Date</label>
            <input
              type="date"
              value={jobForm.endDate}
              onChange={(e) => setJobForm({...jobForm, endDate: e.target.value})}
              className="w-full p-2 border rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Priority Categories</label>
          <div className="flex flex-wrap gap-2">
            {['SC', 'ST', 'OBC', 'disabled', 'widow', 'elderly'].map(cat => (
              <label key={cat} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-lg cursor-pointer hover:bg-gray-200">
                <input
                  type="checkbox"
                  checked={jobForm.priorityCategories?.includes(cat as any)}
                  onChange={(e) => {
                    const cats = jobForm.priorityCategories || [];
                    if (e.target.checked) {
                      setJobForm({...jobForm, priorityCategories: [...cats, cat as any]});
                    } else {
                      setJobForm({...jobForm, priorityCategories: cats.filter(c => c !== cat)});
                    }
                  }}
                />
                <span className="text-sm">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={jobForm.materialProvided}
              onChange={(e) => setJobForm({...jobForm, materialProvided: e.target.checked})}
            />
            <span className="text-sm">Material Provided</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={jobForm.toolsProvided}
              onChange={(e) => setJobForm({...jobForm, toolsProvided: e.target.checked})}
            />
            <span className="text-sm">Tools Provided</span>
          </label>
        </div>

        <button
          onClick={handleCreateJob}
          className="w-full py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700"
        >
          ➕ Create & Publish Job
        </button>
      </div>
    </div>
  );

  // ============================================
  // LIVE GRIEVANCES (from conversational AI)
  // ============================================
  
  const renderLiveGrievances = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Live Grievances ({liveGrievances.length})</h2>
      <p className="text-sm opacity-60">Grievances filed via conversational AI are shown here</p>

      {message.text && (
        <div className={`p-3 rounded-lg text-center font-bold ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {liveGrievances.length === 0 ? (
          <div className="text-center py-8 opacity-60 bg-white rounded-lg">
            <p className="text-4xl mb-3">✅</p>
            <p>No live grievances at the moment</p>
          </div>
        ) : (
          liveGrievances.map(g => (
            <div key={g.id} className="bg-white p-4 rounded-xl shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold">{g.userName}</p>
                  <p className="text-xs opacity-60">{g.phone}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  g.status === 'resolved' ? 'bg-green-100 text-green-700' :
                  g.status === 'escalated' ? 'bg-red-100 text-red-700' :
                  g.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {g.status}
                </span>
              </div>
              <p className="text-sm bg-gray-50 p-2 rounded mb-2">{g.description}</p>
              <div className="flex justify-between items-center text-xs">
                <span className="opacity-60">
                  {g.location?.village}, {g.location?.block} | {new Date(g.createdAt).toLocaleDateString()}
                </span>
                {g.status !== 'resolved' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateGrievanceStatus(g.id, 'in_progress')}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-bold hover:bg-blue-200"
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => handleUpdateGrievanceStatus(g.id, 'resolved')}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded font-bold hover:bg-green-200"
                    >
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // ============================================
  // MAIN RENDER
  // ============================================

  // Show login if not authenticated
  if (!isLoggedIn) {
    return renderLogin();
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🛡️ Admin Dashboard</h1>
            <p className="text-orange-100 text-sm">Welcome, {adminSession?.name || 'Admin'}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm opacity-80">Data Status</div>
              <div className="font-medium">{data ? `${data.users.length} Users` : 'No Data'}</div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-white/20 rounded-lg font-bold hover:bg-white/30"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-7xl mx-auto">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'jobs' && renderJobsManagement()}
        {activeTab === 'create-job' && renderCreateJobForm()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'work' && renderWorkRecords()}
        {activeTab === 'payments' && renderPayments()}
        {activeTab === 'grievances' && (
          <div className="space-y-6">
            {renderLiveGrievances()}
            <hr />
            <h3 className="text-lg font-bold">Historical Grievances (from dataset)</h3>
            {renderGrievances()}
          </div>
        )}
        {activeTab === 'schemes' && renderSchemes()}
        {activeTab === 'ml' && renderMLFeatures()}
        {activeTab === 'settings' && renderSettings()}
      </div>

      {/* User Detail Modal */}
      {renderUserModal()}
    </div>
  );
};

// Scheme names constant
const SCHEME_NAMES = [
  'MGNREGA', 'PM-KISAN', 'PMFBY', 'PM Awas Yojana', 'Widow Pension',
  'Old Age Pension', 'Disability Pension', 'Ladli Laxmi', 'PM-SYM', 'PM Jan Dhan Yojana'
];

export default AdminModule;
