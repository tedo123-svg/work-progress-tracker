import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { FileText, Clock, CheckCircle, AlertCircle, TrendingUp, Target, Award } from 'lucide-react';
import { filterFutureReports, getCurrentEthiopianMonth } from '../utils/ethiopianCalendar';

function BranchUserDashboard({ user, onLogout }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await reportAPI.getMyReports();
      
      // Filter reports to show only future months based on Ethiopian calendar
      // Currently in month 5 (ጥር - Tir), so show months 6-12
      const filteredReports = filterFutureReports(response.data);
      
      setReports(filteredReports);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <span className="capitalize">{status}</span>
      </span>
    );
  };

  // Stats are calculated from filtered reports (only future months)
  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    submitted: reports.filter(r => r.status === 'submitted').length,
    late: reports.filter(r => r.status === 'late').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 animate-slide-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Award className="text-yellow-400" size={32} />
                ቅርንጫፍ ዳሽቦርድ
              </h1>
              <p className="text-purple-200">የወርሃዊ ሪፖርቶችዎን ያስገቡ እና ይከታተሉ (የሚመጡ ወራትን ብቻ በማሳየት ላይ)</p>
            </div>
            
            <Link
              to="/action-reports"
              className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl transition transform hover:scale-105 shadow-lg font-semibold"
            >
              <Target size={20} />
              <span>የተግባር ሪፖርቶች</span>
            </Link>
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
            <div className="text-sm text-purple-300 mb-1">ጠቅላላ ሪፖርቶች</div>
            <div className="text-4xl font-bold text-white">{stats.total}</div>
          </div>
          
          <div className="glass rounded-2xl shadow-xl p-6 backdrop-blur-xl border border-yellow-400/30 card-hover animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Clock size={24} className="text-white" />
              </div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
            <div className="text-sm text-yellow-300 mb-1">በመጠባበቅ ላይ</div>
            <div className="text-4xl font-bold text-white">{stats.pending}</div>
          </div>
          
          <div className="glass rounded-2xl shadow-xl p-6 backdrop-blur-xl border border-green-400/30 card-hover animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle size={24} className="text-white" />
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <div className="text-sm text-green-300 mb-1">ገብቷል</div>
            <div className="text-4xl font-bold text-white">{stats.submitted}</div>
          </div>
          
          <div className="glass rounded-2xl shadow-xl p-6 backdrop-blur-xl border border-red-400/30 card-hover animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <AlertCircle size={24} className="text-white" />
              </div>
              <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
            </div>
            <div className="text-sm text-red-300 mb-1">ዘግይቷል</div>
            <div className="text-4xl font-bold text-white">{stats.late}</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="text-purple-200 mt-4">ሪፖርቶች በመጫን ላይ...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="glass rounded-3xl shadow-2xl p-16 text-center backdrop-blur-xl border border-white/20 animate-fade-in">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <FileText size={48} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">ምንም ሪፖርቶች የሉም</h3>
            <p className="text-purple-200 max-w-md mx-auto">
              ሪፖርቶች የሚታዩት የዓመታዊ እቅዶች በዋና ቅርንጫፍ ከተፈጠሩ በኋላ ነው
            </p>
          </div>
        ) : (
          <div className="glass rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl border border-white/20 animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">እቅድ</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">ጊዜ</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">ዒላማ</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">የተሳካ</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">እድገት</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">የመጨረሻ ቀን</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">ሁኔታ</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">ተግባር</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 text-sm text-white font-medium">{report.plan_title}</td>
                      <td className="px-6 py-4 text-sm text-purple-200">
                        {new Date(report.year, report.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </td>
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
                      <td className="px-6 py-4 text-sm text-purple-200">
                        {new Date(report.deadline).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(report.status)}</td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/submit-report/${report.id}`}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-semibold rounded-lg transition transform hover:scale-105"
                        >
                          {report.status === 'pending' ? 'አስገባ' : 'ይመልከቱ/አርትዕ'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BranchUserDashboard;
