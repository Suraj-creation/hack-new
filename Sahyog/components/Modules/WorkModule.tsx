
import React, { useState, useEffect } from 'react';
import { UIMode, JobOpportunity, UserProfile } from '../../types';
import { fairnessEngine } from '../../services/fairnessService';
import { geoService } from '../../services/geoService';
import { schemeService, MGNREGAJobPosting, ALL_SCHEMES, MGNREGA_INFO } from '../../services/schemeService';
import { userDataService } from '../../services/userDataService';

interface Props {
  uiMode: UIMode;
  user?: UserProfile;
}

// Work Module with Fairness Engine from unified.md Module 7
const WorkModule: React.FC<Props> = ({ uiMode, user }) => {
  const [selectedJob, setSelectedJob] = useState<MGNREGAJobPosting | null>(null);
  const [showFairnessReport, setShowFairnessReport] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [jobs, setJobs] = useState<MGNREGAJobPosting[]>([]);
  const [applicationStatus, setApplicationStatus] = useState<string>('');
  const [showMGNREGAInfo, setShowMGNREGAInfo] = useState(false);

  const isHighContrast = uiMode === UIMode.HIGH_CONTRAST;
  const isPictureMode = uiMode === UIMode.PICTURE;

  // Load jobs on mount
  useEffect(() => {
    const loadJobs = () => {
      const publishedJobs = schemeService.getPublishedJobs();
      setJobs(publishedJobs);
      
      // Get user's applications
      const currentUser = userDataService.getCurrentUserData();
      if (currentUser) {
        const userApps = schemeService.getMyApplications(currentUser.id);
        setAppliedJobs(userApps.map(app => app.jobId));
      }
    };
    loadJobs();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  // Get current user from userDataService or props
  const userData = userDataService.getCurrentUserData();
  const currentUser: UserProfile = userData ? userDataService.getUserProfile() : (user || {
    id: 'USR-0001',
    name: 'Ramesh Singh',
    village: 'Rampur',
    block: 'Ashta',
    district: 'Sehore',
    state: 'Madhya Pradesh',
    preferredLanguage: 'hi-IN',
    uiMode: UIMode.STANDARD,
    daysWorked: 45,
    aadhaarLinked: true,
    phoneNumber: '+91 9876543210',
    category: 'OBC',
    gender: 'male',
    age: 39,
    isLiterate: true,
    bankAccountLinked: true,
    familyMembers: 5,
    landOwned: 0.5,
    onboardingLevel: 2,
    registeredSchemes: ['MGNREGA'],
    pendingPayments: 2880,
    lastActiveDate: new Date().toISOString()
  });

  const fairnessReport = fairnessEngine.generateFairnessReport(currentUser, { 
    averageWorkDays: 52, 
    totalJobs: jobs.length || 4
  });

  // Real application handler
  const handleApply = async (job: MGNREGAJobPosting) => {
    try {
      setApplicationStatus('Submitting...');
      
      const application = await schemeService.applyForJob({
        jobId: job.id,
        userId: currentUser.id,
        userName: currentUser.name,
        phone: currentUser.phoneNumber || '',
        aadhaar: userData?.aadhaar || '',
        jobCardNumber: userData?.jobCardNumber || '',
        category: currentUser.category || 'General',
        preferredStartDate: job.startDate
      });
      
      if (application) {
        setAppliedJobs([...appliedJobs, job.id]);
        setApplicationStatus('✅ Application submitted successfully!');
        
        // Update user data
        userDataService.updateField('lastApplicationDate', new Date().toISOString());
        
        setTimeout(() => setApplicationStatus(''), 3000);
      }
    } catch (error) {
      setApplicationStatus('❌ Failed to apply. Please try again.');
      setTimeout(() => setApplicationStatus(''), 3000);
    }
  };

  // Fairness Report View
  if (showFairnessReport) {
    return (
      <div className="space-y-4 md:space-y-6">
        <button 
          onClick={() => setShowFairnessReport(false)}
          className="flex items-center gap-2 text-orange-600 font-bold touch-manipulation"
        >
          <i className="fa-solid fa-arrow-left"></i> Back
        </button>

        <div className="flex items-center gap-2">
          <i className="fa-solid fa-scale-balanced text-xl md:text-2xl text-orange-600"></i>
          <h2 className="text-xl md:text-2xl font-bold">Fairness Report / न्याय रिपोर्ट</h2>
        </div>

        <p className="opacity-70 text-xs md:text-sm">
          "क्यों मिला, क्यों नहीं मिला - सब पता चलेगा"
        </p>

        {/* Priority Score */}
        <div className={`p-4 md:p-6 rounded-2xl md:rounded-3xl text-center ${isHighContrast ? 'border-2 border-yellow-400' : 'bg-gradient-to-br from-orange-500 to-red-600 text-white'}`}>
          <p className="text-xs md:text-sm opacity-80">Your Priority Score</p>
          <div className="text-5xl md:text-6xl font-black my-3 md:my-4">{fairnessReport.priorityScore}</div>
          <p className="text-xs md:text-sm opacity-80">out of 100</p>
          <div className="mt-3 md:mt-4 text-xs md:text-sm">
            {fairnessReport.priorityScore > 60 
              ? '🎯 High Priority - You will get work soon!'
              : fairnessReport.priorityScore > 40 
                ? '📊 Medium Priority - Keep checking'
                : '📋 In Queue - Your turn will come'
            }
          </div>
        </div>

        {/* Factor Breakdown */}
        <div className="space-y-3 md:space-y-4">
          <h3 className="font-bold text-sm md:text-base">How is this calculated? / यह कैसे गिना जाता है?</h3>
          {fairnessReport.priorityFactors.map((factor, idx) => (
            <div key={idx} className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${isHighContrast ? 'border border-yellow-400' : 'bg-white shadow-sm'}`}>
              <div className="flex justify-between items-center mb-1.5 md:mb-2">
                <span className="font-bold text-sm md:text-base">{factor.factorHindi}</span>
                <span className="text-xs md:text-sm font-bold text-orange-600">{factor.score}/{factor.maxScore}</span>
              </div>
              <div className="h-1.5 md:h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5 md:mb-2">
                <div 
                  className="h-full bg-orange-500" 
                  style={{ width: `${(factor.score / factor.maxScore) * 100}%` }}
                />
              </div>
              <p className="text-[10px] md:text-xs opacity-60">{factor.explanationHindi}</p>
            </div>
          ))}
        </div>

        {/* Village Comparison */}
        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${isHighContrast ? 'border border-yellow-400' : 'bg-green-50'}`}>
          <h3 className="font-bold mb-3 md:mb-4 text-sm md:text-base">Village Comparison / गाँव से तुलना</h3>
          <div className="grid grid-cols-2 gap-3 md:gap-4 text-center">
            <div>
              <div className="text-xl md:text-2xl font-bold text-orange-600">{fairnessReport.comparisonWithVillage.userDaysWorked}</div>
              <div className="text-[10px] md:text-xs opacity-60">Your Days Worked</div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-bold">{fairnessReport.comparisonWithVillage.averageDaysWorked}</div>
              <div className="text-[10px] md:text-xs opacity-60">Village Average</div>
            </div>
          </div>
          <div className="mt-3 md:mt-4 text-center text-xs md:text-sm">
            You are in the <span className="font-bold text-green-600">{fairnessReport.comparisonWithVillage.percentile}th percentile</span>
          </div>
        </div>

        {/* Transparency Details */}
        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${isHighContrast ? 'border border-yellow-400' : 'bg-slate-50'}`}>
          <h3 className="font-bold mb-2 text-sm md:text-base"><i className="fa-solid fa-shield-check mr-2 text-green-500"></i>Transparency / पारदर्शिता</h3>
          <ul className="space-y-1.5 md:space-y-2">
            {fairnessReport.transparencyDetails.map((detail, idx) => (
              <li key={idx} className="text-xs md:text-sm flex items-start gap-2">
                <i className="fa-solid fa-check text-green-500 mt-0.5"></i>
                {detail}
              </li>
            ))}
          </ul>
        </div>

        {/* Ask SATHI */}
        <div className="text-center">
          <button className={`px-4 py-2 md:px-6 md:py-3 rounded-full font-bold text-sm md:text-base touch-manipulation ${isHighContrast ? 'border-2 border-yellow-400' : 'bg-orange-600 text-white'}`}>
            <i className="fa-solid fa-microphone mr-2"></i>
            Ask SATHI about this
          </button>
        </div>
      </div>
    );
  }

  // Job Detail View
  if (selectedJob) {
    const workTypeIcon = {
      'earth_work': 'fa-mountain',
      'water_conservation': 'fa-droplet',
      'road_construction': 'fa-road',
      'plantation': 'fa-tree',
      'building_construction': 'fa-house',
      'irrigation': 'fa-water',
      'other': 'fa-briefcase'
    };
    
    return (
      <div className="space-y-4 md:space-y-6">
        <button 
          onClick={() => setSelectedJob(null)}
          className="flex items-center gap-2 text-orange-600 font-bold touch-manipulation"
        >
          <i className="fa-solid fa-arrow-left"></i> Back
        </button>

        {/* Job Image */}
        <div className="aspect-video rounded-2xl md:rounded-3xl overflow-hidden relative bg-gradient-to-br from-orange-400 to-orange-600">
          <div className="absolute inset-0 flex items-center justify-center">
            <i className={`fa-solid ${workTypeIcon[selectedJob.workType] || 'fa-briefcase'} text-white/30 text-8xl`}></i>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black/80 to-transparent">
            <h2 className="text-xl md:text-2xl font-bold text-white">{selectedJob.titleHindi}</h2>
            <p className="text-white/80 text-sm md:text-base">{selectedJob.title}</p>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
          <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${isHighContrast ? 'border border-yellow-400' : 'bg-green-50'}`}>
            <div className="text-lg md:text-xl font-bold text-green-600">₹{selectedJob.wagePerDay}</div>
            <div className="text-[10px] md:text-xs opacity-60">Per Day</div>
          </div>
          <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${isHighContrast ? 'border border-yellow-400' : 'bg-blue-50'}`}>
            <div className="text-lg md:text-xl font-bold text-blue-600">{selectedJob.location.village}</div>
            <div className="text-[10px] md:text-xs opacity-60">Location</div>
          </div>
          <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${isHighContrast ? 'border border-yellow-400' : 'bg-purple-50'}`}>
            <div className="text-lg md:text-xl font-bold text-purple-600">{selectedJob.workDays}</div>
            <div className="text-[10px] md:text-xs opacity-60">Days</div>
          </div>
        </div>

        {/* Details */}
        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl space-y-2 md:space-y-3 ${isHighContrast ? 'border border-yellow-400' : 'bg-white shadow-sm'}`}>
          <p className="font-medium text-sm md:text-base">{selectedJob.descriptionHindi}</p>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            <span className="bg-slate-100 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold">
              <i className="fa-solid fa-calendar mr-1"></i>
              Starts: {new Date(selectedJob.startDate).toLocaleDateString('hi-IN')}
            </span>
            <span className="bg-slate-100 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold">
              <i className="fa-solid fa-users mr-1"></i>
              {selectedJob.availableSlots} slots available
            </span>
            <span className="bg-slate-100 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold">
              <i className="fa-solid fa-person mr-1"></i>
              {selectedJob.applicants?.length || 0} applied
            </span>
          </div>
          
          {/* Required Skills */}
          {selectedJob.requiredSkills.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-bold mb-1">Required Skills / आवश्यक कौशल:</p>
              <div className="flex flex-wrap gap-1">
                {selectedJob.requiredSkills.map((skill, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Tools/Material Info */}
          <div className="flex gap-3 mt-2">
            {selectedJob.toolsProvided && (
              <span className="text-green-600 text-xs"><i className="fa-solid fa-check mr-1"></i>Tools Provided</span>
            )}
            {selectedJob.materialProvided && (
              <span className="text-green-600 text-xs"><i className="fa-solid fa-check mr-1"></i>Material Provided</span>
            )}
          </div>
        </div>

        {/* Priority Categories */}
        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${isHighContrast ? 'border border-yellow-400' : 'bg-orange-50'}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] md:text-xs font-bold opacity-60">PRIORITY FOR</p>
              <p className="font-bold text-sm md:text-base truncate">Fair Allocation Categories</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedJob.priorityCategories.map((cat, idx) => (
              <span key={idx} className="bg-orange-200 text-orange-800 px-2 py-0.5 rounded text-xs font-bold">
                {cat}
              </span>
            ))}
          </div>
          {selectedJob.supervisorName && (
            <p className="text-xs mt-2 opacity-70">
              <i className="fa-solid fa-user mr-1"></i>
              Supervisor: {selectedJob.supervisorName} ({selectedJob.supervisorPhone})
            </p>
          )}
        </div>

        {/* Application Status */}
        {applicationStatus && (
          <div className={`p-3 rounded-xl text-center font-bold ${
            applicationStatus.includes('✅') ? 'bg-green-100 text-green-700' : 
            applicationStatus.includes('❌') ? 'bg-red-100 text-red-700' : 
            'bg-blue-100 text-blue-700'
          }`}>
            {applicationStatus}
          </div>
        )}

        {/* Apply Button */}
        <button 
          onClick={() => handleApply(selectedJob)}
          disabled={appliedJobs.includes(selectedJob.id) || selectedJob.availableSlots === 0}
          className={`w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-base md:text-lg transition-all touch-manipulation ${
            appliedJobs.includes(selectedJob.id)
              ? 'bg-green-100 text-green-700'
              : selectedJob.availableSlots === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : isHighContrast 
                  ? 'bg-yellow-400 text-black' 
                  : 'bg-orange-600 text-white shadow-xl shadow-orange-200 active:scale-[0.98]'
          }`}
        >
          {appliedJobs.includes(selectedJob.id) ? (
            <><i className="fa-solid fa-check mr-2"></i>Applied / आवेदन किया</>
          ) : selectedJob.availableSlots === 0 ? (
            <><i className="fa-solid fa-ban mr-2"></i>No Slots Available / कोई स्लॉट नहीं</>
          ) : (
            <><i className="fa-solid fa-plus mr-2"></i>Apply Now / अभी आवेदन करें</>
          )}
        </button>
      </div>
    );
  }

  // Main Job List View
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h2 className="text-xl md:text-2xl font-bold">Work Nearby / पास में काम</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowMGNREGAInfo(true)}
            className="text-blue-600 text-xs md:text-sm font-bold flex items-center gap-1 touch-manipulation"
          >
            <i className="fa-solid fa-info-circle"></i> MGNREGA Info
          </button>
          <button 
            onClick={() => setShowFairnessReport(true)}
            className="text-orange-600 text-xs md:text-sm font-bold flex items-center gap-1 touch-manipulation"
          >
            <i className="fa-solid fa-scale-balanced"></i> Fairness
          </button>
        </div>
      </div>

      {/* MGNREGA Info Modal */}
      {showMGNREGAInfo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-orange-600">MGNREGA Information</h3>
              <button onClick={() => setShowMGNREGAInfo(false)} className="text-gray-500 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-xl">
                <p className="font-bold">Full Name:</p>
                <p className="text-sm">{MGNREGA_INFO.fullName}</p>
                <p className="text-sm text-gray-600">{MGNREGA_INFO.fullNameHindi}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs opacity-60">Daily Wage (Unskilled)</p>
                  <p className="font-bold text-green-700">₹{MGNREGA_INFO.wageRates.unskilled}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs opacity-60">Daily Wage (Semi-skilled)</p>
                  <p className="font-bold text-green-700">₹{MGNREGA_INFO.wageRates.semiSkilled}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs opacity-60">Guaranteed Days</p>
                  <p className="font-bold text-blue-700">{MGNREGA_INFO.guaranteedDays} days/year</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs opacity-60">Payment Within</p>
                  <p className="font-bold text-blue-700">{MGNREGA_INFO.paymentWithinDays} days</p>
                </div>
              </div>
              <div>
                <p className="font-bold mb-2">Required Documents:</p>
                <ul className="text-sm space-y-1">
                  {MGNREGA_INFO.requiredDocuments.map((doc, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <i className="fa-solid fa-check text-green-500"></i>{doc}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-bold mb-2">Benefits:</p>
                <ul className="text-sm space-y-1">
                  {MGNREGA_INFO.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <i className="fa-solid fa-star text-orange-500"></i>{benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Info */}
      <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl flex flex-wrap items-center gap-2 md:gap-3 ${isHighContrast ? 'border border-yellow-400' : 'bg-orange-50'}`}>
        <i className="fa-solid fa-location-dot text-orange-600 text-lg md:text-xl"></i>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm md:text-base truncate">📍 {currentUser.village} ({currentUser.village})</p>
          <p className="text-[10px] md:text-xs opacity-60">Block: {currentUser.block}, District: {currentUser.district}</p>
        </div>
        <span className="bg-orange-600 text-white px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold whitespace-nowrap">
          {jobs.length} jobs available
        </span>
      </div>

      {/* MGNREGA Status for User */}
      {userData && (
        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${isHighContrast ? 'border border-yellow-400' : 'bg-blue-50'}`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-sm">Your MGNREGA Status</p>
              <p className="text-xs opacity-70">Job Card: {userData.jobCardNumber || 'Not linked'}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-700">{userData.mgnregaDaysWorkedThisYear || 0}/100</p>
              <p className="text-xs opacity-60">Days Worked</p>
            </div>
          </div>
          {(userData.mgnregaPendingWages || 0) > 0 && (
            <div className="mt-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-xs font-bold">
              ⚠️ Pending Wages: ₹{userData.mgnregaPendingWages}
            </div>
          )}
        </div>
      )}

      {/* Priority Status */}
      <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center gap-3 md:gap-4 ${isHighContrast ? 'border border-yellow-400' : 'bg-green-50'}`}>
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-green-100 flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-lg md:text-xl font-black text-green-700">{fairnessReport.priorityScore}</span>
          <span className="text-[7px] md:text-[8px] font-bold text-green-600">SCORE</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm md:text-base">Your Priority Status</p>
          <p className="text-xs md:text-sm opacity-70">Queue Position: #{fairnessReport.waitingPosition}</p>
          <button 
            onClick={() => setShowFairnessReport(true)}
            className="text-[10px] md:text-xs text-orange-600 font-bold mt-0.5 md:mt-1 touch-manipulation"
          >
            See why →
          </button>
        </div>
      </div>

      {/* Job List */}
      <div className="space-y-3 md:space-y-4">
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <i className="fa-solid fa-briefcase text-4xl mb-3 opacity-30"></i>
            <p>No jobs available at the moment</p>
            <p className="text-sm">Check back soon or ask SATHI for help</p>
          </div>
        ) : (
          jobs.map((job) => {
            const workTypeIcon: Record<string, string> = {
              'earth_work': 'fa-mountain',
              'water_conservation': 'fa-droplet',
              'road_construction': 'fa-road',
              'plantation': 'fa-tree',
              'building_construction': 'fa-house',
              'irrigation': 'fa-water',
              'other': 'fa-briefcase'
            };
            
            return (
              <div 
                key={job.id} 
                onClick={() => setSelectedJob(job)}
                className={`p-3 md:p-5 rounded-xl md:rounded-2xl flex items-center gap-3 md:gap-4 cursor-pointer transition-all active:scale-[0.98] touch-manipulation ${isHighContrast ? 'border-2 border-yellow-400' : 'bg-white shadow-sm hover:shadow-md'}`}
              >
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex-shrink-0 flex items-center justify-center text-xl md:text-2xl ${isHighContrast ? 'bg-slate-900 border' : 'bg-orange-50 text-orange-600'}`}>
                  <i className={`fa-solid ${workTypeIcon[job.workType] || 'fa-briefcase'}`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm md:text-lg truncate">{isPictureMode ? '' : job.titleHindi}</h3>
                  <div className="flex gap-2 md:gap-3 text-xs md:text-sm opacity-70 truncate">
                    <span><i className="fa-solid fa-map-pin mr-1"></i> {job.location.village}</span>
                  </div>
                  <div className="mt-1.5 md:mt-2 flex items-center gap-1.5 md:gap-2 flex-wrap">
                    <span className="bg-green-100 text-green-700 px-2 md:px-3 py-0.5 rounded-full text-[10px] md:text-xs font-bold">
                      ₹{job.wagePerDay}/day
                    </span>
                    <span className="bg-slate-100 text-slate-600 px-2 md:px-3 py-0.5 rounded-full text-[10px] md:text-xs font-bold">
                      {job.availableSlots} slots
                    </span>
                    <span className="bg-purple-100 text-purple-600 px-1.5 md:px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-bold hidden sm:inline">
                      {job.workDays} days
                    </span>
                  </div>
                </div>
                {appliedJobs.includes(job.id) ? (
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-check"></i>
                  </div>
                ) : (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleApply(job); }}
                    disabled={job.availableSlots === 0}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 flex-shrink-0 touch-manipulation ${
                      job.availableSlots === 0 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : isHighContrast ? 'bg-yellow-400 text-black' : 'bg-orange-600 text-white'
                    }`}
                  >
                    <i className={`fa-solid ${job.availableSlots === 0 ? 'fa-ban' : 'fa-plus'}`}></i>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* More Work */}
      <div className={`p-4 md:p-6 rounded-2xl md:rounded-3xl text-center space-y-2 md:space-y-3 ${isHighContrast ? 'border-2 border-dashed border-yellow-400' : 'bg-slate-100 border-2 border-dashed border-slate-300'}`}>
        <div className="text-2xl md:text-3xl opacity-40"><i className="fa-solid fa-magnifying-glass"></i></div>
        <p className="font-medium opacity-70 text-sm md:text-base">SATHI can find more work in other villages. Just ask!</p>
        <p className="text-[10px] md:text-xs opacity-50">"साथी, और काम दिखाओ"</p>
        <button className="text-orange-600 font-bold uppercase text-xs md:text-sm touch-manipulation">See Other Districts</button>
      </div>
    </div>
  );
};

export default WorkModule;
