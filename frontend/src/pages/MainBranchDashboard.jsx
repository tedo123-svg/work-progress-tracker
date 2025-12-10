import { useState, useEffect } from 'react';
import { monthlyPlanAPI, reportAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { Calendar, TrendingUp, Users, Sparkles, Target, Edit, RefreshCw, BarChart3, Download, Award, FileText } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getEthiopianMonthName, formatEthiopianDeadline, getDaysUntilDeadline } from '../utils/ethiopianCalendar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { calculateGrade, getGradeDescription } from '../utils/grading';
import { exportToPDF, exportToExcel, exportToWord } from '../utils/exportReports';

function MainBranchDashboard({ user, onLogout }) {
  const { t, language } = useLanguage();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newTarget, setNewTarget] = useState('');
  const [updating, setUpdating] = useState(false);
  const [allReports, setAllReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    fetchCurrentPlan();
    fetchAllReports();
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

  const fetchAllReports = async () => {
    setLoadingReports(true);
    try {
      const response = await reportAPI.getAllCurrentMonthReports();
      setAllReports(response.data);
    } catch (error) {
      console.error('Failed to fetch all reports:', error);
    } finally {
      setLoadingReports(false);
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

  const handleExport = async (format) => {
    try {
      const reportsToExport = selectedBranches.length > 0
        ? allReports.filter(r => selectedBranches.includes(r.branch_name))
        : allReports;
      
      console.log('Exporting reports:', { format, count: reportsToExport.length, reports: reportsToExport });
      
      if (reportsToExport.length === 0) {
        alert(t('ምንም ሪፖርቶች የሉም', 'No reports to export'));
        return;
      }
      
      const month = currentPlan?.month || 6;
      const year = currentPlan?.year || 2018;
      
      console.log('Export params:', { month, year, language });
      
      if (format === 'pdf') {
        exportToPDF(reportsToExport, month, year, language);
      } else if (format === 'excel') {
        exportToExcel(reportsToExport, month, year, language);
      } else if (format === 'word') {
        await exportToWord(reportsToExport, month, year, language);
      }
      
      setShowExportMenu(false);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error.message}`);
    }
  };

  const toggleBranchSelection = (branchName) => {
    setSelectedBranches(prev =>
      prev.includes(branchName)
        ? prev.filter(b => b !== branchName)
        : [...prev, branchName]
    );
  };

  const selectAllBranches = () => {
    if (selectedBranches.length === allReports.length) {
      setSelectedBranches([]);
    } else {
      setSelectedBranches(allReports.map(r => r.branch_name));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
      submitted: 'bg-green-500/20 text-green-300 border-green-400/30',
      late: 'bg-red-500/20 text-red-300 border-red-400/30',
    };
    
    const statusText = {
      pending: t('በመጠባበቅ ላይ', 'Pending'),
      submitted: t('ገብቷል', 'Submitted'),
      late: t('ዘግይቷል', 'Late'),
    };
    
    return (
      <span className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold border backdrop-blur-sm ${styles[status]}`}>
        <span>{statusText[status]}</span>
      </span>
    );
  };

  // Prepare chart data
  const chartData = allReports.map(report => ({
    name: report.branch_name,
    progress: Number(report.progress_percentage) || 0,
    achieved: report.achieved_amount || 0,
    target: report.target_amount || 0
  })).sort((a, b) => b.progress - a.progress);

  const gradeDistribution = allReports.reduce((acc, report) => {
    const gradeInfo = calculateGrade(report.progress_percentage || 0);
    acc[gradeInfo.grade] = (acc[gradeInfo.grade] || 0) + 1;
    return acc;
  }, {});

  const gradeChartData = Object.entries(gradeDistribution).map(([grade, count]) => ({
    name: grade,
    value: count
  }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

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
                    {formatEthiopianDeadline(currentPlan.deadline, currentPlan.month, language === 'am' ? 'amharic' : 'english')}
                  </div>
                  <div className="text-xs text-blue-200 mt-1">
                    {getDaysUntilDeadline(currentPlan.deadline, currentPlan.month) > 0 
                      ? `${getDaysUntilDeadline(currentPlan.deadline, currentPlan.month)} ${t('ቀናት ቀርተዋል', 'days left')}`
                      : t('ጊዜው አልፏል', 'Deadline passed')}
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

            {/* Performance Summary Section */}
            {allReports.length > 0 && (
              <div className="glass rounded-2xl shadow-xl p-6 backdrop-blur-xl border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <BarChart3 size={28} />
                    {t('የአፈጻጸም ማጠቃለያ', 'Performance Summary')}
                  </h2>
                  <div className="relative z-50">
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg transition text-white text-sm font-semibold shadow-lg"
                    >
                      <Download size={16} />
                      {t('ሪፖርት አውርድ', 'Export Report')}
                    </button>
                    
                    {showExportMenu && (
                      <>
                        {/* Backdrop to close menu when clicking outside */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowExportMenu(false)}
                        />
                        <div className="absolute right-0 mt-2 w-56 glass rounded-xl shadow-2xl border border-white/20 overflow-hidden z-50 bg-slate-800/95 backdrop-blur-xl">
                          <button
                            onClick={() => handleExport('pdf')}
                            className="w-full px-4 py-3 text-left text-white hover:bg-white/20 transition flex items-center gap-2 font-medium"
                          >
                            <FileText size={16} />
                            {t('PDF ውጣ', 'Export as PDF')}
                          </button>
                          <button
                            onClick={() => handleExport('excel')}
                            className="w-full px-4 py-3 text-left text-white hover:bg-white/20 transition flex items-center gap-2 font-medium"
                          >
                            <FileText size={16} />
                            {t('Excel ውጣ', 'Export as Excel')}
                          </button>
                          <button
                            onClick={() => handleExport('word')}
                            className="w-full px-4 py-3 text-left text-white hover:bg-white/20 transition flex items-center gap-2 font-medium"
                          >
                            <FileText size={16} />
                            {t('Word ውጣ', 'Export as Word')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Branch Performance Chart */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">{t('የቅርንጫፍ እድገት ንፅፅር', 'Branch Progress Comparison')}</h3>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                        <XAxis dataKey="name" stroke="#a78bfa" angle={-45} textAnchor="end" height={100} />
                        <YAxis stroke="#a78bfa" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid #a78bfa', borderRadius: '8px' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Legend />
                        <Bar dataKey="progress" fill="#8b5cf6" name={t('እድገት %', 'Progress %')} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Grade Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">{t('የደረጃ ስርጭት', 'Grade Distribution')}</h3>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={gradeChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {gradeChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid #a78bfa', borderRadius: '8px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Branch Grades */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">{t('የቅርንጫፍ ደረጃዎች', 'Branch Grades')}</h3>
                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                      {chartData.map((branch, index) => {
                        const gradeInfo = calculateGrade(branch.progress);
                        return (
                          <div key={`${branch.name}-${index}`} className={`${gradeInfo.bgColor} border ${gradeInfo.borderColor} rounded-lg p-3 flex items-center justify-between`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 ${gradeInfo.bgColor} border-2 ${gradeInfo.borderColor} rounded-lg flex items-center justify-center`}>
                                <span className={`text-xl font-bold ${gradeInfo.color}`}>{gradeInfo.grade}</span>
                              </div>
                              <div>
                                <div className="text-white font-semibold">{branch.name}</div>
                                <div className="text-xs text-gray-300">{getGradeDescription(gradeInfo.grade, language)}</div>
                              </div>
                            </div>
                            <div className={`text-2xl font-bold ${gradeInfo.color}`}>
                              {(Number(branch.progress) || 0).toFixed(1)}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Top Performers */}
                <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-xl p-5">
                  <h3 className="font-semibold text-yellow-200 mb-3 flex items-center gap-2">
                    <Award size={20} />
                    {t('ምርጥ አፈጻጸም ያላቸው', 'Top Performers')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {chartData.slice(0, 3).map((branch, index) => (
                      <div key={`${branch.name}-${index}`} className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            index === 0 ? 'bg-yellow-500 text-yellow-900' :
                            index === 1 ? 'bg-gray-400 text-gray-900' :
                            'bg-orange-600 text-orange-100'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="text-white font-semibold">{branch.name}</span>
                        </div>
                        <div className="text-2xl font-bold text-yellow-300">{(Number(branch.progress) || 0).toFixed(1)}%</div>
                        <div className="text-sm text-yellow-100 mt-1">
                          {branch.achieved.toLocaleString()} / {branch.target.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* All Branch Reports - Month 6 Only */}
            <div className="glass rounded-2xl shadow-xl backdrop-blur-xl border border-white/20">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users size={24} />
                    {t('የሁሉም ቅርንጫፎች ሪፖርቶች - ወር 6', 'All Branch Reports - Month 6')}
                  </h2>
                  {selectedBranches.length > 0 && (
                    <p className="text-sm text-purple-300 mt-1">
                      {selectedBranches.length} {t('ቅርንጫፎች ተመርጠዋል', 'branches selected')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllBranches}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-white text-sm"
                  >
                    {selectedBranches.length === allReports.length ? t('ሁሉንም አትመርጥ', 'Deselect All') : t('ሁሉንም ምረጥ', 'Select All')}
                  </button>
                  <button
                    onClick={fetchAllReports}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-white text-sm"
                  >
                    <RefreshCw size={16} />
                    {t('አድስ', 'Refresh')}
                  </button>
                </div>
              </div>
              
              {loadingReports ? (
                <div className="text-center py-12">
                  <div className="inline-block w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                  <p className="text-purple-200 mt-4">{t('ሪፖርቶች በመጫን ላይ...', 'Loading reports...')}</p>
                </div>
              ) : allReports.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-purple-200">{t('ምንም ሪፖርቶች የሉም', 'No reports available')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider w-12"></th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('ቅርንጫፍ', 'Branch')}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('ዒላማ', 'Target')}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('የተሳካ', 'Achieved')}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('እድገት', 'Progress')}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('ደረጃ', 'Grade')}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('ሁኔታ', 'Status')}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">{t('የገባበት ቀን', 'Submitted')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {allReports.map((report) => {
                        const gradeInfo = calculateGrade(report.progress_percentage || 0);
                        return (
                        <tr key={report.id} className="hover:bg-white/5 transition">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedBranches.includes(report.branch_name)}
                              onChange={() => toggleBranchSelection(report.branch_name)}
                              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                          </td>
                          <td className="px-6 py-4 text-sm text-white font-medium">{report.branch_name}</td>
                          <td className="px-6 py-4 text-sm text-green-300 font-semibold">
                            {report.target_amount?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-blue-300 font-semibold">
                            {report.achieved_amount?.toLocaleString() || '0'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center space-x-3">
                              <div className="flex-1 bg-white/10 rounded-full h-2 min-w-[80px]">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(report.progress_percentage || 0, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-white min-w-[45px]">
                                {(Number(report.progress_percentage) || 0).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`${gradeInfo.bgColor} border ${gradeInfo.borderColor} rounded-lg px-3 py-1 inline-flex items-center gap-2`}>
                              <span className={`text-lg font-bold ${gradeInfo.color}`}>{gradeInfo.grade}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(report.status)}</td>
                          <td className="px-6 py-4 text-sm text-purple-200">
                            {report.submitted_at ? new Date(report.submitted_at).toLocaleString() : '-'}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
