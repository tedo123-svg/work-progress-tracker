import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { actionAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { FileText, Clock, CheckCircle, AlertCircle, Target, TrendingUp, Link as LinkIcon, X, Download, ChevronDown } from 'lucide-react';
import { attachmentsAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { getEthiopianMonthName, formatEthiopianDeadline, getCurrentEthiopianDate } from '../utils/ethiopianCalendar';
import { exportActionReportsToPDF, exportActionReportsToExcel, exportActionReportsToWord } from '../utils/exportReports';

function ActionReports({ user, onLogout }) {
  const { language, t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attaching, setAttaching] = useState(false);
  const [attachmentModal, setAttachmentModal] = useState({ open: false, report: null, title: '', url: '' });
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  useEffect(() => {
    fetchReports();
    // Set current Ethiopian month and year for export
    const currentDate = getCurrentEthiopianDate();
    setSelectedMonth(currentDate.month);
    setSelectedYear(currentDate.year);
  }, []);

  const fetchReports = async () => {
    try {
      const response = await actionAPI.getMyReports();
      setReports(response.data);
    } catch (error) {
      console.error('Failed to fetch action reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAttachmentModal = (report) => {
    setAttachmentModal({ open: true, report, title: '', url: '' });
  };

  const submitAttachment = async (e) => {
    e.preventDefault();
    if (!attachmentModal.report) return;
    setAttaching(true);
    try {
      await attachmentsAPI.addActionReportAttachment(attachmentModal.report.id, {
        title: attachmentModal.title || t('የተሳካ ማስረጃ', 'Achievement Evidence'),
        url: attachmentModal.url
      });
      setAttachmentModal({ open: false, report: null, title: '', url: '' });
    } catch (error) {
      console.error('Failed to add attachment:', error);
      alert(t('አባሪ መጨመር አልተሳካም', 'Failed to add attachment'));
    } finally {
      setAttaching(false);
    }
  };

  const handleExport = (format) => {
    try {
      if (reports.length === 0) {
        alert(t('ምንም ሪፖርቶች የሉም', 'No reports to export'));
        return;
      }

      const month = selectedMonth || getCurrentEthiopianDate().month;
      const year = selectedYear || getCurrentEthiopianDate().year;

      switch (format) {
        case 'pdf':
          exportActionReportsToPDF(reports, month, year, language);
          break;
        case 'excel':
          exportActionReportsToExcel(reports, month, year, language);
          break;
        case 'word':
          exportActionReportsToWord(reports, month, year, language);
          break;
        default:
          console.error('Unknown export format:', format);
      }
      setShowExportDropdown(false);
    } catch (error) {
      console.error('Export error:', error);
      alert(t('ወደ ውጭ መላክ አልተሳካም', 'Export failed'));
    }
  };

  // Get unique months and years from reports for filtering
  const availablePeriods = [...new Set(reports.map(r => `${r.month}-${r.year}`))].map(period => {
    const [month, year] = period.split('-');
    return { month: parseInt(month), year: parseInt(year) };
  });

  // Filter reports by selected period
  const filteredReports = selectedMonth && selectedYear 
    ? reports.filter(r => r.month === selectedMonth && r.year === selectedYear)
    : reports;

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
    
    return (
      <span className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold border backdrop-blur-sm ${styles[status]}`}>
        {icons[status]}
        <span className="capitalize">{
          status === 'submitted' ? t('ገብቷል', 'Submitted') :
          status === 'late' ? t('ዘግይቷል', 'Late') :
          t('በመጠባበቅ ላይ', 'Pending')
        }</span>
      </span>
    );
  };

  const stats = {
    total: filteredReports.length,
    pending: filteredReports.filter(r => r.status === 'pending').length,
    submitted: filteredReports.filter(r => r.status === 'submitted').length,
    late: filteredReports.filter(r => r.status === 'late').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="container mx-auto px-6 py-8">
      <div className="mb-8 animate-slide-in">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Target className="text-yellow-400" size={32} />
              {t('የተግባር ሪፖርቶች', 'Action Reports')}
            </h1>
            <p className="text-purple-200">{t('የወርሃዊ የተግባር ትግበራ ሪፖርቶችዎን ያስገቡ', 'Submit your monthly action implementation reports')}</p>
          </div>
          
          {/* Export Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Period Selector */}
            <div className="flex gap-2">
              <select
                value={selectedMonth || ''}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition backdrop-blur-sm"
              >
                <option value="">{t('ሁሉም ወሮች', 'All Months')}</option>
                {availablePeriods.map(period => (
                  <option key={`${period.month}-${period.year}`} value={period.month} className="bg-slate-800">
                    {getEthiopianMonthName(period.month, language === 'am' ? 'amharic' : 'english')} {period.year}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition transform hover:scale-105 shadow-lg z-50"
                disabled={reports.length === 0}
              >
                <Download size={16} />
                <span>{t('ወደ ውጭ ላክ', 'Export')}</span>
                <ChevronDown size={16} className={`transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showExportDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowExportDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-white/20 rounded-lg shadow-2xl backdrop-blur-xl z-50">
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center gap-2 rounded-t-lg"
                    >
                      <FileText size={16} />
                      <span>{t('PDF ወደ ውጭ ላክ', 'Export as PDF')}</span>
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center gap-2"
                    >
                      <FileText size={16} />
                      <span>{t('Excel ወደ ውጭ ላክ', 'Export as Excel')}</span>
                    </button>
                    <button
                      onClick={() => handleExport('word')}
                      className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center gap-2 rounded-b-lg"
                    >
                      <FileText size={16} />
                      <span>{t('Word ወደ ውጭ ላክ', 'Export as Word')}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
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
            <div className="text-sm text-purple-300 mb-1">{t('ጠቅላላ ተግባራት', 'Total Actions')}</div>
            <div className="text-4xl font-bold text-white">{stats.total}</div>
          </div>
          
          <div className="glass rounded-2xl shadow-xl p-6 backdrop-blur-xl border border-yellow-400/30 card-hover animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Clock size={24} className="text-white" />
              </div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
            <div className="text-sm text-yellow-300 mb-1">{t('በመጠባበቅ ላይ', 'Pending')}</div>
            <div className="text-4xl font-bold text-white">{stats.pending}</div>
          </div>
          
          <div className="glass rounded-2xl shadow-xl p-6 backdrop-blur-xl border border-green-400/30 card-hover animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle size={24} className="text-white" />
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <div className="text-sm text-green-300 mb-1">{t('ገብቷል', 'Submitted')}</div>
            <div className="text-4xl font-bold text-white">{stats.submitted}</div>
          </div>
          
          <div className="glass rounded-2xl shadow-xl p-6 backdrop-blur-xl border border-red-400/30 card-hover animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <AlertCircle size={24} className="text-white" />
              </div>
              <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
            </div>
            <div className="text-sm text-red-300 mb-1">{t('ዘግይቷል', 'Late')}</div>
            <div className="text-4xl font-bold text-white">{stats.late}</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="text-purple-200 mt-4">{t('የተግባር ሪፖርቶች በመጫን ላይ...', 'Loading action reports...')}</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="glass rounded-3xl shadow-2xl p-16 text-center backdrop-blur-xl border border-white/20 animate-fade-in">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <Target size={48} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">{t('ምንም የተግባር ሪፖርቶች የሉም', 'No Action Reports Available')}</h3>
            <p className="text-purple-200 max-w-md mx-auto">
              {reports.length === 0 
                ? t('የተግባር ሪፖርቶች የሚታዩት በዋና ቅርንጫፍ ተግባራት ከተፈጠሩ በኋላ ነው', 'Action reports will appear once the main branch creates actions for annual plans')
                : t('በተመረጠው ወር ምንም ሪፖርቶች የሉም', 'No reports found for the selected period')
              }
            </p>
          </div>
        ) : (
          <div className="glass rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl border border-white/20 animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('ተግባር', 'Action')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('ጊዜ', 'Period')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('እቅድ #', 'Plan #')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('የእቅድ እንቅስቃሴ', 'Plan Activity')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('ትክክለኛ', 'Actual')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('የትግበራ መቶኛ', 'Implementation %')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('የመጨረሻ ቀን', 'Deadline')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('ሁኔታ', 'Status')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('ተግባር', 'Action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 text-sm text-white max-w-xs">
                        <div className="font-medium mb-1">{t('ተግባር', 'Action')} {report.action_number}</div>
                        <div className="text-purple-200 text-xs line-clamp-2">{report.action_title}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-purple-200">
                        {getEthiopianMonthName(report.month, language === 'am' ? 'amharic' : 'english')} {report.year}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-300 font-semibold">
                        {report.plan_number?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-green-300 font-semibold">
                        {report.plan_activity?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-cyan-300 font-semibold">
                        {report.actual_activity?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 bg-white/10 rounded-full h-2 min-w-[80px]">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(report.implementation_percentage || 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-white min-w-[45px]">
                            {(Number(report.implementation_percentage) || 0).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-purple-200">
                        {formatEthiopianDeadline(report.deadline, report.month, language === 'am' ? 'amharic' : 'english')}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(report.status)}</td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/submit-action/${report.id}`}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-semibold rounded-lg transition transform hover:scale-105"
                      >
                        {report.status === 'pending' ? t('አስገባ', 'Submit') : t('ይመልከቱ/አርትዕ', 'View/Edit')}
                      </Link>
                      <button
                        onClick={() => openAttachmentModal(report)}
                        className="inline-flex items-center gap-2 ml-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition border border-white/20"
                        title={t('የተሳካ አገናኝ ያክሉ', 'Attach Achievement Link')}
                      >
                        <LinkIcon size={14} />
                        {t('አገናኝ ያክሉ', 'Attach Link')}
                      </button>
                    </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {attachmentModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/20 max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2 text-white font-semibold">
                <LinkIcon size={16} />
                {t('የተሳካ አገናኝ ያክሉ', 'Attach Achievement Link')}
              </div>
              <button onClick={() => setAttachmentModal({ open: false, report: null, title: '', url: '' })} className="p-1 hover:bg-white/10 rounded-lg transition">
                <X size={16} className="text-purple-200" />
              </button>
            </div>
            <form onSubmit={submitAttachment} className="p-4 space-y-3">
              <input
                type="text"
                value={attachmentModal.title}
                onChange={(e) => setAttachmentModal({ ...attachmentModal, title: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                placeholder={t('ርዕስ (ለምሳሌ፣ ፎቶዎች፣ ሪፖርት PDF)', 'Title (e.g., Photos, Report PDF)')}
              />
              <input
                type="url"
                value={attachmentModal.url}
                onChange={(e) => setAttachmentModal({ ...attachmentModal, url: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                placeholder="https://..."
                required
              />
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={attaching || !attachmentModal.url} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
                  {attaching ? t('በመጨመር ላይ...', 'Attaching...') : t('አክል', 'Attach')}
                </button>
                <button type="button" onClick={() => setAttachmentModal({ open: false, report: null, title: '', url: '' })} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-lg transition border border-white/20">{t('ሰርዝ', 'Cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActionReports;
