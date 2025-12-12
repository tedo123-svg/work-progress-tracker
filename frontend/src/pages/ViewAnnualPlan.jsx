import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { annualPlanAPI, actionAPI, attachmentsAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { ArrowLeft, Plus, Download, ChevronDown, FileText, Eye, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { getEthiopianMonthName, formatEthiopianDeadline, getCurrentEthiopianDate } from '../utils/ethiopianCalendar';
import { exportActionReportsToPDF, exportActionReportsToExcel, exportActionReportsToWord } from '../utils/exportReports';

function ViewAnnualPlan({ user, onLogout }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language, t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState([]);
  const [attachments, setAttachments] = useState({});
  const [actionReports, setActionReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchPlanDetails();
    fetchActions();
    if (user?.role === 'main_branch') {
      fetchActionReports();
    }
    // Set current Ethiopian month and year for export
    const currentDate = getCurrentEthiopianDate();
    setSelectedMonth(currentDate.month);
    setSelectedYear(currentDate.year);
  }, [id, user]);

  const fetchPlanDetails = async () => {
    try {
      const response = await annualPlanAPI.getById(id);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch plan details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActions = async () => {
    try {
      const res = await actionAPI.getByPlan(id);
      setActions(res.data || []);
      // Load attachments per action (optional)
      const map = {};
      for (const a of res.data || []) {
        try {
          const attRes = await attachmentsAPI.list('action', a.id);
          map[a.id] = attRes.data || [];
        } catch {}
      }
      setAttachments(map);
    } catch (error) {
      console.error('Failed to fetch actions:', error);
    }
  };

  const fetchActionReports = async () => {
    setLoadingReports(true);
    try {
      const response = await actionAPI.getAllReports(id);
      setActionReports(response.data || []);
    } catch (error) {
      console.error('Failed to fetch action reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleExport = (format) => {
    try {
      if (actionReports.length === 0) {
        alert(t('ምንም ሪፖርቶች የሉም', 'No reports to export'));
        return;
      }

      const month = selectedMonth || getCurrentEthiopianDate().month;
      const year = selectedYear || getCurrentEthiopianDate().year;

      // Filter reports by selected period if specified
      const reportsToExport = selectedMonth && selectedYear 
        ? actionReports.filter(r => r.month === selectedMonth && r.year === selectedYear)
        : actionReports;

      if (reportsToExport.length === 0) {
        alert(t('በተመረጠው ወር ምንም ሪፖርቶች የሉም', 'No reports found for the selected period'));
        return;
      }

      switch (format) {
        case 'pdf':
          exportActionReportsToPDF(reportsToExport, month, year, language);
          break;
        case 'excel':
          exportActionReportsToExcel(reportsToExport, month, year, language);
          break;
        case 'word':
          exportActionReportsToWord(reportsToExport, month, year, language);
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

  // Get unique months and years from action reports for filtering
  const availablePeriods = [...new Set(actionReports.map(r => `${r.month}-${r.year}`))].map(period => {
    const [month, year] = period.split('-');
    return { month: parseInt(month), year: parseInt(year) };
  });

  // Filter action reports by selected period
  const filteredActionReports = selectedMonth && selectedYear 
    ? actionReports.filter(r => r.month === selectedMonth && r.year === selectedYear)
    : actionReports;

  // Group action reports by action for better display
  const groupedActionReports = {};
  filteredActionReports.forEach(report => {
    const actionKey = `${report.action_number}`;
    if (!groupedActionReports[actionKey]) {
      groupedActionReports[actionKey] = {
        action_number: report.action_number,
        action_title: report.action_title,
        plan_activity: report.plan_activity,
        reports: []
      };
    }
    groupedActionReports[actionKey].reports.push(report);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="container mx-auto px-4 py-8 text-center">{t('በመጫን ላይ...', 'Loading...')}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="container mx-auto px-4 py-8 text-center">{t('እቅድ አልተገኘም', 'Plan not found')}</div>
      </div>
    );
  }

  const { plan, monthlyPeriods, quarterlyData } = data;

  const monthlyChartData = monthlyPeriods.map(period => ({
    month: getEthiopianMonthName(period.month, language === 'am' ? 'amharic' : 'english'),
    target: parseFloat(period.target_amount),
  }));

  const quarterlyChartData = quarterlyData.map(q => ({
    quarter: `Q${q.quarter}`,
    achieved: parseFloat(q.total_achieved_amount || 0),
    progress: parseFloat(q.progress_percentage || 0),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-purple-300 hover:text-white transition group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>{t('ወደ ዳሽቦርድ ተመለስ', 'Back to Dashboard')}</span>
          </button>
          
          {user.role === 'main_branch' && (
            <Link
              to={`/create-actions/${id}`}
              className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl transition transform hover:scale-105 shadow-lg font-semibold"
            >
              <Plus size={20} />
              <span>{t('ተግባራት ፍጠር', 'Create Actions')}</span>
            </Link>
          )}
        </div>

        <div className="glass rounded-2xl shadow-2xl p-8 backdrop-blur-xl border border-white/20 mb-6 animate-slide-in">
          <h1 className="text-4xl font-bold text-white mb-2">{plan.title}</h1>
          <p className="text-purple-200 mb-6">{plan.description}</p>

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">{t('ዓመት', 'Year')}</div>
              <div className="text-2xl font-bold text-blue-600">{plan.year}</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">{t('ዒላማ ቁጥር', 'Target Number')}</div>
              <div className="text-2xl font-bold text-green-600">
                {plan.target_amount?.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">{t('አጠቃላይ እድገት', 'Overall Progress')}</div>
              <div className="text-2xl font-bold text-orange-600">
                {(Number(plan.progress_percentage) || 0).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="glass rounded-2xl shadow-2xl backdrop-blur-xl border border-white/20 mb-6 animate-slide-in">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-semibold transition ${
                activeTab === 'overview'
                  ? 'text-white border-b-2 border-purple-400 bg-white/5'
                  : 'text-purple-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 size={20} />
                {t('አጠቃላይ እይታ', 'Overview')}
              </div>
            </button>
            {user?.role === 'main_branch' && actions.length > 0 && (
              <button
                onClick={() => setActiveTab('action-reports')}
                className={`px-6 py-4 font-semibold transition ${
                  activeTab === 'action-reports'
                    ? 'text-white border-b-2 border-purple-400 bg-white/5'
                    : 'text-purple-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText size={20} />
                  {t('የተግባር ሪፖርቶች', 'Action Reports')}
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('ወርሃዊ ዒላማዎች', 'Monthly Targets')}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString()} />
                <Bar dataKey="target" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('ሩብ ዓመታዊ እድገት', 'Quarterly Progress')}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={quarterlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="achieved" stroke="#10b981" name={t('የተሳካ', 'Achieved')} />
                <Line type="monotone" dataKey="progress" stroke="#f59e0b" name={t('እድገት (%)', 'Progress (%)')} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">{t('ወርሃዊ ክፍፍል', 'Monthly Breakdown')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('ወር', 'Month')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('ዒላማ ቁጥር', 'Target Number')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('የመጨረሻ ቀን', 'Deadline')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {monthlyPeriods.map((period) => (
                  <tr key={period.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {getEthiopianMonthName(period.month, language === 'am' ? 'amharic' : 'english')} {period.year}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {period.target_amount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatEthiopianDeadline(period.deadline, period.month, language === 'am' ? 'amharic' : 'english')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions Created for this Plan */}
        <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold">{t('ተግባራት', 'Actions')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('ርዕስ', 'Title')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('የእቅድ እንቅስቃሴ', 'Plan Activity')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('ድህረ ገጽ አባሪዎች', 'Attachments')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(actions || []).map(a => (
                  <tr key={a.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.action_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-lg">{a.action_title}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{a.plan_activity?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-blue-600">
                      {(attachments[a.id] || []).length === 0 ? (
                        <span className="text-gray-400">{t('አልተገኙም', 'None')}</span>
                      ) : (
                        <ul className="list-disc list-inside space-y-1">
                          {attachments[a.id].map(att => (
                            <li key={att.id}><a href={att.url} target="_blank" rel="noreferrer" className="underline">{att.title}</a></li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}

        {/* Action Reports Tab */}
        {activeTab === 'action-reports' && user?.role === 'main_branch' && (
          <div className="space-y-6">
            {/* Export Controls */}
            <div className="glass rounded-2xl shadow-2xl backdrop-blur-xl border border-white/20 p-6 animate-slide-in">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{t('የተግባር ሪፖርቶች', 'Action Reports')}</h2>
                  <p className="text-purple-200">{t('ሁሉም ቅርንጫፎች የተላኩ የተግባር ሪፖርቶች', 'All action reports submitted by branches')}</p>
                </div>
                
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
                      disabled={actionReports.length === 0}
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

            {/* Action Reports Content */}
            {loadingReports ? (
              <div className="glass rounded-2xl shadow-2xl backdrop-blur-xl border border-white/20 p-16 text-center animate-slide-in">
                <div className="inline-block w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                <p className="text-purple-200 mt-4">{t('የተግባር ሪፖርቶች በመጫን ላይ...', 'Loading action reports...')}</p>
              </div>
            ) : Object.keys(groupedActionReports).length === 0 ? (
              <div className="glass rounded-2xl shadow-2xl backdrop-blur-xl border border-white/20 p-16 text-center animate-slide-in">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <FileText size={48} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{t('ምንም የተግባር ሪፖርቶች የሉም', 'No Action Reports Available')}</h3>
                <p className="text-purple-200 max-w-md mx-auto">
                  {actionReports.length === 0 
                    ? t('የተግባር ሪፖርቶች የሚታዩት ቅርንጫፎች ሪፖርት ካስገቡ በኋላ ነው', 'Action reports will appear once branches submit their reports')
                    : t('በተመረጠው ወር ምንም ሪፖርቶች የሉም', 'No reports found for the selected period')
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.values(groupedActionReports).map((actionGroup, index) => (
                  <div key={actionGroup.action_number} className="glass rounded-2xl shadow-2xl backdrop-blur-xl border border-white/20 animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    {/* Action Header */}
                    <div className="p-6 border-b border-white/10">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">
                            {t('ተግባር', 'Action')} {actionGroup.action_number}: {actionGroup.action_title}
                          </h3>
                          <div className="flex flex-wrap gap-4 text-sm text-purple-200">
                            <span>{t('ዒላማ', 'Target')}: {(actionGroup.plan_activity || 0).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-purple-300">{t('ሪፖርቶች', 'Reports')}</div>
                          <div className="text-2xl font-bold text-white">{actionGroup.reports.length}</div>
                        </div>
                      </div>
                    </div>

                    {/* Reports Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-white/5 border-b border-white/10">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('ቅርንጫፍ', 'Branch')}</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('ወር', 'Month')}</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('እቅድ', 'Plan')}</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('ተግባር', 'Achievement')}</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('ትግበራ %', 'Implementation %')}</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('ሁኔታ', 'Status')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {actionGroup.reports.map((report) => (
                            <tr key={`${report.id}-${report.branch_user_id}`} className="hover:bg-white/5 transition">
                              <td className="px-6 py-4 text-sm text-white font-medium">{report.branch_name}</td>
                              <td className="px-6 py-4 text-sm text-purple-200">
                                {getEthiopianMonthName(report.month, language === 'am' ? 'amharic' : 'english')} {report.year}
                              </td>
                              <td className="px-6 py-4 text-sm text-blue-300 font-semibold">
                                {(Number(report.plan_activity) || 0).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-sm text-green-300 font-semibold">
                                {(Number(report.actual_activity) || 0).toLocaleString()}
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
                              <td className="px-6 py-4">
                                <span className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold border backdrop-blur-sm ${
                                  report.status === 'submitted' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                                  report.status === 'late' ? 'bg-red-500/20 text-red-300 border-red-400/30' :
                                  'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
                                }`}>
                                  <span className="capitalize">
                                    {report.status === 'submitted' ? t('ገብቷል', 'Submitted') :
                                     report.status === 'late' ? t('ዘግይቷል', 'Late') :
                                     t('በመጠባበቅ ላይ', 'Pending')}
                                  </span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Action Summary */}
                    <div className="p-6 border-t border-white/10 bg-white/5">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-sm text-purple-300">{t('ጠቅላላ እቅድ', 'Total Plan')}</div>
                          <div className="text-lg font-bold text-white">
                            {actionGroup.reports.reduce((sum, r) => sum + (Number(r.plan_activity) || 0), 0).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-purple-300">{t('ጠቅላላ ተግባር', 'Total Achievement')}</div>
                          <div className="text-lg font-bold text-white">
                            {actionGroup.reports.reduce((sum, r) => sum + (Number(r.actual_activity) || 0), 0).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-purple-300">{t('አማካይ ትግበራ', 'Average Implementation')}</div>
                          <div className="text-lg font-bold text-white">
                            {actionGroup.reports.length > 0 
                              ? (actionGroup.reports.reduce((sum, r) => sum + (Number(r.implementation_percentage) || 0), 0) / actionGroup.reports.length).toFixed(1)
                              : 0}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-purple-300">{t('የገቡ ሪፖርቶች', 'Submitted Reports')}</div>
                          <div className="text-lg font-bold text-white">
                            {actionGroup.reports.filter(r => r.status === 'submitted' || r.status === 'late').length}/{actionGroup.reports.length}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewAnnualPlan;
