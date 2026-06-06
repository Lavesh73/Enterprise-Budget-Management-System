import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Car, Trash2, Check } from 'lucide-react';

const ParkingsPage = () => {
  const [data, setData] = useState([]);
  const [vehicle, setVehicle] = useState('');
  const [spot, setSpot] = useState('');
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
  const isAdmin = userInfo.role === 'admin';

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/modules/parkings', {
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      if (res.ok) setData(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:5000/api/modules/parkings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
      body: JSON.stringify({ vehicle_number: vehicle, spot_number: spot, status: 'pending' })
    });
    setVehicle(''); setSpot(''); fetchData();
  };

  const handleUpdateStatus = async (id, status) => {
    await fetch(`http://localhost:5000/api/modules/parkings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Are you sure you want to delete this parking record?')) return;
    await fetch(`http://localhost:5000/api/modules/parkings/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${userInfo.token}` }
    });
    fetchData();
  };

  const myParkings = isAdmin ? data.filter(d => d.user_id === userInfo.id) : data;
  const orgParkings = isAdmin ? data.filter(d => d.user_id !== userInfo.id) : [];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto pt-6 flex flex-col gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl"><Car className="text-blue-600 dark:text-blue-400" /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Parking Management</h1>
              <p className="text-slate-500 text-sm">Request and manage vehicle parking spot assignments.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handleSubmit} className="md:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 h-fit">
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Request Spot</h2>
            <label className="text-xs text-slate-500 ml-1">Vehicle Number</label>
            <input required type="text" value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="e.g. AB-12-CD-3456" className="w-full mb-3 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
            
            <label className="text-xs text-slate-500 ml-1">Preferred Spot</label>
            <input required type="text" value={spot} onChange={e => setSpot(e.target.value)} placeholder="e.g. A-12" className="w-full mb-4 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
            
            <button type="submit" className="w-full bg-blue-600 text-white rounded-xl py-2 font-medium hover:bg-blue-700 transition">Submit Request</button>
          </form>

          <div className="md:col-span-2 flex flex-col gap-6">
            {isAdmin && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Organization Requests</h2>
                <div className="flex flex-col gap-3">
                  {orgParkings.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-4 border border-slate-100 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{item.vehicle_number} <span className="text-xs text-slate-500 font-normal ml-2">{item.user_name || 'Employee'}</span></p>
                        <p className="text-sm text-slate-500">Requested Spot: <span className="font-semibold">{item.spot_number}</span></p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.status === 'pending' ? (
                          <>
                            <button onClick={() => handleUpdateStatus(item.id, 'assigned')} className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100"><Check className="w-4 h-4 inline" /> Assign</button>
                            <button onClick={() => handleUpdateStatus(item.id, 'revoked')} className="text-xs font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100">Reject</button>
                          </>
                        ) : (
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase ${item.status === 'assigned' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{item.status}</span>
                        )}
                        <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                  {orgParkings.length === 0 && <p className="text-slate-500 text-sm">No organization parking requests.</p>}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h2 className="font-semibold text-slate-800 dark:text-white mb-4">My Assigments</h2>
              <div className="flex flex-col gap-3">
                {myParkings.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-4 border border-slate-100 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 group">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">{item.vehicle_number}</p>
                      <p className="text-sm text-slate-500">Spot: <span className="font-semibold">{item.spot_number}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-semibold rounded-full uppercase ${item.status === 'pending' ? 'bg-amber-100 text-amber-700' : item.status === 'revoked' ? 'bg-red-100 text-red-700' : ''}`}>{item.status || 'pending'}</span>
                      {item.status !== 'assigned' && <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>}
                    </div>
                  </div>
                ))}
                {myParkings.length === 0 && <p className="text-slate-500 text-sm">You have no parking assignments.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default ParkingsPage;
