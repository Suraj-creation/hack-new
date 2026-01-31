
import React, { useState, useEffect } from 'react';
import { UIMode, Scheme } from '../../types';
import { schemeService, ALL_SCHEMES, SchemeInfo } from '../../services/schemeService';
import { userDataService } from '../../services/userDataService';

interface Props {
  uiMode: UIMode;
}

// Enhanced Schemes Module with eligibility matching from unified.md
const SchemesModule: React.FC<Props> = ({ uiMode }) => {
  const [selectedScheme, setSelectedScheme] = useState<SchemeInfo | null>(null);
  const [filter, setFilter] = useState<'all' | 'housing' | 'insurance' | 'employment' | 'financial' | 'skills'>('all');
  const [enrolledSchemes, setEnrolledSchemes] = useState<string[]>([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState<string>('');
  const [showEnrollForm, setShowEnrollForm] = useState(false);

  const isHighContrast = uiMode === UIMode.HIGH_CONTRAST;
  const isPictureMode = uiMode === UIMode.PICTURE;

  // Load user's enrolled schemes
  useEffect(() => {
    const userData = userDataService.getCurrentUserData();
    if (userData?.enrolledSchemes) {
      setEnrolledSchemes(userData.enrolledSchemes.map((s: any) => s.schemeId));
    }
  }, []);

  const filteredSchemes = filter === 'all' 
    ? ALL_SCHEMES 
    : ALL_SCHEMES.filter(s => s.category === filter);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'housing': return 'fa-house';
      case 'insurance': return 'fa-shield-heart';
      case 'employment': return 'fa-briefcase';
      case 'financial': return 'fa-coins';
      case 'skills': return 'fa-graduation-cap';
      case 'agriculture': return 'fa-tractor';
      default: return 'fa-scroll';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'housing': return 'bg-orange-100 text-orange-600';
      case 'insurance': return 'bg-blue-100 text-blue-600';
      case 'employment': return 'bg-green-100 text-green-600';
      case 'financial': return 'bg-purple-100 text-purple-600';
      case 'skills': return 'bg-yellow-100 text-yellow-600';
      case 'agriculture': return 'bg-lime-100 text-lime-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  // Handle enrollment
  const handleEnroll = async (scheme: SchemeInfo) => {
    try {
      setEnrollmentStatus('Processing...');
      const userData = userDataService.getCurrentUserData();
      
      if (!userData) {
        setEnrollmentStatus('Please login first');
        return;
      }

      await schemeService.enrollInScheme({
        userId: userData.id,
        userName: userData.name,
        schemeId: scheme.id,
        phone: userData.phone || '',
        aadhaar: userData.aadhaar || '',
        documents: []
      });

      userDataService.addEnrolledScheme({
        schemeId: scheme.id,
        enrolledAt: new Date().toISOString(),
        status: 'pending'
      });

      setEnrolledSchemes([...enrolledSchemes, scheme.id]);
      setEnrollmentStatus('✅ Enrollment request submitted!');
      setShowEnrollForm(false);
      
      setTimeout(() => setEnrollmentStatus(''), 3000);
    } catch (error) {
      setEnrollmentStatus('❌ Enrollment failed. Please try again.');
      setTimeout(() => setEnrollmentStatus(''), 3000);
    }
  };

  // Scheme Detail View
  if (selectedScheme) {
    const isEnrolled = enrolledSchemes.includes(selectedScheme.id);
    
    return (
      <div className="p-6 space-y-6">
        <button 
          onClick={() => setSelectedScheme(null)}
          className="flex items-center gap-2 text-blue-600 font-bold"
        >
          <i className="fa-solid fa-arrow-left"></i> Back / वापस
        </button>

        {enrollmentStatus && (
          <div className={`p-3 rounded-lg text-center font-bold ${
            enrollmentStatus.includes('✅') ? 'bg-green-100 text-green-700' :
            enrollmentStatus.includes('❌') ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {enrollmentStatus}
          </div>
        )}

        <div className={`p-6 rounded-3xl ${isHighContrast ? 'border-2 border-yellow-400' : 'bg-white shadow-lg'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${getCategoryColor(selectedScheme.category || '')}`}>
              <i className={`fa-solid ${selectedScheme.icon || getCategoryIcon(selectedScheme.category || '')}`}></i>
            </div>
            {isEnrolled && (
              <span className="px-4 py-2 rounded-full text-sm font-bold bg-green-500 text-white">
                ✓ Enrolled
              </span>
            )}
          </div>
          
          <h2 className="text-2xl font-bold mb-2">{selectedScheme.name}</h2>
          <p className="text-sm font-bold text-blue-600 mb-4">{selectedScheme.nameHindi}</p>
          <p className="opacity-70 mb-6">{selectedScheme.description}</p>

          {/* Benefits */}
          <div className={`p-4 rounded-2xl mb-4 ${isHighContrast ? 'border border-yellow-400' : 'bg-green-50'}`}>
            <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-gift"></i> Benefits / लाभ
            </h3>
            <ul className="space-y-2">
              {selectedScheme.benefits?.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <i className="fa-solid fa-check-circle text-green-500 mt-0.5"></i>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Eligibility */}
          <div className={`p-4 rounded-2xl mb-4 ${isHighContrast ? 'border border-yellow-400' : 'bg-blue-50'}`}>
            <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-clipboard-check"></i> Eligibility / पात्रता
            </h3>
            <ul className="space-y-2">
              {selectedScheme.eligibility?.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <i className="fa-solid fa-circle text-blue-500 text-[6px] mt-2"></i>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Required Documents */}
          <div className={`p-4 rounded-2xl mb-6 ${isHighContrast ? 'border border-yellow-400' : 'bg-slate-50'}`}>
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <i className="fa-solid fa-file-lines"></i> Documents / दस्तावेज़
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedScheme.documents?.map((doc, idx) => (
                <span key={idx} className="text-xs bg-white px-3 py-1 rounded-full border">
                  {doc}
                </span>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          {isEnrolled ? (
            <div className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 bg-green-100 text-green-700">
              <i className="fa-solid fa-check"></i>
              Already Enrolled / पहले से नामांकित
            </div>
          ) : (
            <button 
              onClick={() => handleEnroll(selectedScheme)}
              className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 ${
                isHighContrast ? 'bg-yellow-400 text-black' : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <i className="fa-solid fa-paper-plane"></i>
              Enroll Now / अभी नामांकन करें
            </button>
          )}

          {/* Voice Help */}
          <button className="w-full mt-3 py-3 rounded-xl text-sm text-purple-600 font-bold flex items-center justify-center gap-2">
            <i className="fa-solid fa-microphone"></i>
            Ask SATHI for help / साथी से मदद लें
          </button>
        </div>

        {/* Community */}
        <div className={`p-4 rounded-2xl ${isHighContrast ? 'border border-yellow-400' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1,2,3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                  <img src={`https://picsum.photos/seed/user-${i + 10}/100`} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-green-100 flex items-center justify-center text-[10px] font-bold text-green-700">+24</div>
            </div>
            <span className="text-xs opacity-70">24 people from your area applied this month</span>
          </div>
        </div>
      </div>
    );
  }

  // Scheme List View
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Available Schemes / उपलब्ध योजनाएं</h2>
      <p className="text-sm opacity-60">Total {ALL_SCHEMES.length} government schemes you can enroll in</p>
      
      {enrollmentStatus && (
        <div className={`p-3 rounded-lg text-center font-bold ${
          enrollmentStatus.includes('✅') ? 'bg-green-100 text-green-700' :
          enrollmentStatus.includes('❌') ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {enrollmentStatus}
        </div>
      )}
      
      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar">
        {[
          { key: 'all', label: 'All', labelHindi: 'सभी', icon: 'fa-layer-group' },
          { key: 'employment', label: 'Employment', labelHindi: 'रोज़गार', icon: 'fa-briefcase' },
          { key: 'housing', label: 'Housing', labelHindi: 'आवास', icon: 'fa-house' },
          { key: 'skills', label: 'Skills', labelHindi: 'कौशल', icon: 'fa-graduation-cap' },
          { key: 'financial', label: 'Financial', labelHindi: 'वित्तीय', icon: 'fa-coins' },
          { key: 'insurance', label: 'Insurance', labelHindi: 'बीमा', icon: 'fa-shield-heart' },
          { key: 'pension', label: 'Pension', labelHindi: 'पेंशन', icon: 'fa-hand-holding-dollar' }
        ].map(cat => (
          <button 
            key={cat.key}
            onClick={() => setFilter(cat.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              filter === cat.key 
                ? isHighContrast ? 'bg-yellow-400 text-black' : 'bg-blue-600 text-white'
                : isHighContrast ? 'border border-yellow-400' : 'bg-white border hover:bg-gray-50'
            }`}
          >
            <i className={`fa-solid ${cat.icon}`}></i>
            {!isPictureMode && <span>{cat.labelHindi}</span>}
          </button>
        ))}
      </div>

      {/* Scheme Cards */}
      <div className="grid gap-4">
        {filteredSchemes.map(scheme => {
          const isEnrolled = enrolledSchemes.includes(scheme.id);
          
          return (
            <div 
              key={scheme.id} 
              onClick={() => setSelectedScheme(scheme)}
              className={`p-5 rounded-2xl relative overflow-hidden cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                isHighContrast ? 'border-2 border-yellow-400' : 'bg-white shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex gap-4">
                <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl ${getCategoryColor(scheme.category || '')}`}>
                  <i className={`fa-solid ${scheme.icon || getCategoryIcon(scheme.category || '')}`}></i>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg">{scheme.name}</h3>
                    {isEnrolled && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                        ✓ Enrolled
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-blue-600 font-bold mb-2">{scheme.nameHindi}</p>
                  <p className="text-xs opacity-60 line-clamp-2">{scheme.description}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-dashed">
                <div className="flex flex-wrap gap-1">
                  {scheme.eligibility?.slice(0, 2).map((e, idx) => (
                    <span key={idx} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded">{e}</span>
                  ))}
                </div>
                <i className="fa-solid fa-chevron-right text-slate-400"></i>
              </div>
            </div>
          );
        })}
      </div>

      {/* Voice Shortcut */}
      <div className={`p-4 rounded-2xl text-center ${isHighContrast ? 'border-2 border-yellow-400' : 'bg-purple-50'}`}>
        <p className="text-sm text-purple-900">
          <i className="fa-solid fa-microphone mr-2"></i>
          Say: "कौन सी योजना मेरे लिए है?" to find schemes
        </p>
      </div>
    </div>
  );
};

export default SchemesModule;
