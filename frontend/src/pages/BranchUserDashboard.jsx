import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { annualPlanAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { FileText, Clock, CheckCircle, AlertCircle, Award, Calendar } from 'lucide-react';
import { getCurrentEthiopianMonth, ETHIOPIAN_MONTHS } from '../utils/ethiopianCalendar';
import { useLanguage } from '../contexts/LanguageContext';

function BranchUserDashboard({ user, onLogout }) {
  const { t, language } = useLanguage();
  const [amharicPlans, setAmharicPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planStats, setPlanStats] = useState({
    totalPlans: 0,
    totalActivities: 0,
    submittedReports: 0,
    pendingReports: 0
  });

  useEffect(() => {
    fetchAmharicPlansAndReports();
  }, []);

  const fetchAmharicPlansAndReports = async () => {
    try {
      // Fetch all Amharic plans
      const plansResponse = await annualPlanAPI.getAll();
      const amharicPlansOnly = (plansResponse.data || []).filter(plan => plan.plan_type === 'amharic_structured');
      setAmharicPlans(amharicPlansOnly);

      // Calculate statistics
      let totalActivities = 0;
      let submittedReports = 0;
      let pendingReports = 0;

      for (const plan of amharicPlansOnly) {
        try {
          // Get activities for each plan
          const activitiesResponse = await annualPlanAPI.getPlanActivities(plan.id);
          totalActivities += activitiesResponse.data.length;

          // Get reports for each plan (if any)
          try {
            const reportsResponse = await annualPlanAPI.getAmharicActivityReports(plan.id);
            const reports = reportsResponse.data || [];
            submittedReports += reports.filter(r => r.status === 'submitted').length;
            pendingReports += reports.filter(r => r.status === 'pending').length;
          } catch (err) {
            // No reports yet for this plan
            pendingReports += activitiesResponse.data.length;
          }
        } catch (err) {
          console.error('Error fetching activities for plan:', plan.id, err);
        }
      }

      setPlanStats({
        totalPlans: amharicPlansOnly.length,
        totalActivities,
        submittedReports,
        pendingReports
      });
    } catch (error) {
      console.error('Failed to fetch Amharic plans:', error);
      // Set empty states to prevent undefined errors
      setAmharicPlans([]);
      setPlanStats({
        totalPlans: 0,
        totalActivities: 0,
        submittedReports: 0,
        pendingReports: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
      submitted: 'bg-green-500/20 text-green-300 border-green-400/30',
      late: 'bg-red-500/20 text-red-300 border-red-400/30',
    };
    
    const icons = {
      pending: <Clock size={14} />,
      submitted: <CheckCircle size={14} />,
      late: <AlertCircle size={14} />,
    };
    
    const statusText = {
      pending: t('በመጠባበቅ ላይ', 'Pending'),
      submitted: t('ገብቷል', 'Submitted'),
      late: t('ዘግይቷል', 'Late'),
    };
    
    return (
      <span className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold border backdrop-blur-sm ${styles[status]}`}>
        {icons[status]}
        <span>{statusText[status]}</span>
      </span>
    );
  };

  // Stats are calculated from planStats (already calculated in fetchAmharicPlansAndReports)
  const stats = {
    total: planStats.totalActivities,
    pending: planStats.pendingReports,
    submitted: planStats.submittedReports,
    late: 0, // We don't track late status in this component
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 animate-slide-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Award className="text-yellow-400" size={32} />
                {t('ቅርንጫፍ ዳሽቦርድ', 'Branch Dashboard')}
              </h1>
              <p className="text-purple-200">{t('የወርሃዊ ሪፖርቶችዎን ያስገቡ እና ይከታተሉ (የአሁኑን ወር ብቻ በማሳየት ላይ)', 'Submit and track your monthly reports (Showing current month only)')}</p>
            </div>
            
            <Link
              to="/amharic-plan-reports"
              className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl transition transform hover:scale-105 shadow-lg font-semibold"
            >
              <FileText size={20} />
              <span>{t('የአማርኛ እቅድ ሪፖርቶች', 'Amharic Plan Reports')}</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass rounded-2xl shadow-xl p-6 backdrop-blur-xl border border-white/20 card-hover animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <FileText size={24} className="text-white" />
              </div>
              <TrendingUp className="text-blue-400" size={20} />
            </div>
            <div className="text-sm text-purple-300 mb-1">{t('የአማርኛ እቅዶች', 'Amharic Plans')}</div>
            <div className="text-4xl font-bold text-white">{planStats.totalPlans}</div>
          </div>
          
          <div className="glass rounded-2xl shadow-xl p-6 backdrop-blur-xl border border-blue-400/30 card-hover animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar size={24} className="text-white" />
              </div>
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            </div>
            <div className="text-sm text-blue-300 mb-1">{t('ጠቅላላ እንቅስቃሴዎች', 'Total Activities')}</div>
            <div className="text-4xl font-bold text-white">{planStats.totalActivities}</div>
          </div>
          
          <div className="glass rounded-2xl shadow-xl p-6 backdrop-blur-xl border border-green-400/30 card-hover animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle size={24} className="text-white" />
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <div className="text-sm text-green-300 mb-1">{t('የተላኩ ሪፖርቶች', 'Submitted Reports')}</div>
            <div className="text-4xl font-bold text-white">{planStats.submittedReports}</div>
          </div>
          
          <div className="glass rounded-2xl shadow-xl p-6 backdrop-blur-xl border border-yellow-400/30 card-hover animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Clock size={24} className="text-white" />
              </div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
            <div className="text-sm text-yellow-300 mb-1">{t('በመጠባበቅ ላይ', 'Pending Reports')}</div>
            <div className="text-4xl font-bold text-white">{planStats.pendingReports}</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="text-purple-200 mt-4">{t('የአማርኛ እቅዶች በመጫን ላይ...', 'Loading Amharic plans...')}</p>
          </div>
        ) : amharicPlans.length === 0 ? (
          <div className="glass rounded-3xl shadow-2xl p-16 text-center backdrop-blur-xl border border-white/20 animate-fade-in">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <FileText size={48} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">{t('ምንም የአማርኛ እቅዶች የሉም', 'No Amharic Plans Available')}</h3>
            <p className="text-purple-200 max-w-md mx-auto">
              {t('የአማርኛ እቅዶች አሁንም አልተፈጠሩም። ዋና ቅርንጫፍ የአማርኛ እቅድ ሲፈጥር እዚህ ይታያል።', 'Amharic plans have not been created yet. They will appear here when the main branch creates Amharic plans.')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {amharicPlans.map((plan) => {
              const monthName = ETHIOPIAN_MONTHS.find(m => m.number === plan.plan_month)?.amharic || '';
              
              return (
                <div key={plan.id} className="glass rounded-2xl shadow-xl p-6 backdrop-blur-xl border border-white/20 hover:border-white/30 transition animate-fade-in">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                        {plan.plan_title_amharic || plan.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-purple-200 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span>{monthName} {plan.year}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText size={16} />
                          <span>የአማርኛ መዋቅራዊ እቅድ</span>
                        </div>
                      </div>
                      {plan.plan_description_amharic && (
                        <p className="text-purple-200 text-sm mb-4" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                          {plan.plan_description_amharic}
                        </p>
                      )}
                    </div>
                    
                    <div className="ml-6">
                      <Link
                        to={`/submit-amharic-report/${plan.id}`}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl transition transform hover:scale-105 shadow-lg font-semibold"
                      >
                        <FileText size={20} />
                        ሪፖርት አድርግ
                      </Link>
                    </div>
                  </div>
                  
                  <div className="text-sm text-purple-300">
                    <span>የተፈጠረበት ቀን: {new Date(plan.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default BranchUserDashboard;
