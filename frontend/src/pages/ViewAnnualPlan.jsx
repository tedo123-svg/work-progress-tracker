import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { annualPlanAPI, actionAPI, attachmentsAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { ArrowLeft, TrendingUp, Target, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

function ViewAnnualPlan({ user, onLogout }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState([]);
  const [attachments, setAttachments] = useState({});

  useEffect(() => {
    fetchPlanDetails();
    fetchActions();
  }, [id]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="container mx-auto px-4 py-8 text-center">Plan not found</div>
      </div>
    );
  }

  const { plan, monthlyPeriods, quarterlyData } = data;

  const monthlyChartData = monthlyPeriods.map(period => ({
    month: new Date(period.year, period.month - 1).toLocaleDateString('en-US', { month: 'short' }),
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
            <span>Back to Dashboard</span>
          </button>
          
          {user.role === 'main_branch' && (
            <Link
              to={`/create-actions/${id}`}
              className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl transition transform hover:scale-105 shadow-lg font-semibold"
            >
              <Plus size={20} />
              <span>Create Actions</span>
            </Link>
          )}
        </div>

        <div className="glass rounded-2xl shadow-2xl p-8 backdrop-blur-xl border border-white/20 mb-6 animate-slide-in">
          <h1 className="text-4xl font-bold text-white mb-2">{plan.title}</h1>
          <p className="text-purple-200 mb-6">{plan.description}</p>

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Year</div>
              <div className="text-2xl font-bold text-blue-600">{plan.year}</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Target Number</div>
              <div className="text-2xl font-bold text-green-600">
                {plan.target_amount?.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Overall Progress</div>
              <div className="text-2xl font-bold text-orange-600">
                {(Number(plan.progress_percentage) || 0).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Monthly Targets</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Bar dataKey="target" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Quarterly Progress</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={quarterlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="achieved" stroke="#10b981" name="Achieved ($)" />
                <Line type="monotone" dataKey="progress" stroke="#f59e0b" name="Progress (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">Monthly Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {monthlyPeriods.map((period) => (
                  <tr key={period.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {new Date(period.year, period.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {period.target_amount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(period.deadline).toLocaleDateString()}
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
            <h2 className="text-xl font-bold">Actions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attachments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(actions || []).map(a => (
                  <tr key={a.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.action_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-lg">{a.action_title}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{a.plan_number?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{a.plan_activity?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-blue-600">
                      {(attachments[a.id] || []).length === 0 ? (
                        <span className="text-gray-400">None</span>
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
      </div>
    </div>
  );
}

export default ViewAnnualPlan;
