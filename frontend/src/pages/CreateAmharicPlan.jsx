import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { annualPlanAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { ArrowLeft, Plus, Trash2, Save, Target } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ETHIOPIAN_MONTHS, getCurrentEthiopianMonth } from '../utils/ethiopianCalendar';

function CreateAmharicPlan({ user, onLogout }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    title_amharic: '',
    goal_amharic: '',
    description_amharic: '',
    year: new Date().getFullYear(),
    month: getCurrentEthiopianMonth(),
    plan_type: 'amharic_structured'
  });
  
  const [activities, setActivities] = useState([
    {
      id: 1,
      activity_number: '3.2.1',
      activity_title_amharic: '',
      target_number: 0,
      target_unit_amharic: 'ሰዎች'
    }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Common Amharic units for target measurements and reporting
  const commonUnits = [
    'ሰዎች', 'ቤተሰቦች', 'ክንውን', 'ስራዎች', 'ፕሮጀክቶች', 
    'ስልጠናዎች', 'ወርሻዎች', 'ማህበራት', 'ቡድኖች', 'መርሃ ግብሮች'
  ];

  const addActivity = () => {
    const newId = Math.max(...activities.map(a => a.id)) + 1;
    const lastNumber = activities[activities.length - 1]?.activity_number || '3.2.0';
    const parts = lastNumber.split('.');
    const newNumber = `${parts[0]}.${parts[1]}.${parseInt(parts[2]) + 1}`;
    
    setActivities([...activities, {
      id: newId,
      activity_number: newNumber,
      activity_title_amharic: '',
      target_number: 0,
      target_unit_amharic: 'ሰዎች'
    }]);
  };

  const removeActivity = (id) => {
    if (activities.length > 1) {
      setActivities(activities.filter(a => a.id !== id));
    }
  };

  const updateActivity = (id, field, value) => {
    setActivities(activities.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create the plan with activities
      const planData = {
        ...formData,
        activities: activities
      };
      
      await annualPlanAPI.createAmharicPlan(planData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create Amharic plan');
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
          <span>ወደ ዳሽቦርድ ተመለስ</span>
        </button>

        <div className="max-w-5xl mx-auto glass rounded-3xl shadow-2xl p-8 backdrop-blur-xl border border-white/20 animate-slide-in">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-3 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                📋
              </div>
              የአማርኛ መዋቅራዊ እቅድ ፍጠር
            </h1>
            <p className="text-purple-200">
              ተዋቅሮ የተዘጋጀ የአማርኛ እቅድ ከንዑስ እንቅስቃሴዎች እና ዒላማዎች ጋር ይፍጠሩ
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm animate-slide-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Plan Header */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                📝 የእቅድ መሰረታዊ መረጃ
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    የእቅድ ርዕስ (English) *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition backdrop-blur-sm"
                    placeholder="e.g., Social Development Plan 2025"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    ወር *
                  </label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition backdrop-blur-sm"
                    style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                    required
                  >
                    {ETHIOPIAN_MONTHS.map(month => (
                      <option key={month.number} value={month.number} className="bg-slate-800">
                        {month.amharic} ({month.english})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    ዓመት *
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
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  ግብ (የዋና ግብ መግለጫ) *
                </label>
                <input
                  type="text"
                  value={formData.goal_amharic}
                  onChange={(e) => setFormData({ ...formData, goal_amharic: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition backdrop-blur-sm"
                  placeholder="ግብ፡- የማህበራዊ ልማት እና የህብረተሰብ ተሳትፎ ማሻሻል"
                  required
                  style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  ዓላማ (የእቅድ ርዕስ በአማርኛ) *
                </label>
                <input
                  type="text"
                  value={formData.title_amharic}
                  onChange={(e) => setFormData({ ...formData, title_amharic: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition backdrop-blur-sm"
                  placeholder="ዓላማ፡- የማህበራዊ የምክር ወደሊት በማስተዋወቅ የማህበራዊ ያለተሳተፈ አባላት ተግባራዊ በማድረግ"
                  required
                  style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  የእቅድ መግለጫ (በአማርኛ)
                </label>
                <textarea
                  value={formData.description_amharic}
                  onChange={(e) => setFormData({ ...formData, description_amharic: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition backdrop-blur-sm resize-none"
                  rows="3"
                  placeholder="የእቅዱን ዝርዝር መግለጫ ያስገቡ..."
                  style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                />
              </div>
            </div>

            {/* Activities Section */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  🎯 ዒላማ እንቅስቃሴዎች
                </h2>
                <button
                  type="button"
                  onClick={addActivity}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                >
                  <Plus size={16} />
                  እንቅስቃሴ ጨምር
                </button>
              </div>

              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={activity.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-purple-200 mb-2">
                          ቁጥር
                        </label>
                        <input
                          type="text"
                          value={activity.activity_number}
                          onChange={(e) => updateActivity(activity.id, 'activity_number', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-center font-mono"
                          placeholder="3.2.1"
                        />
                      </div>

                      <div className="md:col-span-5">
                        <label className="block text-sm font-medium text-purple-200 mb-2">
                          የእንቅስቃሴ ርዕስ (በአማርኛ)
                        </label>
                        <textarea
                          value={activity.activity_title_amharic}
                          onChange={(e) => updateActivity(activity.id, 'activity_title_amharic', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none"
                          rows="2"
                          placeholder="12 ህብረተሰቦችን የሚሳተፉበትን የአላማና ዕየታ ርዕሰ ጉዳይ ጽሁፍን መልዕክት በቀጥር"
                          style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-purple-200 mb-2">
                          ዒላማ ቁጥር
                        </label>
                        <input
                          type="number"
                          value={activity.target_number}
                          onChange={(e) => updateActivity(activity.id, 'target_number', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-center"
                          min="0"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-purple-200 mb-2">
                          መለኪያ
                        </label>
                        <select
                          value={activity.target_unit_amharic}
                          onChange={(e) => updateActivity(activity.id, 'target_unit_amharic', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                          style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                        >
                          {commonUnits.map(unit => (
                            <option key={unit} value={unit} className="bg-slate-800">
                              {unit}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-1">
                        {activities.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeActivity(activity.id)}
                            className="w-full p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                            title="እንቅስቃሴ አስወግድ"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Section */}
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="font-semibold text-blue-200 mb-4 flex items-center gap-2">
                👁️ የእቅድ ቅድመ እይታ
              </h3>
              <div className="bg-white/10 rounded-lg p-4 font-mono text-sm text-white" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                <div className="font-bold text-lg mb-2">{formData.title_amharic || 'ዓላማ፡- ...'}</div>
                <div className="text-purple-300 mb-4 text-sm">
                  {ETHIOPIAN_MONTHS.find(m => m.number === formData.month)?.amharic} {formData.year} - የእቅድ ወር
                </div>
                {activities.map((activity, index) => (
                  <div key={activity.id} className="mb-2 flex items-start gap-4">
                    <span className="font-bold text-blue-300 min-w-[60px]">{activity.activity_number}</span>
                    <span className="flex-1">{activity.activity_title_amharic || '...'}</span>
                    <span className="text-green-300 min-w-[80px] text-right">
                      ዒላማ: {activity.target_number} {activity.target_unit_amharic}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 rounded-xl transition transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    በመፍጠር ላይ...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    የአማርኛ እቅድ ፍጠር
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-8 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition text-white font-semibold"
              >
                ሰርዝ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateAmharicPlan;