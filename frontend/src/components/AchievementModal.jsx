import { useState } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { actionAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

function AchievementModal({ report, isOpen, onClose, onSuccess }) {
  const { t } = useLanguage();
  const [achievementValue, setAchievementValue] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !report) return null;

  const calculatePercentage = () => {
    if (!achievementValue) return 0;
    return ((parseFloat(achievementValue) / report.plan_activity) * 100).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUpdating(true);

    try {
      await actionAPI.quickUpdate(report.id, parseFloat(achievementValue));
      onSuccess();
      setAchievementValue('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update achievement');
    } finally {
      setUpdating(false);
    }
  };

  const percentage = calculatePercentage();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/20 max-w-md w-full animate-slide-in">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {t('ስኬት ያክሉ', 'Add Achievement')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition"
          >
            <X size={20} className="text-purple-200" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-sm text-purple-300 mb-1">
              {t('እቅድ', 'Plan')}: {report.plan_activity}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">
              {t('ስኬትዎን ያስገቡ', 'Enter Your Achievement')}
            </label>
            <input
              type="number"
              value={achievementValue}
              onChange={(e) => setAchievementValue(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
              placeholder={t('ቁጥር ያስገቡ', 'Enter number')}
              required
            />
          </div>

          {achievementValue && (
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-lg p-4 animate-slide-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-cyan-200">
                  {t('ስሌት', 'Calculation')}:
                </span>
                <span className="text-2xl font-bold text-white">{percentage}%</span>
              </div>
              <div className="bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-cyan-100 mt-2">
                ({achievementValue} ÷ {report.plan_activity}) × 100
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={updating || !achievementValue}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:hover:from-cyan-600 disabled:hover:to-blue-600"
            >
              {updating ? t('በመዘምren ላይ...', 'Updating...') : t('አድስ', 'Update')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-lg transition border border-white/20"
            >
              {t('ሰርዝ', 'Cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AchievementModal;
