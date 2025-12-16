import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { annualPlanAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { ArrowLeft, Save, Target, Calendar, FileText } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ETHIOPIAN_MONTHS } from '../utils/ethiopianCalendar';

function SubmitAmharicReport({ user, onLogout }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { planId } = useParams();
  const [plan, setPlan] = useState(null);
  const [activities, setActivities] = useState([]);
  const [reports, setReports] = useState({});
  const [existingReports, setExistingReports] = useState([]);
  const [hasSubmittedReports, setHasSubmittedReports] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlanAndActivities();
  }, [planId]);

  const fetchPlanAndActivities = async () => {
    try {
      // Fetch plan details
      const planResponse = await annualPlanAPI.getById(planId);
      setPlan(planResponse.data.plan);

      // Fetch plan activities
      const activitiesResponse = await annualPlanAPI.getPlanActivities(planId);
      const activitiesData = activitiesResponse.data || [];
      setActivities(activitiesData);

      // Check for existing reports
      try {
        const existingReportsResponse = await annualPlanAPI.getAmharicActivityReports(planId);
        const existingData = existingReportsResponse.data || [];
        setExistingReports(existingData);
        
        // Check if any reports have been submitted
        const hasSubmitted = existingData.some(report => report.status === 'submitted');
        setHasSubmittedReports(hasSubmitted);
      } catch (reportErr) {
        console.log('No existing reports found or error fetching reports:', reportErr);
        setExistingReports([]);
        setHasSubmittedReports(false);
      }

      // Initialize reports state
      const initialReports = {};
      activitiesData.forEach(activity => {
        // Check if there's an existing report for this activity
        const existingReport = existingReports.find(r => r.plan_activity_id === activity.id);
        initialReports[activity.id] = {
          achieved_number: existingReport?.achieved_number || 0,
          notes_amharic: existingReport?.notes_amharic || ''
        };
      });
      setReports(initialReports);
    } catch (err) {
      setError('Failed to fetch plan data');
      console.error('Error fetching plan:', err);
      // Set empty states to prevent undefined errors
      setActivities([]);
      setReports({});
    } finally {
      setLoading(false);
    }
  };

  const updateReport = (activityId, field, value) => {
    setReports(prev => ({
      ...prev,
      [activityId]: {
        ...prev[activityId],
        [field]: value
      }
    }));
  };

  const calculatePercentage = (achieved, target) => {
    if (target === 0) return 0;
    return Math.min(Math.round((achieved / target) * 100), 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Convert reports object to array format expected by API
      const reportsArray = Object.entries(reports).map(([activityId, report]) => ({
        activityId: parseInt(activityId),
        achieved_number: report.achieved_number,
        notes_amharic: report.notes_amharic
      }));

      await annualPlanAPI.submitAmharicActivityReports(planId, reportsArray);
      
      // Navigate back with success message
      navigate('/amharic-plan-reports', { 
        state: { message: 'የእንቅስቃሴ ሪፖርቶች በተሳካ ሁኔታ ተላክዋል!' } 
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit reports');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navbar user={user} onLogout={onLogout} />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-20">
            <div className="inline-block w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="text-purple-200 mt-4">እቅድ በመጫን ላይ...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navbar user={user} onLogout={onLogout} />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-20">
            <p className="text-red-300">እቅድ አልተገኘም</p>
          </div>
        </div>
      </div>
    );
  }

  const monthName = ETHIOPIAN_MONTHS.find(m => m.number === plan.plan_month)?.amharic || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="container mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/amharic-plan-reports')}
          className="flex items-center space-x-2 text-purple-300 hover:text-white mb-6 transition group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>ወደ እቅድ ሪፖርቶች ተመለስ</span>
        </button>

        <div className="max-w-6xl mx-auto">
          {/* Plan Header */}
          <div className="glass rounded-3xl shadow-2xl p-8 backdrop-blur-xl border border-white/20 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                  {plan.plan_title_amharic || plan.title}
                </h1>
                <div className="flex items-center gap-4 text-purple-200 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{monthName} {plan.year}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target size={16} />
                    <span>የአማርኛ መዋቅራዊ እቅድ</span>
                  </div>
                </div>
                {plan.plan_description_amharic && (
                  <p className="text-purple-200" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                    {plan.plan_description_amharic}
                  </p>
                )}
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <FileText size={32} className="text-white" />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-6 py-4 rounded-xl mb-6 backdrop-blur-sm">
              {error}
            </div>
          )}

          {hasSubmittedReports && (
            <div className="bg-green-500/20 border border-green-400/50 text-green-200 px-6 py-4 rounded-xl mb-6 backdrop-blur-sm">
              <p className="font-semibold">✅ የእንቅስቃሴ ሪፖርቶች ቀደም ብሎ ገብተዋል</p>
              <p className="text-sm mt-1">ይህ እቅድ ለዚህ ወር ቀደም ብሎ ሪፖርት ተላክቷል። ዳሽቦርድ ላይ ተመለስ።</p>
            </div>
          )}

          {/* Activity Reports Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="glass rounded-3xl shadow-2xl p-8 backdrop-blur-xl border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  🎯
                </div>
                የእንቅስቃሴ ሪፖርቶች
              </h2>

              <div className="space-y-6">
                {activities.map((activity, index) => {
                  const report = (reports && reports[activity.id]) || { achieved_number: 0, notes_amharic: '' };
                  const percentage = calculatePercentage(report.achieved_number, activity.target_number);
                  
                  return (
                    <div key={activity.id} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      {/* Activity Header */}
                      <div className="mb-4">
                        <div className="flex items-start gap-4 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center font-bold text-white">
                            {activity.activity_number}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                              {activity.activity_title_amharic}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-purple-200">
                              <span className="flex items-center gap-1">
                                <Target size={14} />
                                ዒላማ ቁጥር: {activity.target_number.toLocaleString()} {activity.target_unit_amharic}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Report Input */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-purple-200 mb-2">
                            የተሳካ ቁጥር *
                          </label>
                          <input
                            type="number"
                            value={report.achieved_number}
                            onChange={(e) => updateReport(activity.id, 'achieved_number', parseInt(e.target.value) || 0)}
                            className={`w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-center text-lg font-semibold focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${hasSubmittedReports ? 'opacity-50 cursor-not-allowed' : ''}`}
                            min="0"
                            max={activity.target_number * 2} // Allow up to 200% of target
                            required
                            disabled={hasSubmittedReports}
                            readOnly={hasSubmittedReports}
                          />
                          <div className="mt-2 text-center">
                            <span className={`text-sm font-semibold ${
                              percentage >= 100 ? 'text-green-400' : 
                              percentage >= 75 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {percentage}% የተሳካ
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-purple-200 mb-2">
                            ማስታወሻዎች (በአማርኛ)
                          </label>
                          <textarea
                            value={report.notes_amharic}
                            onChange={(e) => updateReport(activity.id, 'notes_amharic', e.target.value)}
                            className={`w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none ${hasSubmittedReports ? 'opacity-50 cursor-not-allowed' : ''}`}
                            rows="4"
                            placeholder="የእንቅስቃሴው ትግበራ ዝርዝር፣ ተግዳሮቶች እና ስኬቶች ያስገቡ..."
                            style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                            disabled={hasSubmittedReports}
                            readOnly={hasSubmittedReports}
                          />
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-purple-200 mb-2">
                          <span>እድገት</span>
                          <span>{report.achieved_number.toLocaleString()} / {activity.target_number.toLocaleString()} {activity.target_unit_amharic}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${
                              percentage >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                              percentage >= 75 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                              'bg-gradient-to-r from-red-500 to-pink-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-4">
              {hasSubmittedReports ? (
                <button
                  type="button"
                  onClick={() => navigate('/amharic-plan-reports')}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-4 rounded-xl transition transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
                >
                  <ArrowLeft size={24} />
                  ወደ እቅድ ሪፖርቶች ተመለስ
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-4 rounded-xl transition transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg flex items-center justify-center gap-3"
                  >
                    {submitting ? (
                      <>
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ሪፖርት በመላክ ላይ...
                      </>
                    ) : (
                      <>
                        <Save size={24} />
                        የእንቅስቃሴ ሪፖርት አስገባ
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => navigate('/amharic-plan-reports')}
                    className="px-8 py-4 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition text-white font-semibold"
                  >
                    ሰርዝ
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SubmitAmharicReport;