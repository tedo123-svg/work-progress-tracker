import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { actionAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { ArrowLeft, Plus, Trash2, Target } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// Plan number field has been removed as requested

function CreateActions({ user, onLogout }) {
  const navigate = useNavigate();
  const { planId } = useParams();
  const { t } = useLanguage();
  const [actions, setActions] = useState([
    { actionNumber: 1, actionTitle: '', planActivity: '', attachments: [] }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addAction = () => {
    setActions([
      ...actions,
      { actionNumber: actions.length + 1, actionTitle: '', planActivity: '', attachments: [] }
    ]);
  };

  const removeAction = (index) => {
    if (actions.length > 1) {
      const newActions = actions.filter((_, i) => i !== index);
      // Renumber actions
      newActions.forEach((action, i) => {
        action.actionNumber = i + 1;
      });
      setActions(newActions);
    }
  };

  const updateAction = (index, field, value) => {
    const newActions = [...actions];
    newActions[index][field] = value;
    setActions(newActions);
  };

  const addAttachment = (index) => {
    const newActions = [...actions];
    newActions[index].attachments.push({ title: '', url: '' });
    setActions(newActions);
  };

  const updateAttachment = (actionIndex, attachmentIndex, field, value) => {
    const newActions = [...actions];
    newActions[actionIndex].attachments[attachmentIndex][field] = value;
    setActions(newActions);
  };

  const removeAttachment = (actionIndex, attachmentIndex) => {
    const newActions = [...actions];
    newActions[actionIndex].attachments.splice(attachmentIndex, 1);
    setActions(newActions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await actionAPI.create({
        annualPlanId: parseInt(planId),
        actions: actions.map(a => ({
          actionNumber: a.actionNumber,
          actionTitle: a.actionTitle,
          planActivity: parseInt((a.planActivity ?? '').toString().replace(/,/g, '')),
          attachments: (a.attachments || []).filter(att => att.title && att.url)
        }))
      });
      navigate(`/plan/${planId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create actions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="container mx-auto px-6 py-8">
        <button
          onClick={() => navigate(`/plan/${planId}`)}
          className="flex items-center space-x-2 text-purple-300 hover:text-white mb-6 transition group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>{t('ወደ እቅድ ተመለስ', 'Back to Plan')}</span>
        </button>

        <div className="max-w-5xl mx-auto glass rounded-3xl shadow-2xl p-8 backdrop-blur-xl border border-white/20 animate-slide-in">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-3 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Target size={24} className="text-white" />
              </div>
              {t('ተግባራት ፍጠር', 'Create Actions')}
            </h1>
            <p className="text-purple-200">
              {t('ተግባራትን እና ተግባራት ይግለጹ። ቅርንጫፎች የተጠናቀቁ ትክክለኛ እንቅስቃሴዎችን ሪፖርት ያደርጋሉ።', 'Define actions and target activities. Branches will report actual activities completed.')}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm animate-slide-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {actions.map((action, index) => (
              <div key={index} className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-sm">
                      {action.actionNumber}
                    </div>
                    {t('ተግባር', 'Action')} {action.actionNumber}
                  </h3>
                  {actions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAction(index)}
                      className="text-red-400 hover:text-red-300 transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    {t('አገናኞች ያክሉ (አማራጭ)', 'Attach Links (optional)')}
                  </label>
                  {(action.attachments || []).map((att, aIdx) => (
                    <div key={aIdx} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <input
                        type="text"
                        value={att.title}
                        onChange={(e) => updateAttachment(index, aIdx, 'title', e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition backdrop-blur-sm"
                        placeholder={t('ርዕስ (ለምሳሌ፣ የእቅድ ሰነድ)', 'Title (e.g., Plan Document)')}
                      />
                      <input
                        type="url"
                        value={att.url}
                        onChange={(e) => updateAttachment(index, aIdx, 'url', e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition backdrop-blur-sm"
                        placeholder="https://..."
                      />
                      <button
                        type="button"
                        onClick={() => removeAttachment(index, aIdx)}
                        className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition text-white font-semibold"
                      >
                        {t('አስወግድ', 'Remove')}
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addAttachment(index)}
                    className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition"
                  >
                    <Plus size={16} />
                    <span>{t('አገናኝ ያክሉ', 'Add Link')}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    {t('የተግባር ርዕስ *', 'Action Title *')}
                  </label>
                  <textarea
                    value={action.actionTitle}
                    onChange={(e) => updateAction(index, 'actionTitle', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition backdrop-blur-sm resize-none"
                    rows="2"
                    placeholder={t('ለምሳሌ፣ የማህበረ ሰብ ቡድኖችን በምክክር መድረኮች ላይ ማሳተፍ...', 'e.g., Involve community groups in consultation forums...')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    {t('የእቅድ እንቅስቃሴ (እቅድ) *', 'Plan Activity (Target) *')}
                  </label>
                  <input
                    type="number"
                    value={action.planActivity}
                    onChange={(e) => updateAction(index, 'planActivity', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition backdrop-blur-sm"
                    placeholder={t('ለምሳሌ፣ 1317376', 'e.g., 1317376')}
                    required
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addAction}
              className="w-full flex items-center justify-center space-x-2 bg-white/10 border border-white/20 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition"
            >
              <Plus size={20} />
              <span>{t('ሌላ ተግባር ያክሉ', 'Add Another Action')}</span>
            </button>

            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-5 backdrop-blur-sm">
              <h3 className="font-semibold text-blue-200 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">ℹ</span>
                </div>
                {t('እንዴት ይሰራል', 'How it works')}
              </h3>
              <ul className="text-sm text-blue-100 space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  {t('ቅርንጫፎች እነዚህን ተግባራት በወርሃዊ ሪፖርቶቻቸው ውስጥ ያያሉ', 'Branches will see these actions in their monthly reports')}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                  {t('የተጠናቀቁ ትክክለኛ እንቅስቃሴዎችን ያስገባሉ', 'They input actual activities completed')}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-pink-400 rounded-full"></div>
                  {t('ስርዓቱ በራስ-ሰር ያሰላል: (ትክክለኛ / እቅድ) × 100%', 'System automatically calculates: (Actual / Plan) × 100%')}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  {t('ሁሉንም ማስገባቶች ማየት እና እድገትን መከታተል ይችላሉ', 'You can view all submissions and track progress')}
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
                  t('ተግባራት ፍጠር', 'Create Actions')
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate(`/plan/${planId}`)}
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

export default CreateActions;
