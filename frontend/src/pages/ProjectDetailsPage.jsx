import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { Activity, Users, ArrowLeft, Calendar, FileText, IndianRupee, Award, UserCheck, Clock, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import Toast from '../components/ui/Toast';

const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
  const isDivisionHead = userInfo.role === 'division_head';

  const fetchDetails = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${userInfo.token}` };
      const [detailsRes, forecastRes] = await Promise.all([
        fetch(`http://localhost:5000/api/projects/${id}/details`, { headers }),
        fetch(`http://localhost:5000/api/projects/${id}/forecast`, { headers })
      ]);
      
      if (detailsRes.ok) {
        setProject(await detailsRes.json());
        if (forecastRes.ok) {
          setForecast(await forecastRes.json());
        }
      } else {
        navigate('/projects');
      }
    } catch (err) {
      console.error(err);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userInfo.token) {
      navigate('/login');
      return;
    }
    fetchDetails();
  }, [id, navigate]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleAssignHead = async (memberId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${id}/assign-head`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}` 
        },
        body: JSON.stringify({ userId: memberId })
      });
      if (res.ok) {
        showToast('Project Head assigned successfully!');
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
      showToast('Error assigning Project Head');
    }
  };

  const handleStartProject = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${id}/start`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      if (res.ok) {
        showToast('Project initiated successfully!');
        fetchDetails();
      } else {
        const data = await res.json();
        showToast(data.message || 'Error starting project');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error');
    }
  };

  const calculateSpent = (expenditures = []) => expenditures.reduce((acc, curr) => acc + Number(curr.amount_spent), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020817] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) return null;

  const spent = calculateSpent(project.expenditures);
  const budget = Number(project.sanctioned_amount);
  const utilization = budget > 0 ? (spent / budget) * 100 : 0;
  
  const isCompleted = project.status === 'completed';
  const isActive = project.status === 'active';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020817] text-slate-900 dark:text-slate-100 font-sans pb-32">
      {/* Toast Notification */}
      <Toast message={toast} />

      {/* Hero Header Area (No Topbar) */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-8 pb-12 px-6 sm:px-12 relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/50 to-transparent dark:from-blue-900/10 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <button 
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-6 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Directory
          </button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold rounded-full tracking-widest uppercase">
                  {project.project_number}
                </span>
                <span className={`px-3 py-1 text-xs font-bold rounded-full tracking-widest uppercase flex items-center gap-1 ${
                  isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  isCompleted ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {isActive && <Activity size={12} />}
                  {isCompleted && <CheckCircle2 size={12} />}
                  {!isActive && !isCompleted && <Clock size={12} />}
                  {project.status}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                  {project.project_name}
                </h1>
                {project.status?.toLowerCase() === 'planning' && (userInfo.role === 'division_head' || (userInfo.id || userInfo._id) == project.project_head_id) && (
                  <button 
                    onClick={handleStartProject}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
                  >
                    <Activity size={18} /> Initiate Project
                  </button>
                )}
              </div>
              <p className="mt-4 text-slate-600 dark:text-slate-400 max-w-3xl text-lg leading-relaxed">
                {project.description || "No project description provided."}
              </p>
            </div>
            
            {project.project_head_name && (
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50 min-w-[250px]">
                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${project.project_head_name}`} alt="Head" className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 shadow-sm" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-1"><Award size={10} /> Project Head</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white">{project.project_head_name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Dashboard */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Financials & Timeline */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Financial Overview Card */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none">
              <IndianRupee size={150} />
            </div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="text-emerald-500" /> Financial Intelligence
              </h3>
              {(userInfo.role === 'division_head' || (userInfo.id || userInfo._id) == project.project_head_id) && (
                <button 
                  onClick={() => navigate(`/projects/${id}/expenditures`)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <FileText size={16} /> Manage Ledger
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Sanctioned Budget</p>
                <p className="text-4xl font-extrabold text-slate-900 dark:text-white">₹{budget.toLocaleString('en-IN')}</p>
                <p className="text-sm text-slate-500 mt-1">Sanctioned in {project.year_of_sanction}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Expenditure</p>
                <p className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">₹{spent.toLocaleString('en-IN')}</p>
                <p className="text-sm text-slate-500 mt-1">Remaining: ₹{(budget - spent).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50">
              <div className="flex justify-between items-end mb-3">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Budget Utilization</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{utilization.toFixed(1)}%</span>
              </div>
              <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${utilization > 90 ? 'bg-red-500' : utilization > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                ></div>
              </div>
            </div>
          </section>

          {/* AI Predictive Forecast Card */}
          {forecast && forecast.data && (
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="text-blue-500" /> AI Budget Forecast
                </h3>
                {forecast.insights.status === 'At Risk' && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-bold border border-red-100 dark:border-red-900/50 animate-pulse">
                    <AlertTriangle size={14} /> Critical Risk
                  </div>
                )}
                {forecast.insights.status === 'On Track' && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-100 dark:border-emerald-900/50">
                    <CheckCircle2 size={14} /> On Track
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs text-slate-500 font-bold tracking-widest uppercase mb-1">Daily Burn Rate</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">₹{Math.round(forecast.insights.burnRatePerDay).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs text-slate-500 font-bold tracking-widest uppercase mb-1">Predicted Depletion</p>
                  <p className={`text-xl font-black ${forecast.insights.status === 'At Risk' ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                    {forecast.insights.depletionDate ? new Date(forecast.insights.depletionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sufficient Funds'}
                  </p>
                </div>
              </div>

              <div className="h-72 w-full mt-4 -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis 
                      dataKey="date" 
                      type="category" 
                      allowDuplicatedCategory={false}
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      tickFormatter={(val) => new Date(val).toLocaleDateString('en-GB', { month: 'short' })}
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`}
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', backgroundColor: '#0f172a', color: '#f8fafc' }}
                      formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <ReferenceLine 
                      y={forecast.insights.budget} 
                      label={{ position: 'top', value: 'Sanctioned Budget', fill: '#ef4444', fontSize: 12, fontWeight: 600 }} 
                      stroke="#ef4444" 
                      strokeDasharray="3 3" 
                    />
                    <Line 
                      data={forecast.data.historical}
                      type="monotone" 
                      dataKey="actual" 
                      name="Actual Spend"
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={false}
                      activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Line 
                      data={forecast.data.predicted}
                      type="monotone" 
                      dataKey="predicted" 
                      name="AI Prediction"
                      stroke="#f59e0b" 
                      strokeWidth={3} 
                      strokeDasharray="5 5" 
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Timeline Card */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Calendar className="text-indigo-500" /> Project Timeline
            </h3>
            
            <div className="flex items-center justify-between relative">
              {/* Connecting Line */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0"></div>
              <div className="absolute top-1/2 left-0 h-1 bg-indigo-500 -translate-y-1/2 z-0 transition-all" style={{ width: '50%' }}></div>
              
              {/* Start Node */}
              <div className="relative z-10 flex flex-col items-center bg-white dark:bg-slate-900 px-4">
                <div className="w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-900/30 mb-3"></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Commencement</p>
                <p className="font-bold text-slate-900 dark:text-white mt-1">{new Date(project.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>

              {/* End Node */}
              <div className="relative z-10 flex flex-col items-center bg-white dark:bg-slate-900 px-4">
                <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-slate-50 dark:ring-slate-800 mb-3"></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Completion</p>
                <p className="font-bold text-slate-900 dark:text-white mt-1">{new Date(project.probable_completion_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
          </section>

        </div>

        {/* Right Column: Team Roster */}
        <div className="flex flex-col gap-8">
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="text-blue-500" /> Project Roster
              </h3>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-3 py-1 rounded-full">
                {project.members?.length || 0} Members
              </span>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-2">
              {project.members?.map(member => {
                const isProjectHead = project.project_head_id === member.id;
                return (
                  <div key={member.id} className={`flex flex-col p-4 rounded-2xl transition-all ${isProjectHead ? 'bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'}`}>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${member.name}`} alt={member.name} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                        {isProjectHead && <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-0.5 rounded-full ring-2 ring-white dark:ring-slate-900"><Award size={10} /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate flex items-center gap-2">
                          {member.name}
                          {isProjectHead && <span className="text-[9px] uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 px-2 py-0.5 rounded-md flex-shrink-0">Head</span>}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{member.email}</p>
                      </div>
                    </div>
                    
                    {isDivisionHead && !isProjectHead && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button 
                          onClick={() => handleAssignHead(member.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                          <UserCheck size={14} /> Assign as Project Head
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {(!project.members || project.members.length === 0) && (
                <div className="text-center py-12 px-4">
                  <Users className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={32} />
                  <p className="text-slate-500 text-sm">No team members assigned yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>

      </div>

      {/* Render the macOS Dock */}
      <Sidebar />
    </div>
  );
};

export default ProjectDetailsPage;
