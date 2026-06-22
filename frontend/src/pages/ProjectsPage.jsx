import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Layers, Calendar, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/ui/Toast';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
  const isDivisionHead = userInfo.role === 'division_head';
  const isAdmin = userInfo.role === 'admin';
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${userInfo.token}` };
      const projRes = await fetch('http://localhost:5000/api/projects', { headers });
      if (projRes.ok) {
        setProjects(await projRes.json());
      }
    } catch (err) { 
      console.error(err); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (!userInfo.token) {
      navigate('/login');
      return;
    }
    fetchProjects(); 
  }, [navigate]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleProjectClick = async (project) => {
    navigate(`/projects/${project.id}`);
  };



  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">Loading projects...</div>;

  return (
    <DashboardLayout>
      <Toast message={toast} />

      <div className="max-w-7xl mx-auto pt-6 flex flex-col gap-6 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Projects Directory</h1>
            <p className="text-slate-500 mt-1">Manage, monitor, and oversee all division projects in one place.</p>
          </div>
          {isDivisionHead && (
            <button onClick={() => navigate('/employee-dashboard')} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm shadow-blue-600/20 transition-all hover:-translate-y-0.5">
              + New Project
            </button>
          )}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map(proj => {
            // Calculate a fake progress for UI purposes if no data, or calculate if we had expenditure in this call.
            // Since getAll doesn't return expenditures, we'll just show the budget.
            return (
              <div 
                key={proj.id}
                onClick={() => handleProjectClick(proj)}
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-800/50 transition-all cursor-pointer group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
                    <Layers size={24} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    proj.status === 'planning' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 
                    proj.status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  }`}>
                    {proj.status}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{proj.project_name}</h3>
                <p className="text-sm font-medium text-slate-500 mb-6">ID: {proj.project_number} • Year: {proj.year_of_sanction}</p>

                <div className="mt-auto space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <DollarSign size={16} /> Budget
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">₹{Number(proj.sanctioned_amount).toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Calendar size={16} /> Target End
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(proj.probable_completion_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {proj.project_head_name && (
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center gap-3">
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${proj.project_head_name}`} alt="Head" className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Project Head</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{proj.project_head_name}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {projects.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
              <Layers className="mx-auto text-slate-400 mb-3" size={48} />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Projects Found</h3>
              <p className="text-slate-500">You are not assigned to any active projects.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProjectsPage;
