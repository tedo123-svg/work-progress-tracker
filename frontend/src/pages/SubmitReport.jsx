import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reportAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { ArrowLeft, Save } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getEthiopianMonthName } from '../utils/ethiopianCalendar';

function SubmitReport({ user, onLogout }) {
  const navigate = useNavigate();
  const { reportId } = useParams();
  const { t, language } = useLanguage();
  const [report, setReport] = useState(null);
  const [formData, setFormData] = useState({
    achievedAmount: '',
    achievedUnits: '',
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
      const response = await reportAPI.getMyReports();
      const foundReport = response.data.find(r => r.id === parseInt(reportId));
      
      if (foundReport) {
        setReport(foundReport);
        setFormData({
          achievedAmount: foundReport.achieved_amount || '',
          achievedUnits: foundReport.achieved_units || '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await reportAPI.submit({
        reportId: parseInt(reportId),
        achievedAmount: parseFloat(formData.achievedAmount),
        achievedUnits: parseInt(formData.achievedUnits),
        notes: formData.notes,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="container mx-auto px-4 py-8 text-center">{t('በመጫን ላይ...', 'Loading...')}</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="container mx-auto px-4 py-8 text-center">{t('ሪፖርት አልተገኘም', 'Report not found')}</div>
      </div>
    );
  }

  const isOverdue = new Date() > new Date(report.deadline);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft size={20} />
          <span>{t('ወደ ዳሽቦርድ ተመለስ', 'Back to Dashboard')}</span>
        </button>

        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('ወርሃዊ ሪፖርት', 'Monthly Report')}</h1>
            <p className="text-gray-600">{report.plan_title}</p>
            <p className="text-lg font-semibold text-blue-600 mt-2">
              {getEthiopianMonthName(report.month, language === 'am' ? 'amharic' : 'english')} {report.year}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">{t('ዒላማ መጠን', 'Target Amount')}</div>
              <div className="text-2xl font-bold text-blue-600">
                {report.target_amount?.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">{t('ዒላማ ክፍሎች', 'Target Units')}</div>
              <div className="text-2xl font-bold text-purple-600">
                {report.target_units?.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">{t('የመጨረሻ ቀን', 'Deadline')}</div>
              <div className="text-lg font-bold text-green-600">
                {new Date(report.deadline).toLocaleDateString()}
              </div>
            </div>
            
            <div className={`rounded-lg p-4 ${isOverdue ? 'bg-red-50' : 'bg-gray-50'}`}>
              <div className="text-sm text-gray-600">{t('ሁኔታ', 'Status')}</div>
              <div className={`text-lg font-bold ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                {isOverdue ? t('ዘግይቷል', 'Overdue') : t('በጊዜው', 'On Time')}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('የተሳካ መጠን *', 'Achieved Amount *')}
              </label>
              <input
                type="number"
                value={formData.achievedAmount}
                onChange={(e) => setFormData({ ...formData, achievedAmount: e.target.value })}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${report.submitted_at ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="0"
                step="0.01"
                required
                disabled={report.submitted_at}
                readOnly={report.submitted_at}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('የተሳካ ክፍሎች *', 'Achieved Units *')}
              </label>
              <input
                type="number"
                value={formData.achievedUnits}
                onChange={(e) => setFormData({ ...formData, achievedUnits: e.target.value })}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${report.submitted_at ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="0"
                required
                disabled={report.submitted_at}
                readOnly={report.submitted_at}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('ማስታወሻዎች', 'Notes / Comments')}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${report.submitted_at ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                rows="4"
                placeholder={t('ስለዚህ ወር እድገት ማስታወሻ ያክሉ...', "Add any notes about this month's progress...")}
                disabled={report.submitted_at}
                readOnly={report.submitted_at}
              />
            </div>

            {report.submitted_at && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-semibold">
                  ✅ {t('ቀደም ብሎ ገብቷል በ', 'Already submitted on')} {new Date(report.submitted_at).toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {t('ይህ ሪፖርት ቀደም ብሎ ገብቷል። ዳሽቦርድ ላይ ተመለስ።', 'This report has already been submitted. Please return to dashboard.')}
                </p>
              </div>
            )}

            <div className="flex space-x-4">
              {report.submitted_at ? (
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition"
                >
                  <ArrowLeft size={20} />
                  <span>{t('ወደ ዳሽቦርድ ተመለስ', 'Return to Dashboard')}</span>
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
                  >
                    <Save size={20} />
                    <span>{submitting ? t('በማስገባት ላይ...', 'Submitting...') : t('ሪፖርት አስገባ', 'Submit Report')}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    {t('ሰርዝ', 'Cancel')}
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

export default SubmitReport;
