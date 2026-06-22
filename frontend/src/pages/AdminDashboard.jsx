import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Clock, LogOut, CheckCircle2, ClipboardList } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { BentoDemo } from '../components/BentoDemo';

const AdminDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [projects, setProjects] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Employees');
  
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${userInfo.token}` };
      
      const [empRes, attRes, leavesRes, perfRes, projRes, budgRes, apprRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/employees', { headers }),
        fetch('http://localhost:5000/api/modules/attendance', { headers }),
        fetch('http://localhost:5000/api/modules/leaves', { headers }),
        fetch('http://localhost:5000/api/modules/performance', { headers }),
        fetch('http://localhost:5000/api/projects', { headers }),
        fetch('http://localhost:5000/api/budgets', { headers }),
        fetch('http://localhost:5000/api/admin/approvals', { headers })
      ]);

      if (empRes.ok) setEmployees(await empRes.json());
      if (attRes.ok) setAttendance(await attRes.json());
      if (leavesRes.ok) setLeaves(await leavesRes.json());
      if (perfRes.ok) setPerformance(await perfRes.json());
      if (projRes.ok) setProjects(await projRes.json());
      if (budgRes.ok) setBudgets(await budgRes.json());
      if (apprRes.ok) setApprovals(await apprRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/promote-division-head/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      if (response.ok) fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveApproval = async (id, action) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/approvals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
        body: JSON.stringify({ action })
      });
      if (response.ok) fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const downloadProjectReport = async (projectId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/details`, {
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch details');
      const project = await response.json();
      
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text(`Project Report: ${project.project_name}`, 14, 22);
      
      doc.setFontSize(12);
      doc.text(`Project Number: ${project.project_number}`, 14, 32);
      doc.text(`Division Head: ${project.division_head_name || 'N/A'}`, 14, 40);
      doc.text(`Sanctioned Amount: $${project.sanctioned_amount}`, 14, 48);
      doc.text(`Start Date: ${new Date(project.start_date).toLocaleDateString()}`, 14, 56);
      doc.text(`Completion Date: ${new Date(project.probable_completion_date).toLocaleDateString()}`, 14, 64);
      
      doc.text(`Team Members (${project.members?.length || 0}/15):`, 14, 80);
      
      const tableData = project.members?.map(m => [m.name, m.email, m.role]) || [];
      doc.autoTable({
        startY: 85,
        head: [['Name', 'Email', 'Role']],
        body: tableData,
      });

      if (project.expenditures && project.expenditures.length > 0) {
        doc.text('Expenditures:', 14, doc.lastAutoTable.finalY + 15);
        const expData = project.expenditures.map(ex => [
          ex.major_head, ex.minor_head, `$${ex.amount_spent}`, new Date(ex.date).toLocaleDateString(), ex.details
        ]);
        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 20,
          head: [['Major Head', 'Minor Head', 'Amount Spent', 'Date', 'Details']],
          body: expData,
        });
      }
      
      doc.save(`${project.project_name.replace(/\s+/g, '_')}_Report.pdf`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const todayStr = new Date().toISOString().split('T')[0];
  
  const todayAttendance = attendance.filter(a => a.date && a.date.startsWith(todayStr));
  const attendancePercent = employees.length > 0 ? ((todayAttendance.length / employees.length) * 100).toFixed(1) : 0;
  
  const todayLeaves = leaves.filter(l => l.status === 'approved' && l.start_date <= todayStr && l.end_date >= todayStr);
  const leavesPercent = employees.length > 0 ? ((todayLeaves.length / employees.length) * 100).toFixed(1) : 0;

  const totalReviews = performance.length;
  const avgRating = totalReviews > 0 ? (performance.reduce((sum, p) => sum + p.rating, 0) / totalReviews).toFixed(1) : 0;

  // Chart Data Calculation
  const getQuarter = (dateStr) => {
    const month = new Date(dateStr).getMonth();
    if (month >= 3 && month <= 5) return 'Q1';
    if (month >= 6 && month <= 8) return 'Q2';
    if (month >= 9 && month <= 11) return 'Q3';
    return 'Q4';
  };

  const currentYear = new Date().getFullYear();
  const chartData = [
    { name: 'Q1 (Apr-Jun)', thisYear: 0, lastYear: 0 },
    { name: 'Q2 (Jul-Sep)', thisYear: 0, lastYear: 0 },
    { name: 'Q3 (Oct-Dec)', thisYear: 0, lastYear: 0 },
    { name: 'Q4 (Jan-Mar)', thisYear: 0, lastYear: 0 },
  ];

  budgets.forEach(b => {
    const d = new Date(b.created_at);
    const y = d.getFullYear();
    const isThisYear = y === currentYear;
    const isLastYear = y === currentYear - 1;
    if (!isThisYear && !isLastYear) return;

    const amt = Number(b.amount) || 0;
    const q = getQuarter(b.created_at);
    const dataRow = chartData.find(c => c.name.startsWith(q));
    if (dataRow) {
      if (isThisYear) dataRow.thisYear += amt;
      if (isLastYear) dataRow.lastYear += amt;
    }
  });

  // Project Expenses Calculation
  const projectExpenses = projects.map(p => {
    const expenses = budgets.filter(b => b.project_id === p.id).reduce((sum, b) => sum + Number(b.amount), 0);
    const total = Number(p.sanctioned_amount) || 0;
    const percent = total > 0 ? Math.min(100, Math.floor((expenses / total) * 100)) : 0;
    return { ...p, expenses, total, percent };
  }).sort((a, b) => b.total - a.total);

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">Loading...</div>;

  return (
    <DashboardLayout>
      {/* Header Area */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            Good afternoon, {userInfo.name?.split(' ')[0] || 'Admin'}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Your organization is looking good!</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
            <div>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Current time</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{currentDate}, {currentTime}</p>
            </div>
            <Clock className="text-blue-600 dark:text-blue-400" size={20} />
          </div>
          <button onClick={handleLogout} className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-xl transition-colors" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between overflow-hidden">
          <div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 truncate">Total Employees</h3>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{employees.length}</span>
              <span className="text-xs text-slate-400 mb-1">Active</span>
            </div>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-100 dark:text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
              <path className="text-blue-600" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
            </svg>
            <span className="absolute text-xs font-bold text-slate-800 dark:text-slate-200">100%</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Performance Reviews</h3>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg shrink-0"><ClipboardList size={18} /></div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{totalReviews}</div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 whitespace-nowrap">
            <div className="w-1.5 h-4 bg-slate-300 dark:bg-slate-600 rounded-full"></div> {avgRating} avg rating
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Today's Check-ins</h3>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg shrink-0"><CheckCircle2 size={18} /></div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{todayAttendance.length}</div>
          <div className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400 whitespace-nowrap">
            <div className="w-1.5 h-4 bg-green-500 rounded-full"></div> Logged today
          </div>
        </div>

        <div className="grid grid-rows-2 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div className="min-w-0">
              <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 truncate">Attendance %</h3>
              <div className="text-xl font-bold text-slate-900 dark:text-white truncate">{attendancePercent}%</div>
            </div>
            <button onClick={() => navigate('/attendance')} className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded-xl transition-colors shrink-0 ml-2 cursor-pointer">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            </button>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div className="min-w-0">
              <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 truncate">Leaves Today</h3>
              <div className="text-xl font-bold text-slate-900 dark:text-white truncate">{todayLeaves.length} ({leavesPercent}%)</div>
            </div>
            <button onClick={() => navigate('/leave')} className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded-xl transition-colors shrink-0 ml-2 cursor-pointer">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Organization Directory */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Organization Directory</h2>
          </div>
          
          <div className="flex gap-6 border-b border-slate-200 dark:border-slate-700 mb-4 pb-1 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('All Employees')}
              className={`${activeTab === 'All Employees' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-b-2 border-transparent'} pb-2 font-semibold text-sm transition-colors whitespace-nowrap`}>
              All Employees
            </button>
            <button 
              onClick={() => setActiveTab('Division Heads')}
              className={`${activeTab === 'Division Heads' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-b-2 border-transparent'} pb-2 font-semibold text-sm transition-colors whitespace-nowrap`}>
              Division Heads
            </button>
            <button 
              onClick={() => setActiveTab('Group Heads')}
              className={`${activeTab === 'Group Heads' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-b-2 border-transparent'} pb-2 font-semibold text-sm transition-colors whitespace-nowrap`}>
              Group Heads
            </button>
            <button 
              onClick={() => setActiveTab('Approvals')}
              className={`${activeTab === 'Approvals' ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-b-2 border-transparent'} pb-2 font-semibold text-sm transition-colors whitespace-nowrap flex items-center gap-2`}>
              Approvals
              {approvals.length > 0 && <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{approvals.length}</span>}
            </button>
            <button 
              onClick={() => setActiveTab('Projects')}
              className={`${activeTab === 'Projects' ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-b-2 border-transparent'} pb-2 font-semibold text-sm transition-colors whitespace-nowrap`}>
              Projects
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            {activeTab === 'All Employees' || activeTab === 'Division Heads' || activeTab === 'Group Heads' ? (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-l-lg whitespace-nowrap">Team Members</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Role</th>
                  <th className="px-4 py-3 font-medium text-center whitespace-nowrap">Rating</th>
                  <th className="px-4 py-3 font-medium text-right rounded-r-lg whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {employees.filter(emp => {
                  if (activeTab === 'Division Heads') return emp.role === 'division_head';
                  if (activeTab === 'Group Heads') return emp.role === 'group_head';
                  return true;
                }).map(emp => {
                  const empReviews = performance.filter(p => p.user_id === emp.id);
                  const empAvgRating = empReviews.length > 0 ? (empReviews.reduce((sum, p) => sum + p.rating, 0) / empReviews.length).toFixed(1) : 'N/A';
                  return (
                  <tr key={emp.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 flex items-center gap-3">
                      <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${emp.name}`} alt={emp.name} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{emp.name}</p>
                        <p className="text-xs text-slate-500 truncate">{emp.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        emp.role === 'division_head' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        emp.role === 'group_head' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {emp.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="font-bold text-slate-900 dark:text-white text-base">{empAvgRating}</span>
                      <span className="text-[10px] text-slate-400 ml-1">/ 5.0</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {emp.role === 'employee' ? (
                        <button 
                          onClick={() => handlePromote(emp.id)}
                          className="text-xs font-semibold px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
                        >
                          Make Division Head
                        </button>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
            ) : activeTab === 'Approvals' ? (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-l-lg whitespace-nowrap">Requester</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Type</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Details</th>
                  <th className="px-4 py-3 font-medium text-right rounded-r-lg whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvals.length === 0 && <tr><td colSpan="4" className="text-center py-6 text-slate-500">No pending approvals.</td></tr>}
                {approvals.map(appr => {
                  const details = typeof appr.details === 'string' ? JSON.parse(appr.details) : appr.details;
                  let desc = '';
                  if (appr.type === 'CREATE_GROUP') desc = `Create group "${details.name}"`;
                  if (appr.type === 'ASSIGN_EMPLOYEE') desc = `Assign ${details.userName} to ${details.groupName}`;
                  if (appr.type === 'PROMOTE_GROUP_HEAD') desc = `Promote ${details.userName}`;

                  return (
                    <tr key={appr.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${appr.requester_name}`} alt={appr.requester_name} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 shrink-0" />
                          <p className="font-semibold text-slate-900 dark:text-white truncate">{appr.requester_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {appr.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{desc}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleResolveApproval(appr.id, 'approve')} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors">Approve</button>
                          <button onClick={() => handleResolveApproval(appr.id, 'reject')} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 text-xs font-semibold rounded-lg transition-colors">Reject</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            ) : activeTab === 'Projects' ? (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-l-lg whitespace-nowrap">Project Name</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Division Head</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Amount</th>
                  <th className="px-4 py-3 font-medium text-right rounded-r-lg whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 && <tr><td colSpan="4" className="text-center py-6 text-slate-500">No projects created yet.</td></tr>}
                {projects.map(proj => (
                  <tr key={proj.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{proj.project_name}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{proj.division_head_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">${proj.sanctioned_amount}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => downloadProjectReport(proj.id)} className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors">
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            ) : null}
          </div>
        </div>

        {/* Right Column: Charts & Expenses */}
        <div className="flex flex-col gap-6 min-w-0">
          {/* Performance Comparison Chart */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Performance comparison</h2>
              <select className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-600 dark:text-slate-300 outline-none">
                <option>All Members</option>
              </select>
            </div>
            <div className="h-48 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px', paddingLeft: '20px' }} />
                  <Bar dataKey="thisYear" name="This Year" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="lastYear" name="Last Year" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expenses / Budgets Progress */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-5">Expenses Allocation</h2>
            <div className="flex flex-col gap-5">
              {projectExpenses.slice(0, 3).map((proj) => {
                return (
                  <div key={proj.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs uppercase">
                      {proj.project_name.substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1.5 items-end">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{proj.project_name}</span>
                        <span className="text-[10px] font-medium text-slate-500">${(proj.expenses/1000).toFixed(1)}k / ${(proj.total/1000).toFixed(1)}k</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full flex overflow-hidden">
                        <div style={{ width: `${proj.percent}%` }} className="h-full bg-blue-600 transition-all duration-500"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {projectExpenses.length === 0 && <p className="text-slate-500 text-sm">No active project budgets found.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Feature Section */}
      <div className="mt-8 mb-12">
        <BentoDemo />
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
