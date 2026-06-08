import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Clock, LogOut, CheckCircle2, ClipboardList, Users, UserPlus, ShieldAlert, Check, X } from 'lucide-react';

const EmployeeDashboard = () => {
  const [groups, setGroups] = useState([]);
  const [unassignedEmployees, setUnassignedEmployees] = useState([]);
  const [requests, setRequests] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [assignUser, setAssignUser] = useState('');
  const [assignGroup, setAssignGroup] = useState('');
  const [projectData, setProjectData] = useState({
    project_name: '',
    description: '',
    project_number: '',
    year_of_sanction: new Date().getFullYear(),
    start_date: '',
    probable_completion_date: '',
    sanctioned_amount: ''
  });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [expenditureData, setExpenditureData] = useState({
    project_id: '', major_head: '', minor_head: '', amount_spent: '', date: '', details: ''
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [recentTab, setRecentTab] = useState('requests');
  const navigate = useNavigate();

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }
    if (userInfo.role === 'admin') {
      navigate('/admin-dashboard');
      return;
    }
    
    if (userInfo.role === 'division_head') {
      fetchDivisionData();
    } else {
      fetchEmployeeData();
    }
  }, [navigate]);

  const fetchEmployeeData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${userInfo.token}` };
      const [projectsRes] = await Promise.all([
        fetch('http://localhost:5000/api/projects', { headers })
      ]);
      if (projectsRes.ok) {
        setProjects(await projectsRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDivisionData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${userInfo.token}` };
      
      const [groupsRes, unassignedRes, requestsRes, projectsRes] = await Promise.all([
        fetch('http://localhost:5000/api/division/groups', { headers }),
        fetch('http://localhost:5000/api/division/unassigned', { headers }),
        fetch('http://localhost:5000/api/division/requests', { headers }),
        fetch('http://localhost:5000/api/projects', { headers })
      ]);
      
      if (groupsRes.ok) setGroups(await groupsRes.json());
      if (unassignedRes.ok) setUnassignedEmployees(await unassignedRes.json());
      if (requestsRes.ok) setRequests(await requestsRes.json());
      if (projectsRes.ok) setProjects(await projectsRes.json());
    } catch (err) {
      console.error('Error fetching data', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleProposeGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName) return;
    try {
      const response = await fetch('http://localhost:5000/api/division/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
        body: JSON.stringify({ name: newGroupName })
      });
      if (response.ok) {
        setNewGroupName('');
        fetchDivisionData();
        showToast('Request to create group sent to Admin');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignEmployee = async (e) => {
    e.preventDefault();
    if (!assignUser || !assignGroup) return;
    try {
      const response = await fetch(`http://localhost:5000/api/division/assign-group/${assignUser}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
        body: JSON.stringify({ groupId: assignGroup })
      });
      if (response.ok) {
        setAssignUser('');
        setAssignGroup('');
        fetchDivisionData();
        showToast('Request to assign employee sent to Admin');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePromoteGroupHead = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/division/promote-group-head/${userId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      if (response.ok) {
        fetchDivisionData();
        showToast('Request to promote to Group Head sent to Admin');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMemberToggle = (id) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter(m => m !== id));
    } else {
      if (selectedMembers.length >= 15) {
        showToast('Maximum 15 members allowed per project');
        return;
      }
      setSelectedMembers([...selectedMembers, id]);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (selectedMembers.length > 15) {
      showToast('Maximum 15 members allowed per project');
      return;
    }
    setIsCreatingProject(true);
    try {
      const response = await fetch('http://localhost:5000/api/division/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
        body: JSON.stringify({ ...projectData, memberIds: selectedMembers })
      });
      if (response.ok) {
        setProjectData({ project_name: '', description: '', project_number: '', year_of_sanction: new Date().getFullYear(), start_date: '', probable_completion_date: '', sanctioned_amount: '' });
        setSelectedMembers([]);
        showToast('Project created successfully! Redirecting...');
        setTimeout(() => navigate('/projects'), 1000);
      } else {
        const data = await response.json();
        showToast(data.message || 'Error creating project');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleAddExpenditure = async (e) => {
    e.preventDefault();
    if (!expenditureData.project_id) return showToast('Please select a project');
    try {
      const response = await fetch('http://localhost:5000/api/expenditures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
        body: JSON.stringify(expenditureData)
      });
      if (response.ok) {
        setExpenditureData({ project_id: '', major_head: '', minor_head: '', amount_spent: '', date: '', details: '' });
        showToast('Expenditure logged successfully');
      } else {
        const data = await response.json();
        showToast(data.message || 'Error logging expenditure');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">Loading...</div>;

  if (userInfo.role === 'employee' || userInfo.role === 'group_head') {
    const isHeadOfAny = projects.some(p => p.project_head_id == (userInfo.id || userInfo._id));
    const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    return (
      <DashboardLayout>
        {toast && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 size={16} /> {toast}
          </div>
        )}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              Welcome back, {userInfo.name?.split(' ')[0]}!
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Here is your project overview and tasks.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm hidden sm:flex">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">My Assigned Projects</h2>
              {projects.length === 0 ? (
                <p className="text-slate-500 text-sm py-4">You are not currently assigned to any active projects.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map(proj => {
                    const budget = Number(proj.sanctioned_amount);
                    const spent = Number(proj.total_spent || 0);
                    const utilization = budget > 0 ? (spent / budget) * 100 : 0;
                    const isHead = proj.project_head_id == (userInfo.id || userInfo._id);
                    return (
                      <div key={proj.id} onClick={() => navigate(`/projects/${proj.id}`)} className="p-4 border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-md">{proj.project_number}</span>
                          {isHead && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/50">Project Head</span>}
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">{proj.project_name}</h3>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2 min-h-[32px]">{proj.description || "No description provided."}</p>
                        
                        <div className="mt-auto">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500 font-medium">Spent: ₹{spent.toLocaleString('en-IN')}</span>
                            <span className="text-slate-900 dark:text-white font-bold">{utilization.toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ${utilization > 90 ? 'bg-red-500' : utilization > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(utilization, 100)}%` }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {isHeadOfAny ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-slate-900 dark:text-white">
                  <ClipboardList size={100} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 relative z-10">
                  <ClipboardList className="text-blue-500" size={20} /> Log Expenditure
                </h2>
                <form onSubmit={handleAddExpenditure} className="flex flex-col gap-3 relative z-10">
                  <select required value={expenditureData.project_id} onChange={(e) => setExpenditureData({...expenditureData, project_id: e.target.value})} className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm">
                    <option value="" disabled>Select Project...</option>
                    {projects.filter(p => p.project_head_id == (userInfo.id || userInfo._id)).map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                  </select>
                  
                  {(() => {
                    const selectedProj = projects.find(p => p.id == expenditureData.project_id);
                    if (!selectedProj) return null;
                    const sBudget = Number(selectedProj.sanctioned_amount);
                    const sSpent = Number(selectedProj.total_spent || 0);
                    const sRem = sBudget - sSpent;
                    return (
                      <div className="bg-slate-100 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 mb-1 flex justify-between items-center text-xs">
                        <div>
                          <p className="text-slate-500 uppercase tracking-wider font-bold text-[9px] mb-0.5">Budget</p>
                          <p className="font-bold text-slate-900 dark:text-white">₹{sBudget.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                        <div>
                          <p className="text-slate-500 uppercase tracking-wider font-bold text-[9px] mb-0.5">Spent</p>
                          <p className="font-bold text-rose-500">₹{sSpent.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                        <div>
                          <p className="text-slate-500 uppercase tracking-wider font-bold text-[9px] mb-0.5">Remaining</p>
                          <p className="font-bold text-emerald-500">₹{sRem.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {expenditureData.project_id && (
                    <>
                  <input type="text" placeholder="Major Head" required value={expenditureData.major_head} onChange={(e) => setExpenditureData({...expenditureData, major_head: e.target.value})} className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" />
                  <input type="text" placeholder="Minor Head" required value={expenditureData.minor_head} onChange={(e) => setExpenditureData({...expenditureData, minor_head: e.target.value})} className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" />
                  <input type="number" placeholder="Amount Spent (₹)" required value={expenditureData.amount_spent} onChange={(e) => setExpenditureData({...expenditureData, amount_spent: e.target.value})} className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" />
                  <div className="flex flex-col">
                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider ml-1">Date of Expenditure</label>
                    <input type="date" required value={expenditureData.date} onChange={(e) => setExpenditureData({...expenditureData, date: e.target.value})} className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" />
                  </div>
                  <input type="text" placeholder="Details (Optional)" value={expenditureData.details} onChange={(e) => setExpenditureData({...expenditureData, details: e.target.value})} className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" />
                  <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors mt-2 shadow-md hover:shadow-lg active:scale-[0.98]">
                    Submit Expenditure
                  </button>
                    </>
                  )}
                </form>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-6 text-center flex flex-col items-center justify-center h-48 shadow-inner">
                <ShieldAlert className="text-slate-300 dark:text-slate-600 mb-3" size={40} strokeWidth={1.5} />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Expenditure Access Restricted</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">You must be designated as a Project Head to log financial expenditures.</p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const totalMembers = groups.reduce((acc, g) => acc + g.members.length, 0);
  const pendingRequests = requests.filter(r => r.status === 'pending').length;

  return (
    <DashboardLayout>
      {toast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg z-50 flex items-center gap-2">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {/* Header Area */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            Good afternoon, {userInfo.name?.split(' ')[0]}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your division and propose changes.</p>
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
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 truncate">Division Groups</h3>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{groups.length}</span>
              <span className="text-xs text-slate-400 mb-1">Active</span>
            </div>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl shrink-0"><Users size={24} /></div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Total Members</h3>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg shrink-0"><UserPlus size={18} /></div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{totalMembers}</div>
          <div className="text-xs font-medium text-slate-500 whitespace-nowrap">Assigned to your groups</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Pending Approvals</h3>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-lg shrink-0"><ShieldAlert size={18} /></div>
          </div>
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">{pendingRequests}</div>
          <div className="text-xs font-medium text-slate-500 whitespace-nowrap">Awaiting Admin</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Unassigned Staff</h3>
            <div className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg shrink-0"><ClipboardList size={18} /></div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{unassignedEmployees.length}</div>
          <div className="text-xs font-medium text-slate-500 whitespace-nowrap">Available in system</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Proposals and Members */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Propose New Group</h2>
              <form onSubmit={handleProposeGroup} className="flex flex-col gap-3">
                <input 
                  type="text" 
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group Name"
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm"
                  required
                />
                <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
                  Propose to Admin
                </button>
              </form>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Assign Employee</h2>
              <form onSubmit={handleAssignEmployee} className="flex flex-col gap-3">
                <select 
                  value={assignUser}
                  onChange={(e) => setAssignUser(e.target.value)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm"
                  required
                >
                  <option value="" disabled>Select unassigned employee...</option>
                  {unassignedEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
                <select 
                  value={assignGroup}
                  onChange={(e) => setAssignGroup(e.target.value)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm"
                  required
                >
                  <option value="" disabled>Select target group...</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
                  Propose Assignment
                </button>
              </form>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input type="text" placeholder="Project Name" required value={projectData.project_name} onChange={(e) => setProjectData({...projectData, project_name: e.target.value})} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm" />
                <input type="text" placeholder="Project Number" required value={projectData.project_number} onChange={(e) => setProjectData({...projectData, project_number: e.target.value})} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm" />
              </div>
              
              <div className="mb-4">
                <textarea 
                  placeholder="Project Description (Optional)" rows={3}
                  value={projectData.description} onChange={e => setProjectData({...projectData, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="number" placeholder="Year of Sanction" required value={projectData.year_of_sanction} onChange={(e) => setProjectData({...projectData, year_of_sanction: e.target.value})} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm" />
                <input type="number" placeholder="Sanctioned Amount" required value={projectData.sanctioned_amount} onChange={(e) => setProjectData({...projectData, sanctioned_amount: e.target.value})} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm" />
                <div className="flex flex-col">
                  <label className="text-xs text-slate-500 mb-1">Start Date</label>
                  <input type="date" required value={projectData.start_date} onChange={(e) => setProjectData({...projectData, start_date: e.target.value})} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-slate-500 mb-1">Probable Completion Date</label>
                  <input type="date" required value={projectData.probable_completion_date} onChange={(e) => setProjectData({...projectData, probable_completion_date: e.target.value})} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm" />
                </div>
              </div>
              
              <div className="mt-2">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Select Members ({selectedMembers.length}/15)</h3>
                <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {unassignedEmployees.length === 0 && <p className="text-xs text-slate-500 col-span-full p-2">No unassigned employees available.</p>}
                  {unassignedEmployees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedMembers.includes(emp.id)} 
                        onChange={() => handleMemberToggle(emp.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{emp.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isCreatingProject}
                className={`w-full py-2.5 text-white rounded-xl text-sm font-semibold transition-colors mt-2 flex justify-center items-center gap-2 ${isCreatingProject ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isCreatingProject ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : 'Create Project'}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Log Project Expenditure</h2>
            <form onSubmit={handleAddExpenditure} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select required value={expenditureData.project_id} onChange={(e) => setExpenditureData({...expenditureData, project_id: e.target.value})} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm">
                  <option value="" disabled>Select Project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                </select>
                <input type="text" placeholder="Major Head" required value={expenditureData.major_head} onChange={(e) => setExpenditureData({...expenditureData, major_head: e.target.value})} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm" />
                <input type="text" placeholder="Minor Head" required value={expenditureData.minor_head} onChange={(e) => setExpenditureData({...expenditureData, minor_head: e.target.value})} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm" />
                <input type="number" placeholder="Amount Spent" required value={expenditureData.amount_spent} onChange={(e) => setExpenditureData({...expenditureData, amount_spent: e.target.value})} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm" />
                <div className="flex flex-col">
                  <label className="text-xs text-slate-500 mb-1">Date</label>
                  <input type="date" required value={expenditureData.date} onChange={(e) => setExpenditureData({...expenditureData, date: e.target.value})} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm" />
                </div>
                <input type="text" placeholder="Details" value={expenditureData.details} onChange={(e) => setExpenditureData({...expenditureData, details: e.target.value})} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-sm" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors mt-2">
                Add Expenditure
              </button>
            </form>
          </div>

          {/* Group Members */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm overflow-hidden flex-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Division Members</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-l-lg whitespace-nowrap">Member</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Group</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Role</th>
                    <th className="px-4 py-3 font-medium text-right rounded-r-lg whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.length === 0 && <tr><td colSpan="4" className="text-center py-4 text-slate-500">No members in division yet.</td></tr>}
                  {groups.map(group => 
                    group.members.map(emp => (
                      <tr key={emp.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 flex items-center gap-3">
                          <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${emp.name}`} alt={emp.name} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">{emp.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{emp.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{group.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            emp.role === 'group_head' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {emp.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {emp.role === 'employee' ? (
                            <button 
                              onClick={() => handlePromoteGroupHead(emp.id)}
                              className="text-[11px] font-semibold px-2 py-1.5 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 rounded-lg shadow-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors whitespace-nowrap"
                            >
                              Propose as Head
                            </button>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col h-[600px] min-w-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent</h2>
            <div className="flex gap-2">
              <button onClick={() => setRecentTab('requests')} className={`text-xs px-2 py-1 rounded-md transition-colors ${recentTab === 'requests' ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white font-semibold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Requests</button>
              <button onClick={() => setRecentTab('projects')} className={`text-xs px-2 py-1 rounded-md transition-colors ${recentTab === 'projects' ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white font-semibold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Projects</button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 pr-2 space-y-3">
            {recentTab === 'requests' ? (
              <>
                {requests.length === 0 && <p className="text-sm text-slate-500">No requests made yet.</p>}
                {requests.map(req => {
                  const details = typeof req.details === 'string' ? JSON.parse(req.details) : req.details;
                  
                  let desc = '';
                  if (req.type === 'CREATE_GROUP') desc = `Create group "${details.name}"`;
                  if (req.type === 'ASSIGN_EMPLOYEE') desc = `Assign ${details.userName} to ${details.groupName}`;
                  if (req.type === 'PROMOTE_GROUP_HEAD') desc = `Promote ${details.userName}`;

                  const isPending = req.status === 'pending';
                  const isApproved = req.status === 'approved';
                  
                  return (
                    <div key={req.id} className="p-3 border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{req.type.replace(/_/g, ' ')}</span>
                        {isPending && <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full"><Clock size={10} /> Pending</span>}
                        {isApproved && <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full"><Check size={10} /> Approved</span>}
                        {!isPending && !isApproved && <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full"><X size={10} /> Rejected</span>}
                      </div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{desc}</p>
                      <p className="text-[10px] text-slate-400 mt-2">{new Date(req.created_at).toLocaleString()}</p>
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                {projects.length === 0 && <p className="text-sm text-slate-500">No projects created yet.</p>}
                {projects.map(proj => (
                  <div 
                    key={proj.id} 
                    onClick={() => navigate('/projects')}
                    className="p-3 border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">{proj.project_number}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${proj.status === 'planning' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : proj.status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                        {proj.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{proj.project_name}</p>
                    <p className="text-[10px] text-slate-400 mt-2">Budget: ₹{proj.sanctioned_amount}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
