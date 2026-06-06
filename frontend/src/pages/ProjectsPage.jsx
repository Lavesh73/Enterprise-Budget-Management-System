import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Layers, Users } from 'lucide-react';

const ProjectsPage = () => {
  const [data, setData] = useState([]);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [year, setYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [amount, setAmount] = useState('');
  const [divisionHeadId, setDivisionHeadId] = useState('');
  
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
  const isAdmin = userInfo.role === 'admin';
  const isDivisionHead = userInfo.role === 'division_head';

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${userInfo.token}` };
      const projRes = await fetch('http://localhost:5000/api/projects', { headers });
      if (projRes.ok) setData(await projRes.json());

      if (isAdmin) {
        const usersRes = await fetch('http://localhost:5000/api/admin/users', { headers });
        if (usersRes.ok) setUsers(await usersRes.json());
      }
      
      if (isDivisionHead) {
        const groupsRes = await fetch('http://localhost:5000/api/division/groups', { headers });
        if (groupsRes.ok) setMyGroups(await groupsRes.json());
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:5000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
      body: JSON.stringify({ 
        project_name: name, project_number: number, year_of_sanction: year, 
        start_date: startDate, probable_completion_date: completionDate, 
        sanctioned_amount: parseFloat(amount), division_head_id: divisionHeadId 
      })
    });
    setName(''); setNumber(''); setYear(''); setStartDate(''); setCompletionDate(''); setAmount(''); setDivisionHeadId('');
    fetchData();
  };

  const handleAssignGroup = async (projectId, groupId) => {
    if (!groupId) return;
    await fetch(`http://localhost:5000/api/projects/${projectId}/assign-group`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
      body: JSON.stringify({ group_id: groupId })
    });
    fetchData();
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto pt-6 flex flex-col gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-50 dark:bg-pink-900/30 rounded-xl"><Layers className="text-pink-600 dark:text-pink-400" /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Project Manager</h1>
              <p className="text-slate-500 text-sm">{isAdmin ? "Create projects and assign division heads." : "Manage your projects and assign working groups."}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {isAdmin && (
            <form onSubmit={handleSubmit} className="md:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 h-fit">
              <h2 className="font-semibold text-slate-800 dark:text-white mb-4">New Project</h2>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Project Name" className="w-full mb-3 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
              <input required type="text" value={number} onChange={e => setNumber(e.target.value)} placeholder="Project Number" className="w-full mb-3 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
              <input required type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="Year of Sanction" className="w-full mb-3 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
              
              <label className="text-xs text-slate-500 ml-1">Start Date</label>
              <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mb-3 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
              
              <label className="text-xs text-slate-500 ml-1">Probable Completion</label>
              <input required type="date" value={completionDate} onChange={e => setCompletionDate(e.target.value)} className="w-full mb-3 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
              
              <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Sanctioned Amount (₹)" className="w-full mb-4 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
              
              <select required value={divisionHeadId} onChange={e => setDivisionHeadId(e.target.value)} className="w-full mb-4 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                <option value="">Assign Division Head</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role.replace('_', ' ')})</option>
                ))}
              </select>
              
              <button type="submit" className="w-full bg-pink-600 text-white rounded-xl py-2 font-medium hover:bg-pink-700 transition">Create Project</button>
            </form>
          )}

          <div className={`${isAdmin ? 'md:col-span-3' : 'md:col-span-4'} bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700`}>
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Active Projects</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.map(item => (
                <div key={item.id} className="p-5 border border-slate-100 dark:border-slate-700 rounded-xl flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-lg">{item.project_name} <span className="text-sm font-normal text-slate-500">({item.project_number})</span></h3>
                      <p className="text-xs text-slate-500 mt-1">Sanctioned {item.year_of_sanction} • Amount: <span className="font-bold text-emerald-600">${item.sanctioned_amount}</span></p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold rounded-full uppercase">{item.status}</span>
                  </div>
                  
                  <div className="mt-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                    <p className="text-sm flex justify-between"><span className="text-slate-500">Start Date:</span> <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(item.start_date).toLocaleDateString()}</span></p>
                    <p className="text-sm flex justify-between mt-1"><span className="text-slate-500">Completion:</span> <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(item.probable_completion_date).toLocaleDateString()}</span></p>
                    <hr className="my-2 border-slate-200 dark:border-slate-700" />
                    <p className="text-sm"><span className="font-semibold text-slate-700 dark:text-slate-300">Division Head:</span> {item.division_head_name || 'Unassigned'}</p>
                    <p className="text-sm mt-1"><span className="font-semibold text-slate-700 dark:text-slate-300">Working Group:</span> {item.group_name || 'Unassigned'}</p>
                    <p className="text-sm mt-1"><span className="font-semibold text-slate-700 dark:text-slate-300">Group Leaders:</span> {item.group_leaders || 'None'}</p>
                    
                    {isDivisionHead && !item.group_name && (
                      <div className="mt-3 flex gap-2">
                        <select id={`group-select-${item.id}`} className="flex-1 px-3 py-1 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <option value="">Select Group to Assign...</option>
                          {myGroups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => handleAssignGroup(item.id, document.getElementById(`group-select-${item.id}`).value)}
                          className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 px-3 py-1 rounded-lg text-sm font-medium hover:opacity-90"
                        >
                          Assign
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {data.length === 0 && <p className="text-slate-500 text-sm">No active projects found.</p>}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default ProjectsPage;
