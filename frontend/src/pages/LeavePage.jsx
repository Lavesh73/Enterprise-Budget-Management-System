import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Calendar, Check, X, Trash2 } from 'lucide-react';

const LeavePage = () => {
  const [data, setData] = useState([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
  const isManager = userInfo.role === 'admin' || userInfo.role === 'division_head';

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/modules/leaves', {
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      if (res.ok) setData(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:5000/api/modules/leaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
      body: JSON.stringify({ start_date: start, end_date: end, reason })
    });
    setStart(''); setEnd(''); setReason(''); fetchData();
  };

  const handleUpdateStatus = async (id, status) => {
    await fetch(`http://localhost:5000/api/modules/leaves/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Are you sure you want to delete this request?')) return;
    await fetch(`http://localhost:5000/api/modules/leaves/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${userInfo.token}` }
    });
    fetchData();
  };

  const myLeaves = isManager ? data.filter(d => d.user_id === userInfo.id) : data;
  const teamLeaves = isManager ? data.filter(d => d.user_id !== userInfo.id) : [];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto pt-6 flex flex-col gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl"><Calendar className="text-purple-600 dark:text-purple-400" /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Leave Management</h1>
              <p className="text-slate-500 text-sm">Apply for leave and track approval status.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handleSubmit} className="md:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 h-fit">
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Apply for Leave</h2>
            <label className="text-xs text-slate-500 ml-1">Start Date</label>
            <input required type="date" value={start} onChange={e => setStart(e.target.value)} className="w-full mb-3 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
            
            <label className="text-xs text-slate-500 ml-1">End Date</label>
            <input required type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full mb-3 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
            
            <textarea required value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for leave..." className="w-full mb-4 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
            <button type="submit" className="w-full bg-purple-600 text-white rounded-xl py-2 font-medium hover:bg-purple-700 transition">Submit Request</button>
          </form>

          <div className="md:col-span-2 flex flex-col gap-6">
            {isManager && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Team Leave Requests</h2>
                <div className="flex flex-col gap-3">
                  {teamLeaves.map(item => (
                    <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{item.user_name || 'Employee'} <span className="text-xs text-slate-500 font-normal ml-2">From {new Date(item.start_date).toLocaleDateString()} to {new Date(item.end_date).toLocaleDateString()}</span></p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{item.reason}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-3 sm:mt-0">
                        {item.status === 'pending' ? (
                          <>
                            <button onClick={() => handleUpdateStatus(item.id, 'approved')} className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition"><Check className="w-4 h-4"/> Approve</button>
                            <button onClick={() => handleUpdateStatus(item.id, 'rejected')} className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded-lg hover:bg-red-100 transition"><X className="w-4 h-4"/> Reject</button>
                          </>
                        ) : (
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase ${item.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{item.status}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {teamLeaves.length === 0 && <p className="text-slate-500 text-sm">No team leave requests.</p>}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h2 className="font-semibold text-slate-800 dark:text-white mb-4">My Leave History</h2>
              <div className="flex flex-col gap-3">
                {myLeaves.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-4 border border-slate-100 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">From {new Date(item.start_date).toLocaleDateString()} to {new Date(item.end_date).toLocaleDateString()}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{item.reason}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase
                        ${item.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                          item.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                          'bg-amber-100 text-amber-700'}`}>
                        {item.status}
                      </span>
                      {item.status === 'pending' && (
                        <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>
                ))}
                {myLeaves.length === 0 && <p className="text-slate-500 text-sm">You have not requested any leaves.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default LeavePage;
