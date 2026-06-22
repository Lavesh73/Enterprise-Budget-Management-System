import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { ArrowLeft, Trash2, PlusCircle, AlertCircle } from 'lucide-react';
import Toast from '../components/ui/Toast';

const ExpenditureManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [expenditures, setExpenditures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  
  const [newExp, setNewExp] = useState({
    major_head: '',
    minor_head: '',
    amount_spent: '',
    date: '',
    details: ''
  });

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [id, navigate]);

  const headers = { 'Authorization': `Bearer ${userInfo?.token}` };

  const fetchData = async () => {
    try {
      const [projRes, expRes] = await Promise.all([
        fetch(`http://localhost:5000/api/projects/${id}/details`, { headers }),
        fetch(`http://localhost:5000/api/expenditures/project/${id}`, { headers })
      ]);

      if (projRes.ok) {
        const pData = await projRes.json();
        setProject(pData);
        // Only Division Head or Project Head can access this page
        if (userInfo.role !== 'division_head' && (userInfo.id || userInfo._id) != pData.project_head_id) {
          navigate(`/projects/${id}`);
        }
      }
      
      if (expRes.ok) {
        setExpenditures(await expRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleAddExpenditure = async (e) => {
    e.preventDefault();
    try {
      const payload = { project_id: id, ...newExp };
      const response = await fetch('http://localhost:5000/api/expenditures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        showToast('Expenditure logged successfully');
        setNewExp({ major_head: '', minor_head: '', amount_spent: '', date: '', details: '' });
        fetchData();
      } else {
        const data = await response.json();
        showToast(data.message || 'Error logging expenditure');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error');
    }
  };

  const handleDelete = async (expId) => {
    if (!window.confirm("Are you sure you want to delete this expenditure log?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/expenditures/${expId}`, {
        method: 'DELETE',
        headers
      });
      if (response.ok) {
        showToast('Expenditure deleted successfully');
        fetchData();
      } else {
        showToast('Error deleting expenditure');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error');
    }
  };

  if (loading || !project) {
    return (
      <DashboardLayout>
        <div className="h-[80vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const totalSpent = expenditures.reduce((sum, exp) => sum + Number(exp.amount_spent), 0);
  const budget = Number(project.sanctioned_amount);
  const remaining = budget - totalSpent;
  const utilization = budget > 0 ? (totalSpent / budget) * 100 : 0;

  return (
    <DashboardLayout>
      <Toast message={toast} />

      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <button 
          onClick={() => navigate(`/projects/${id}`)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-6 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Project
        </button>

        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">Ledger Management</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Managing finances for <span className="font-bold text-slate-700 dark:text-slate-300">{project.project_name}</span></p>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sanctioned</p>
              <p className="font-bold text-slate-900 dark:text-white">₹{budget.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Spent</p>
              <p className="font-bold text-rose-500">₹{totalSpent.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Remaining</p>
              <p className="font-bold text-emerald-500">₹{remaining.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 sticky top-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <PlusCircle size={20} className="text-blue-500" /> Log New Expenditure
              </h2>
              <form onSubmit={handleAddExpenditure} className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider ml-1 mb-1 block">Major Head</label>
                  <input type="text" placeholder="e.g. Equipment, Travel" required value={newExp.major_head} onChange={(e) => setNewExp({...newExp, major_head: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider ml-1 mb-1 block">Minor Head</label>
                  <input type="text" placeholder="e.g. Laptops, Flight tickets" required value={newExp.minor_head} onChange={(e) => setNewExp({...newExp, minor_head: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider ml-1 mb-1 block">Amount (₹)</label>
                  <input type="number" placeholder="0.00" required value={newExp.amount_spent} onChange={(e) => setNewExp({...newExp, amount_spent: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider ml-1 mb-1 block">Date</label>
                  <input type="date" required value={newExp.date} onChange={(e) => setNewExp({...newExp, date: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider ml-1 mb-1 block">Details (Optional)</label>
                  <textarea rows="3" placeholder="Additional context..." value={newExp.details} onChange={(e) => setNewExp({...newExp, details: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm resize-none" />
                </div>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 mt-2">
                  Commit to Ledger
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Table */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Transaction History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-bold">Date</th>
                      <th className="px-6 py-4 font-bold">Classification</th>
                      <th className="px-6 py-4 font-bold">Details</th>
                      <th className="px-6 py-4 font-bold text-right">Amount (₹)</th>
                      <th className="px-6 py-4 font-bold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {expenditures.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                          <AlertCircle className="mx-auto mb-2 opacity-50" size={32} />
                          No expenditures logged yet.
                        </td>
                      </tr>
                    ) : (
                      expenditures.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                            {new Date(exp.date).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900 dark:text-white">{exp.major_head}</div>
                            <div className="text-xs text-slate-500">{exp.minor_head}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                            {exp.details || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-rose-500">
                            {Number(exp.amount_spent).toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button 
                              onClick={() => handleDelete(exp.id)}
                              className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Delete log"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ExpenditureManagementPage;
