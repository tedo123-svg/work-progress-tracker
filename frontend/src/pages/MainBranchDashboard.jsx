import React, { useState, useEffect, useMemo } from 'react';
import { monthlyPlanAPI, reportAPI, annualPlanAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Calendar, TrendingUp, Users, Sparkles, Target, RefreshCw, BarChart3, Download, Award, FileText } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getEthiopianMonthName, formatEthiopianDeadline, getDaysUntilDeadline, getCurrentEthiopianDate } from '../utils/ethiopianCalendar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { calculateGrade, getGradeDescription } from '../utils/grading';
import { exportToPDF, exportToExcel, exportToWord } from '../utils/exportReports';

function MainBranchDashboard({ user, onLogout }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  // Version identifier for deployment tracking
  console.log('MainBranchDashboard v2.1 - Reports Error Fix');
  const [currentPlan, setCurrentPlan] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [allReports, setAllReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    fetchCurrentPlan();
    fetchAllReports();
  }, []);

  const fetchCurrentPlan = async () => {
    try {
      const planResponse = await monthlyPlanAPI.getCurrent();
      setCurrentPlan(planResponse.data);
      
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
      console.log('=== FRONTEND: Fetching Amharic activity reports (v3) ===');
      const response = await annualPlanAPI.getAllAmharicActivityReports();
      console.log('=== FRONTEND: Response received ===');
      
      // Ensure response and response.data exist
      if (!response || !response.data) {
        console.warn('Invalid API response:', response);
        setAllReports([]);
        return;
      }
      
      console.log('Total activity reports received:', response.data.length);
      console.log('Raw response data:', response.data);
      
      // Ensure response.data is an array
      const responseData = Array.isArray(response.data) ? response.data : [];
      
      // Validate the response data structure
      const validatedReports = responseData.map((report, index) => {
        if (!report || typeof report !== 'object') {
          console.warn(`Report at index ${index} is null/undefined/invalid:`, report);
          return null;
        }
        
        // Ensure required fields exist
        const safeReport = {
          branch_name: report.branch_name || `Branch ${index + 1}`,
          username: report.username || 'Unknown User',
          plan_title: report.plan_title || 'Unknown Plan',
          plan_title_amharic: report.plan_title_amharic || '',
          activities: []
        };
        
        if (!report.activities) {
          console.warn(`Report at index ${index} missing activities:`, report);
          return safeReport;
        }
        
        if (!Array.isArray(report.activities)) {
          console.warn(`Report at index ${index} activities is not an array:`, report.activities);
          return safeReport;
        }
        
        // Validate each activity
        safeReport.activities = report.activities.map((activity, actIndex) => {
          if (!activity || typeof activity !== 'object') {
            console.warn(`Activity at index ${actIndex} is invalid:`, activity);
            return null;
          }
          
          return {
            activity_number: activity.activity_number || `${actIndex + 1}`,
            activity_title_amharic: activity.activity_title_amharic || '',
            target_number: Number(activity.target_number) || 0,
            target_unit_amharic: activity.target_unit_amharic || '',
            achieved_number: Number(activity.achieved_number) || 0,
            achievement_percentage: Number(activity.achievement_percentage) || 0,
            status: activity.status || 'pending',
            notes_amharic: activity.notes_amharic || '',
            submitted_at: activity.submitted_at || null
          };
        }).filter(Boolean); // Remove null activities
        
        return safeReport;
      }).filter(Boolean); // Remove null entries
      
      console.log('Validated reports:', validatedReports.length);
      console.log('=== END FRONTEND DEBUG ===');
      setAllReports(validatedReports || []);
    } catch (error) {
      console.error('Failed to fetch Amharic activity reports:', error);
      console.error('Error details:', error.response?.data || error.message);
      setAllReports([]); // Set empty array on error
    } finally {
      setLoadingReports(false);
    }
  };



  const handleExport = async (format) => {
    try {
      console.log('Exporting reports:', { format, count: allReports?.length || 0, reportsType: typeof allReports });
      
      if (!allReports || !Array.isArray(allReports) || allReports.length === 0) {
        alert(t('ምንም ሪፖርቶች የሉም', 'No reports to export'));
        return;
      }
      
      const month = new Date().getMonth() + 1; // Current month
      const year = currentPlan?.year || 2018;
      
      console.log('Export params:', { month, year, language });
      
      // Flatten the grouped data for export with enhanced safety
      const flattenedReports = [];
      
      allReports.forEach((branchReport, branchIndex) => {
        if (!branchReport || typeof branchReport !== 'object') {
          console.warn(`Invalid branchReport at index ${branchIndex}:`, branchReport);
          return;
        }
        
        if (!branchReport.activities || !Array.isArray(branchReport.activities)) {
          console.warn(`Invalid branchReport activities at index ${branchIndex}:`, branchReport);
          return;
        }
        
        branchReport.activities.forEach((activity, actIndex) => {
          if (!activity || typeof activity !== 'object') {
            console.warn(`Invalid activity at index ${actIndex} for branch ${branchIndex}:`, activity);
            return;
          }
          
          flattenedReports.push({
            branch_name: branchReport.branch_name || 'Unknown Branch',
            plan_title: branchReport.plan_title || 'Unknown Plan',
            plan_title_amharic: branchReport.plan_title_amharic || '',
            activity_number: activity.activity_number || '',
            activity_title_amharic: activity.activity_title_amharic || '',
            target_number: Number(activity.target_number) || 0,
            target_unit_amharic: activity.target_unit_amharic || '',
            achieved_number: Number(activity.achieved_number) || 0,
            achievement_percentage: Number(activity.achievement_percentage) || 0,
            status: activity.status || 'pending'
          });
        });
      });
      
      if (flattenedReports.length === 0) {
        alert(t('ምንም ሪፖርቶች የሉም', 'No valid reports to export'));
        return;
      }
      
      console.log('Flattened reports for export:', flattenedReports.length);
      
      if (format === 'pdf') {
        exportToPDF(flattenedReports, month, year, language);
      } else if (format === 'excel') {
        exportToExcel(flattenedReports, month, year, language);
      } else if (format === 'word') {
        await exportToWord(flattenedReports, month, year, language);
      }
      
      setShowExportMenu(false);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error.message}`);
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

  // Prepare chart data for grouped Amharic activity reports
  const chartData = useMemo(() => {
    try {
      if (!allReports || !Array.isArray(allReports)) {
        console.warn('allReports is not an array:', allReports);
        return [];
      }
      
      const processedData = allReports.map((branchReport, index) => {
        if (!branchReport || typeof branchReport !== 'object') {
          console.warn(`Invalid branchReport at index ${index}:`, branchReport);
          return {
            name: `Branch ${index + 1}`,
            progress: 0,
            achieved: 0,
            target: 0
          };
        }
        
        const safeBranchName = branchReport.branch_name || `Branch ${index + 1}`;
        
        if (!branchReport.activities || !Array.isArray(branchReport.activities)) {
          console.warn(`Invalid branchReport activities at index ${index}:`, branchReport);
          return {
            name: safeBranchName,
            progress: 0,
            achieved: 0,
            target: 0
          };
        }
        
        let totalAchieved = 0;
        let totalTarget = 0;
        
        branchReport.activities.forEach((activity, actIndex) => {
          if (activity && typeof activity === 'object') {
            totalAchieved += Number(activity.achieved_number) || 0;
            totalTarget += Number(activity.target_number) || 0;
          } else {
            console.warn(`Invalid activity at index ${actIndex} for branch ${safeBranchName}:`, activity);
          }
        });
        
        const progress = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;
        
        return {
          name: safeBranchName,
          progress: Math.max(0, Math.min(100, progress)), // Clamp between 0-100
          achieved: totalAchieved,
          target: totalTarget
        };
      });
      
      return processedData.sort((a, b) => (b.progress || 0) - (a.progress || 0));
    } catch (error) {
      console.error('Error processing chart data:', error);
      return [];
    }
  }, [allReports]);

  const gradeDistribution = chartData.reduce((acc, branch) => {
    const gradeInfo = calculateGrade(branch.progress);
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
            {user.role === 'main_branch' && (
              <>
                <button
                  onClick={() => navigate('/create-amharic-plan')}
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl transition transform hover:scale-105 shadow-lg"
                >
                  <FileText size={20} />
                  <span className="font-semibold">{t('የአማርኛ እቅድ ፍጠር', 'Create Amharic Plan')}</span>
                </button>
                
                <button
                  onClick={() => navigate('/manage-amharic-plans')}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl transition transform hover:scale-105 shadow-lg"
                >
                  <FileText size={20} />
                  <span className="font-semibold">{t('እቅዶች አስተዳደር', 'Manage Plans')}</span>
                </button>
              </>
            )}
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

            {/* Tahsas Month Branch Reports */}
            <div className="glass rounded-2xl shadow-xl backdrop-blur-xl border border-white/20">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users size={24} />
                    {t('የአሁኑ ወር ሪፖርቶች', 'Current Month Reports')}
                  </h2>
                  <p className="text-sm text-purple-300 mt-1">
                    {t('የአሁኑ ወር የቅርንጫፍ ሪፖርቶች', 'Branch reports for current month')}
                  </p>
                </div>
                <button
                  onClick={fetchAllReports}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-white text-sm"
                >
                  <RefreshCw size={16} />
                  {t('አድስ', 'Refresh')}
                </button>
              </div>
              
              {loadingReports ? (
                <div className="text-center py-12">
                  <div className="inline-block w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                  <p className="text-purple-200 mt-4">{t('ሪፖርቶች በመጫን ላይ...', 'Loading reports...')}</p>
                </div>
              ) : allReports.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Calendar size={32} className="text-white" />
                  </div>
                  <p className="text-white font-semibold mb-2">{t('የአሁኑ ወር ሪፖርቶች የሉም', 'No Current Month Reports')}</p>
                  <p className="text-purple-200 text-sm">
                    {t('የአሁኑ ወር ሪፖርቶች አልተገኙም', 'No current month reports found')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 p-6">
                  {allReports.map((branchReport, index) => {
                    if (!branchReport.activities || !Array.isArray(branchReport.activities)) {
                      console.warn('Invalid branchReport structure in render:', branchReport);
                      return null;
                    }
                    
                    return (
                    <div key={`${branchReport.branch_name}-${index}`} className="bg-white/5 rounded-xl p-5 border border-white/10">
                      {/* Branch Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center font-bold text-white text-lg">
                            {branchReport.branch_name?.charAt(branchReport.branch_name.length - 1) || '?'}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{branchReport.branch_name || 'Unknown Branch'}</h3>
                            <p className="text-sm text-purple-200" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                              {branchReport.plan_title_amharic || branchReport.plan_title || 'No Plan Title'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Activities Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {branchReport.activities.map((activity, actIndex) => {
                          const progressPercentage = activity.target_number > 0 ? 
                            Math.round((activity.achieved_number / activity.target_number) * 100) : 0;
                          
                          return (
                            <div key={`${activity.activity_number}-${actIndex}`} 
                                 className="bg-white/5 rounded-lg p-4 border border-white/10">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-sm bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                                  {activity.activity_number}
                                </span>
                                <span className={`text-xs font-semibold ${
                                  progressPercentage >= 100 ? 'text-green-300' :
                                  progressPercentage >= 75 ? 'text-yellow-300' : 'text-red-300'
                                }`}>
                                  {progressPercentage}%
                                </span>
                              </div>
                              
                              <div className="text-sm text-white mb-2">
                                <span className="text-green-300 font-semibold">
                                  {activity.achieved_number?.toLocaleString()}
                                </span>
                                <span className="text-purple-200 mx-1">/</span>
                                <span className="text-blue-300">
                                  {activity.target_number?.toLocaleString()}
                                </span>
                                <span className="text-purple-200 text-xs ml-1">
                                  {activity.target_unit_amharic}
                                </span>
                              </div>

                              <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    progressPercentage >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                    progressPercentage >= 75 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                    'bg-gradient-to-r from-red-500 to-pink-500'
                                  }`}
                                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                />
                              </div>

                              <div className="flex justify-between items-center">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  activity.status === 'submitted' ? 'bg-green-500/20 text-green-300' :
                                  activity.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                                  'bg-red-500/20 text-red-300'
                                }`}>
                                  {activity.status === 'submitted' ? t('ገብቷል', 'Submitted') :
                                   activity.status === 'pending' ? t('በመጠባበቅ ላይ', 'Pending') :
                                   t('ዘግይቷል', 'Late')}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    );
                  })}
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


      </div>
    </div>
  );
}

export default MainBranchDashboard;
