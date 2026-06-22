import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Star, MessageSquarePlus, Trash2 } from 'lucide-react';

const PerformancePage = () => {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [targetUser, setTargetUser] = useState('');
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
  const isManager = userInfo.role === 'admin' || userInfo.role === 'division_head';

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/modules/performance', {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:5000/api/modules/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
      // overriding user_id from token via backend isn't great if admin is submitting for someone else. 
      // wait, the backend `create` forces user_id = req.user.id. That's a problem for managers submitting.
      // I'll send it as `reviewee_id` or similar if the backend allowed it.
      // Ah! In modulesController.js: `if (['parkings', 'leaves', 'attendance', 'performance'].includes(module)) { data.user_id = req.user.id; }`
      // Wait, if it's admin, they don't get forced! Let's look at `modulesController.js`:
      // The `create` method doesn't exclude admin from `data.user_id = req.user.id`. 
      // I will send `user_id: targetUser` and it might be overwritten. I'll need to fix modulesController.js!
      // I'll fix the backend right after this!
      body: JSON.stringify({ user_id: targetUser, rating, feedback, review_date: new Date().toISOString().split('T')[0] })
    });
    setTargetUser(''); setRating(5); setFeedback(''); fetchData();
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this review?')) return;
    await fetch(`http://localhost:5000/api/modules/performance/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${userInfo.token}` }
    });
    fetchData();
  };

  const myReviews = isManager ? data.filter(d => d.user_id === userInfo.id) : data;
  const teamReviews = isManager ? data.filter(d => d.user_id !== userInfo.id) : [];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto pt-6 flex flex-col gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl"><Star className="text-yellow-600 dark:text-yellow-400" /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Performance Management</h1>
              <p className="text-slate-500 text-sm">View and manage employee performance reviews.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isManager && (
            <form onSubmit={handleSubmit} className="md:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 h-fit">
              <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Submit Review</h2>
              
              <label className="text-xs text-slate-500 ml-1">Employee</label>
              <select required value={targetUser} onChange={e => setTargetUser(e.target.value)} className="w-full mb-3 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                <option value="">Select Employee...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>

              <label className="text-xs text-slate-500 ml-1">Rating (1-5)</label>
              <input required type="number" min="1" max="5" value={rating} onChange={e => setRating(e.target.value)} className="w-full mb-3 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
              
              <label className="text-xs text-slate-500 ml-1">Feedback</label>
              <textarea required value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Constructive feedback..." className="w-full mb-4 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm min-h-[100px]" />
              
              <button type="submit" className="w-full bg-yellow-500 text-white rounded-xl py-2 font-medium hover:bg-yellow-600 transition flex items-center justify-center gap-2"><MessageSquarePlus className="w-4 h-4"/> Submit Review</button>
            </form>
          )}

          <div className={`flex flex-col gap-6 ${isManager ? 'md:col-span-2' : 'md:col-span-3'}`}>
            {isManager && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Team Performance Records</h2>
                <div className="flex flex-col gap-3">
                  {teamReviews.map(item => (
                    <div key={item.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 group">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">{item.user_name || 'Employee'}</p>
                          <span className="text-xs text-slate-500">{new Date(item.review_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex gap-0.5 text-yellow-400">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4" fill={i < item.rating ? "currentColor" : "none"} />)}
                          </div>
                          <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{item.feedback}</p>
                    </div>
                  ))}
                  {teamReviews.length === 0 && <p className="text-slate-500 text-sm">No team reviews found.</p>}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h2 className="font-semibold text-slate-800 dark:text-white mb-4">My Reviews</h2>
              <div className="flex flex-col gap-3">
                {myReviews.map(item => (
                  <div key={item.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-slate-500">{new Date(item.review_date).toLocaleDateString()}</span>
                      <div className="flex gap-0.5 text-yellow-400">
                        {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4" fill={i < item.rating ? "currentColor" : "none"} />)}
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{item.feedback}</p>
                  </div>
                ))}
                {myReviews.length === 0 && <p className="text-slate-500 text-sm">You have not received any performance reviews.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default PerformancePage;
