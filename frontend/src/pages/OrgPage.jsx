import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Users, Mail, Shield } from 'lucide-react';

const OrgPage = () => {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsRes, usersRes] = await Promise.all([
          fetch('http://localhost:5000/api/admin/groups', {
            headers: { 'Authorization': `Bearer ${userInfo.token}` }
          }),
          fetch('http://localhost:5000/api/admin/users', {
            headers: { 'Authorization': `Bearer ${userInfo.token}` }
          })
        ]);

        if (groupsRes.ok) setGroups(await groupsRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
      } catch (err) { console.error(err); }
    };
    if (userInfo.token) fetchData();
  }, []);

  const unassignedUsers = users.filter(u => !u.group_id && u.role !== 'admin');

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          {groups.map(group => {
            const groupMembers = users.filter(u => u.group_id == group.id);
            return (
              <div key={group.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{group.name}</h2>
                <p className="text-slate-500 text-sm mb-4">{group.description || 'No description available.'}</p>
                <div className="h-px w-full bg-slate-100 dark:bg-slate-700 mb-4"></div>
                
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Team Members ({groupMembers.length})
                </h3>
                
                {groupMembers.length > 0 ? (
                  <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {groupMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors group/item">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs group-hover/item:scale-110 transition-transform">
                            {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{member.name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <Mail className="w-3 h-3" /> {member.email}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                          member.role === 'division_head' 
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                            : member.role === 'group_head'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {member.role ? member.role.replace('_', ' ') : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50 text-center">No members assigned to this group yet.</p>
                )}
              </div>
            );
          })}

          {unassignedUsers.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 border-dashed hover:shadow-md transition-shadow">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" /> Unassigned & Leadership
              </h2>
              <p className="text-slate-500 text-sm mb-4">Users not currently in a specific project group.</p>
              <div className="h-px w-full bg-slate-100 dark:bg-slate-700 mb-4"></div>
              
              <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {unassignedUsers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-amber-200 dark:hover:border-amber-800/50 transition-colors group/item">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs group-hover/item:scale-110 transition-transform">
                        {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{member.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3" /> {member.email}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                      member.role === 'division_head' 
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                        : member.role === 'group_head'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {member.role ? member.role.replace('_', ' ') : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
export default OrgPage;
