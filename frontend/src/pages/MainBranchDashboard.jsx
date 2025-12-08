import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { monthlyPlanAPI, reportAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { Calendar, TrendingUp, Users, Sparkles, Target, Edit, RefreshCw, History } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getEthiopianMonthName, getCurrentEthiopianMonth } from '../utils/ethiopianCalendar';

function MainBranchDashboard({ user, onLogout }) {
  const { t, language } = useLanguage();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newTarget, setNewTarget] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
    try {
      const planResponse = await monthlyPlanAPI.getCurrent();
      setCurrentPlan(planResponse.data);
      setNewTarget(planResponse.data.target_amount);
      
      // Fetch stats for current plan
      if (planResponse.data.id) {
        const statsResponse = await monthlyPlanAPI.getStats(planResponse.data.id);
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch current plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTarget = async () => {
    setUpdating(true);
    try {
      await monthlyPlanAPI.updateTarget(parseFloat(newTarget));
      await fetchCurrentPlan();
      setShowUpdateModal(false);
    } catch (error) {
      console.error('Failed to update target:', error);
      alert('Failed to update target');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-slide-in">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Sparkles className="text-yellow-400" size={32} />
              {t('ዋና ቅርንጫፍ ዳሽቦርድ', 'Main Branch Dashboard')}
            </h1>
            <p className="text-purple-200">{t('የወርሃዊ እቅድን ያስተዳድሩ እና በሁሉም ቅርንጫፎች ላይ እድገትን ይከታተሉ', 'Manage monthly plan and monitor progress across all branches')}</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowUpdateModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl transition transform hover:scale-105 shadow-lg"
            >
              <Edit size={20} />
              <span className="font-semibold">{t('ዒላማ አዘምን', 'Update Target')}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="text-purple-200 mt-4">{t('እቅድ በመጫን ላይ...', 'Loading plan...')}</p>
          </div>
        ) : !currentPlan ? (
          <div className="glass rounded-3xl shadow-2xl p-16 text-center backdrop-blur-xl border border-white/20 animate-fade-in">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <RefreshCw size={48} className="text-white animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">{t('የወር እቅድ በመፍጠር ላይ...', 'Creating Monthly Plan...')}</h3>
            <p className="text-purple-200 max-w-md mx-auto">
              {t('ስርዓቱ በራስ-ሰር የወርሃዊ እቅድ እየፈጠረ ነው። እባክዎ ይጠብቁ...', 'The system is automatically creating the monthly plan. Please wait...')}
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Current Month Plan Card */}
            <div className="glass rounded-2xl shadow-xl p-6 backdrop-blur-xl border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Calendar size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{t('የአሁኑ ወር እቅድ', 'Current Month Plan')}</h2>
                    <p className="text-purple-200">
                      {getEthiopianMonthName(currentPlan.month, language === 'am' ? 'amharic' : 'english')} {currentPlan.year}
                    </p>
                  </div>
                </div>
                <div className="px-4 py-2 bg-green-500/20 border border-green-400/30 rounded-xl">
                  <span className="text-green-300 font-semibold">{t('ንቁ', 'Active')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-4 border border-green-400/30">
                  <div className="flex items-center gap-2 text-green-300 text-sm mb-1">
                    <Target size={16} />
                    {t('ወርሃዊ ዒላማ', 'Monthly Target')}
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {currentPlan.target_amount?.toLocaleString()}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-400/30">
                  <div className="flex items-center gap-2 text-blue-300 text-sm mb-1">
                    <Calendar size={16} />
                    {t('የመጨረሻ ቀን', 'Deadline')}
                  </div>
                  <div className="text-xl font-bold text-white">
                    {new Date(currentPlan.deadline).toLocaleDateString()}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-4 border border-purple-400/30">
                  <div className="flex items-center gap-2 text-purple-300 text-sm mb-1">
                    <TrendingUp size={16} />
                    {t('አማካይ እድገት', 'Avg Progress')}
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {stats ? (Number(stats.avg_progress) || 0).toFixed(1) : '0.0'}%
                  </div>
                </div>
              </div>

              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-purple-300 text-sm mb-1">{t('ጠቅላላ ሪፖርቶች', 'Total Reports')}</div>
                    <div className="text-2xl font-bold text-white">{stats.total_reports || 0}</div>
                  </div>
                  <div className="bg-green-500/10 rounded-xl p-4 border border-green-400/20">
                    <div className="text-green-300 text-sm mb-1">{t('ገብቷል', 'Submitted')}</div>
                    <div className="text-2xl font-bold text-white">{stats.submitted_reports || 0}</div>
                  </div>
                  <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-400/20">
                    <div className="text-yellow-300 text-sm mb-1">{t('በመጠባበቅ ላይ', 'Pending')}</div>
                    <div className="text-2xl font-bold text-white">{stats.pending_reports || 0}</div>
                  </div>
                  <div className="bg-red-500/10 rounded-xl p-4 border border-red-400/20">
                    <div className="text-red-300 text-sm mb-1">{t('ዘግይቷል', 'Late')}</div>
                    <div className="text-2xl font-bold text-white">{stats.late_reports || 0}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 rounded-xl p-5 backdrop-blur-sm">
              <h3 className="font-semibold text-cyan-200 mb-3 flex items-center gap-2">
                <RefreshCw size={20} />
                {t('ራስ-ሰር እድሳት ስርዓት', 'Auto-Renewal System')}
              </h3>
              <ul className="text-sm text-cyan-100 space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  {t('ስርዓቱ በራስ-ሰር በየወሩ አዲስ እቅድ ይፈጥራል', 'System automatically creates new plan each month')}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                  {t('ከ18ኛው ቀን በኋላ የቀድሞው ወር ይዘጋል እና አዲሱ ይከፈታል', 'After 18th, previous month closes and new one opens')}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-pink-400 rounded-full"></div>
                  {t('ዒላማ ቁጥሮች በራስ-ሰር ይገለበጣሉ', 'Target numbers automatically copied')}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                  {t('ሁሉም ታሪክ እና ሪፖርቶች ይቀመጣሉ', 'All history and reports preserved')}
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Update Target Modal */}
        {showUpdateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass rounded-2xl shadow-2xl p-8 max-w-md w-full backdrop-blur-xl border border-white/20 animate-slide-in">
              <h3 className="text-2xl font-bold text-white mb-4">{t('ወርሃዊ ዒላማ አዘምን', 'Update Monthly Target')}</h3>
              <p className="text-purple-200 mb-6">
                {t('የአሁኑን ወር ዒላማ ቁጥር ያዘምኑ', 'Update the target number for current month')}
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  {t('አዲስ ዒላማ ቁጥር', 'New Target Number')}
                </label>
                <input
                  type="number"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition backdrop-blur-sm"
                  placeholder="114277.75"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleUpdateTarget}
                  disabled={updating}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl transition transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {updating ? t('በማዘመን ላይ...', 'Updating...') : t('አዘምን', 'Update')}
                </button>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition text-white font-semibold"
                >
                  {t('ሰርዝ', 'Cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainBranchDashboard;
