import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Briefcase, ChevronRight, ChevronLeft, Trash2, UserPlus } from 'lucide-react';

const RecruitPage = () => {
  const [data, setData] = useState([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/modules/applicants', {
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      if (res.ok) setData(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:5000/api/modules/applicants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
      body: JSON.stringify({ name, role, status: 'review', applied_date: new Date().toISOString().split('T')[0] })
    });
    setName(''); setRole(''); fetchData();
  };

  const handleUpdateStatus = async (id, status) => {
    await fetch(`http://localhost:5000/api/modules/applicants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Remove this applicant?')) return;
    await fetch(`http://localhost:5000/api/modules/applicants/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${userInfo.token}` }
    });
    fetchData();
  };

  const columns = [
    { id: 'review', title: 'In Review', color: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-900/50', badge: 'bg-yellow-100 text-yellow-700' },
    { id: 'interview', title: 'Interviewing', color: 'border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-900/50', badge: 'bg-blue-100 text-blue-700' },
    { id: 'offer', title: 'Offer Extended', color: 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900/50', badge: 'bg-green-100 text-green-700' },
    { id: 'rejected', title: 'Rejected', color: 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/50', badge: 'bg-red-100 text-red-700' }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto pt-6 flex flex-col gap-6 h-[calc(100vh-80px)]">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl"><Briefcase className="text-purple-600 dark:text-purple-400" /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Recruitment Pipeline</h1>
              <p className="text-slate-500 text-sm">Track job applicants and manage hiring stages.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2 w-full md:w-auto">
            <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Applicant Name" className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none" />
            <input required type="text" value={role} onChange={e => setRole(e.target.value)} placeholder="Applied Role" className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none" />
            <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 flex items-center gap-2"><UserPlus className="w-4 h-4"/> Add</button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-1 min-h-0 overflow-y-auto pb-6">
          {columns.map(col => (
            <div key={col.id} className={`flex flex-col rounded-2xl border ${col.color} p-4`}>
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="font-bold text-slate-800 dark:text-white">{col.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badge}`}>{data.filter(d => d.status === col.id).length}</span>
              </div>
              
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {data.filter(d => d.status === col.id).map(item => (
                  <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 group">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{item.name}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{item.role}</p>
                        <p className="text-[10px] text-slate-400 mt-2">Applied: {new Date(item.applied_date).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                      <select 
                        value={item.status} 
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                        className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 outline-none text-slate-600 dark:text-slate-300 w-full"
                      >
                        <option value="review">In Review</option>
                        <option value="interview">Interviewing</option>
                        <option value="offer">Offer Extended</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};
export default RecruitPage;
