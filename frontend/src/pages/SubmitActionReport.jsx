import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { actionAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { ArrowLeft, Save, Target, TrendingUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getEthiopianMonthName } from '../utils/ethiopianCalendar';

function SubmitActionReport({ user, onLogout }) {
  const navigate = useNavigate();
  const { reportId } = useParams();
  const { t, language } = useLanguage();
  const [report, setReport] = useState(null);
  const [formData, setFormData] = useState({
    actualActivity: '',
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const response = await actionAPI.getMyReports();
      const foundReport = response.data.find(r => r.id === parseInt(reportId));
      
      if (foundReport) {
        setReport(foundReport);
        setFormData({
          actualActivity: foundReport.actual_activity || '',
          notes: foundReport.notes || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
      setError(t('ሪፖርት መጫን አልተሳካም', 'Failed to load report'));
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = () => {
    if (!report || !formData.actualActivity) return 0;
    return ((parseFloat(formData.actualActivity) / report.plan_activity) * 100).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await actionAPI.submit({
        reportId: parseInt(reportId),
        actualActivity: parseInt(formData.actualActivity),
        notes: formData.notes,
      });
      navigate('/action-reports');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navbar user={user} onLogout={onLogout} />
        <div className="container mx-auto px-6 py-8 text-center">
          <div className="inline-block w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-purple-200 mt-4">{t('በመጫን ላይ...', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navbar user={user} onLogout={onLogout} />
        <div className="container mx-auto px-6 py-8 text-center">
          <p className="text-white">{t('ሪፖርት አልተገኘም', 'Report not found')}</p>
        </div>
      </div>
    );
  }

  const isOverdue = new Date() > new Date(report.deadline);
  const percentage = calculatePercentage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="container mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/action-reports')}
          className="flex items-center space-x-2 text-purple-300 hover:text-white mb-6 transition group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>{t('ወደ የተግባር ሪፖርቶች ተመለስ', 'Back to Action Reports')}</span>
        </button>

        <div className="max-w-3xl mx-auto glass rounded-3xl shadow-2xl p-8 backdrop-blur-xl border border-white/20 animate-slide-in">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Target size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{t('የተግባር ሪፖርት', 'Action Report')}</h1>
                <p className="text-purple-200">{t('ተግባር', 'Action')} {report.action_number}</p>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
              <p className="text-white text-sm">{report.action_title}</p>
            </div>
            
            <p className="text-lg font-semibold text-blue-300">
              {getEthiopianMonthName(report.month, language === 'am' ? 'amharic' : 'english')} {report.year}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-400/30">
              <div className="text-sm text-blue-300 mb-1">{t('የተሳካ እንቅስቃሴ', 'Actual Activity')}</div>
              <div className="text-2xl font-bold text-white">
                {formData.actualActivity || '0'}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-4 border border-green-400/30">
              <div className="text-sm text-green-300 mb-1">{t('የእቅድ እንቅስቃሴ (እቅድ)', 'Plan Activity (Target)')}</div>
              <div className="text-2xl font-bold text-white">
                {report.plan_activity?.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-4 border border-purple-400/30">
              <div className="text-sm text-purple-300 mb-1">{t('የመጨረሻ ቀን', 'Deadline')}</div>
              <div className="text-lg font-bold text-white">
                {new Date(report.deadline).toLocaleDateString()}
              </div>
            </div>
            
            <div className={`backdrop-blur-sm rounded-xl p-4 border ${isOverdue ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-400/30' : 'bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border-cyan-400/30'}`}>
              <div className={`text-sm mb-1 ${isOverdue ? 'text-red-300' : 'text-cyan-300'}`}>{t('ሁኔታ', 'Status')}</div>
              <div className={`text-lg font-bold ${isOverdue ? 'text-red-200' : 'text-white'}`}>
                {isOverdue ? t('ዘግይቷል', 'Overdue') : t('በጊዜው', 'On Time')}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm animate-slide-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                {t('የተጠናቀቀ ትክክለኛ እንቅስቃሴ *', 'Actual Activity Completed *')}
              </label>
              <input
                type="number"
                value={formData.actualActivity}
                onChange={(e) => setFormData({ ...formData, actualActivity: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition backdrop-blur-sm"
                placeholder={t('የተጠናቀቀውን ትክክለኛ እንቅስቃሴ ያስገቡ', 'Enter actual activity completed')}
                required
              />
            </div>

            {formData.actualActivity && (
              <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 rounded-xl p-5 backdrop-blur-sm animate-slide-in">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-cyan-200 flex items-center gap-2">
                    <TrendingUp size={20} />
                    {t('የትግበራ መቶኛ', 'Implementation Percentage')}
                  </h3>
                  <span className="text-3xl font-bold text-white">{percentage}%</span>
                </div>
                <div className="bg-white/10 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-cyan-100 mt-2">
                  {t('ስሌት', 'Calculation')}: ({formData.actualActivity} / {report.plan_activity}) × 100 = {percentage}%
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                {t('ማስታወሻዎች', 'Notes / Comments')}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition backdrop-blur-sm resize-none"
                rows="4"
                placeholder={t('ስለዚህ ተግባር ትግበራ ማስታወሻ ያክሉ...', "Add any notes about this action's implementation...")}
              />
            </div>

            {report.submitted_at && (
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-sm text-blue-200">
                  {t('ቀደም ብሎ ገብቷል በ', 'Previously submitted on')} {new Date(report.submitted_at).toLocaleString()}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl transition transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
              >
                <Save size={20} />
                <span>{submitting ? t('በማስገባት ላይ...', 'Submitting...') : t('ሪፖርት አስገባ', 'Submit Report')}</span>
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/action-reports')}
                className="px-8 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition text-white font-semibold"
              >
                {t('ሰርዝ', 'Cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SubmitActionReport;
