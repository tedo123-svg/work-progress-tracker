import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { annualPlanAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

function CreateAnnualPlan({ user, onLogout }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    year: new Date().getFullYear(),
    targetAmount: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await annualPlanAPI.create(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create annual plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="container mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-purple-300 hover:text-white mb-6 transition group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>{t('ወደ ዳሽቦርድ ተመለስ', 'Back to Dashboard')}</span>
        </button>

        <div className="max-w-3xl mx-auto glass rounded-3xl shadow-2xl p-8 backdrop-blur-xl border border-white/20 animate-slide-in">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-3 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <ArrowLeft size={24} className="text-white rotate-180" />
              </div>
              {t('የዓመታዊ እቅድ ፍጠር', 'Create Annual Plan')}
            </h1>
            <p className="text-purple-200">
              {t('ስርዓቱ በራስ-ሰር ወደ 12 ወርሃዊ ጊዜዎች ይከፍለዋል እና ለሁሉም የወረዳ ተጠቃሚዎች ሪፖርቶችን ይፈጥራል', 'The system will automatically split this into 12 monthly periods and create reports for all woreda users')}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm animate-slide-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                {t('የእቅድ ርዕስ', 'Plan Title')} *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition backdrop-blur-sm"
                placeholder={t('ለምሳሌ፣ 2025 የሽያጭ እቅድ', 'e.g., 2025 Sales Target')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                {t('መግለጫ', 'Description')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition backdrop-blur-sm resize-none"
                rows="4"
                placeholder={t('የዓመታዊ እቅድ አላማዎችን ይግለጹ...', 'Describe the annual plan objectives...')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                {t('ዓመት', 'Year')} *
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition backdrop-blur-sm"
                min={new Date().getFullYear()}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                {t('እቅድ', 'Target Number')} *
              </label>
              <input
                type="number"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition backdrop-blur-sm"
                placeholder={t('ለምሳሌ፣ 1000 (የሰዎች ብዛት)', 'e.g., 1000 (number of people)')}
                step="0.01"
                required
              />
              <p className="text-sm text-purple-300 mt-2">{t('ለመከታተል የእቅድ ቁጥር ያስገቡ', 'Enter the target number to track')}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-5 backdrop-blur-sm">
              <h3 className="font-semibold text-blue-200 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                {t('ምን ይከሰታል?', 'What happens next?')}
              </h3>
              <ul className="text-sm text-blue-100 space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  {t('12 ወርሃዊ ጊዜዎች በራስ-ሰር ይፈጠራሉ', '12 monthly periods will be auto-generated')}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                  {t('ወርሃዊ እቅዶች በእኩል ይከፋፈላሉ', 'Monthly targets will be evenly distributed')}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-pink-400 rounded-full"></div>
                  {t('ለሁሉም 10 የወረዳ ተጠቃሚዎች ሪፖርቶች ይፈጠራሉ', 'Reports will be created for all 10 woreda users')}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  {t('የመጨረሻ ቀናት በእያንዳንዱ ወር 18ኛ ቀን ይቀመጣሉ', 'Deadlines will be set to the 18th of each month')}
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl transition transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {t('በመፍጠር ላይ...', 'Creating...')}
                  </span>
                ) : (
                  t('የዓመታዊ እቅድ ፍጠር', 'Create Annual Plan')
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/')}
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

export default CreateAnnualPlan;
