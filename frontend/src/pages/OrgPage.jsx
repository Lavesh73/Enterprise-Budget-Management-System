import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Users } from 'lucide-react';

const OrgPage = () => {
  const [groups, setGroups] = useState([]);
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/groups', {
          headers: { 'Authorization': `Bearer ${userInfo.token}` }
        });
        if (res.ok) setGroups(await res.json());
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto pt-6 flex flex-col gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl"><Users className="text-indigo-600 dark:text-indigo-400" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Organization Directory</h1>
            <p className="text-slate-500 text-sm">Company hierarchy and teams.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map(group => (
            <div key={group.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{group.name}</h2>
              <p className="text-slate-500 text-sm mb-4">{group.description}</p>
              <div className="h-px w-full bg-slate-100 dark:bg-slate-700 mb-4"></div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Department members will be listed here.</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};
export default OrgPage;
