import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Clock, CheckCircle, Search, Edit2, Trash2, Plus, X } from 'lucide-react';

const AttendancePage = () => {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null); // null = add new
  const [formData, setFormData] = useState({ user_id: '', date: '', check_in_time: '', status: 'present' });

  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
  const isManager = userInfo.role === 'admin' || userInfo.role === 'division_head';

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/modules/attendance', {
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      if (res.ok) setData(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async () => {
    if (!isManager) return;
    try {
      const res = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    fetchData(); 
    fetchUsers();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const myData = isManager ? data.filter(d => String(d.user_id) === String(userInfo.id || userInfo._id)) : data;

  const isToday = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const today = new Date();
    return d.getDate() === today.getDate() && 
           d.getMonth() === today.getMonth() && 
           d.getFullYear() === today.getFullYear();
  };

  const todaysAttendance = myData.find(d => isToday(d.date));
  const hasCheckedInToday = !!todaysAttendance;

  // Countdown Timer Logic
  useEffect(() => {
    if (hasCheckedInToday && todaysAttendance?.created_at) {
      const interval = setInterval(() => {
        const checkInDate = new Date(todaysAttendance.created_at);
        const endTime = new Date(checkInDate.getTime() + 6 * 60 * 60 * 1000); // 6 hours
        const now = new Date();
        const diff = endTime - now;
        
        if (diff <= 0) {
          setTimeLeft('Work Complete');
          clearInterval(interval);
        } else {
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${h}h ${m}m ${s}s remaining`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [hasCheckedInToday, todaysAttendance]);

  const handleCheckIn = async () => {
    if (hasCheckedInToday) return;
    await fetch('http://localhost:5000/api/modules/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
      body: JSON.stringify({ date: todayStr, status: 'present', check_in_time: new Date().toLocaleTimeString() })
    });
    fetchData();
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const url = editingRecord 
      ? `http://localhost:5000/api/modules/attendance/${editingRecord.id}`
      : 'http://localhost:5000/api/modules/attendance';
    const method = editingRecord ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
      body: JSON.stringify(formData)
    });
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    await fetch(`http://localhost:5000/api/modules/attendance/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${userInfo.token}` }
    });
    fetchData();
  };

  const openAddModal = () => {
    setEditingRecord(null);
    setFormData({ user_id: '', date: todayStr, check_in_time: '09:00:00 AM', status: 'present' });
    setShowModal(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setFormData({ 
      user_id: record.user_id, 
      date: new Date(record.date).toISOString().split('T')[0], 
      check_in_time: record.check_in_time || '', 
      status: record.status 
    });
    setShowModal(true);
  };

  const filteredData = data.filter(d => 
    d.user_name?.toLowerCase().includes(search.toLowerCase()) || 
    (d.date && d.date.includes(search))
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto pt-6 flex flex-col gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl"><Clock className="text-green-600 dark:text-green-400" /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Attendance</h1>
              <p className="text-slate-500 text-sm">Daily check-in and timesheet records.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCheckIn} 
              disabled={hasCheckedInToday}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-colors ${hasCheckedInToday ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'}`}>
              {hasCheckedInToday ? (
                <><CheckCircle className="w-5 h-5"/> Checked In ({timeLeft})</>
              ) : 'Check In Now'}
            </button>
            {isManager && (
              <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
                <Plus className="w-5 h-5" /> Add Record
              </button>
            )}
          </div>
        </div>

        {isManager && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-slate-800 dark:text-white">Organization Attendance Log</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search by name or date..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-medium">Employee</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Check-In Time</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredData.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 group">
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">
                        {item.user_name || 'Self'} {item.user_role ? `(${item.user_role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())})` : ''}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.check_in_time || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase ${item.status === 'present' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{item.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(item)} className="p-1.5 text-slate-400 hover:text-blue-500 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-500">No attendance records found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isManager && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4">My Timesheet History</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myData.map(item => (
                <div key={item.id} className="p-4 border border-slate-100 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 flex flex-col gap-2 transition-colors">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-slate-800 dark:text-white">{new Date(item.date).toLocaleDateString()}</p>
                    <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-semibold rounded-full uppercase tracking-wide">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Check-in: <span className="font-medium text-slate-800 dark:text-slate-200">{item.check_in_time || 'N/A'}</span></p>
                  </div>
                </div>
              ))}
              {myData.length === 0 && <p className="text-slate-500 text-sm">No timesheet records found.</p>}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{editingRecord ? 'Edit Record' : 'Add Attendance'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleModalSubmit} className="p-6 flex flex-col gap-4">
              {!editingRecord && (
                <div>
                  <label className="text-xs font-medium text-slate-500 ml-1 mb-1 block">Employee</label>
                  <select required value={formData.user_id} onChange={e => setFormData({...formData, user_id: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none">
                    <option value="">Select Employee...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-slate-500 ml-1 mb-1 block">Date</label>
                <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 ml-1 mb-1 block">Check-In Time</label>
                <input required type="time" step="1" value={formData.check_in_time} onChange={e => setFormData({...formData, check_in_time: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 ml-1 mb-1 block">Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none">
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </div>
              <button type="submit" className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-medium transition-colors">
                {editingRecord ? 'Save Changes' : 'Create Record'}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
export default AttendancePage;
