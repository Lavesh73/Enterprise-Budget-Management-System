import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Calendar } from "@/components/ui/calendar";
import { Plus, Trash2 } from 'lucide-react';
import { ReminderModal } from '../components/FeatureModals';

const CalendarPage = () => {
  const [reminders, setReminders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

  const fetchReminders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/features/reminders', {
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      if (res.ok) {
        setReminders(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await fetch(`http://localhost:5000/api/features/reminders/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      fetchReminders();
    } catch (err) { console.error(err); }
  };

  const reminderDates = reminders.map(r => new Date(r.date));

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto pt-6">
        <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Calendar</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your schedule and reminders.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Plus size={18} />
            Add Reminder
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-center">
            <Calendar
              mode="multiple"
              selected={reminderDates}
              className="scale-110"
            />
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Upcoming Reminders</h2>
            <div className="flex flex-col gap-4">
              {reminders.length === 0 ? (
                <p className="text-slate-500 italic">No upcoming reminders.</p>
              ) : (
                reminders.map((rem, idx) => (
                  <div key={idx} className="group flex justify-between items-center p-4 border border-slate-100 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg w-16 h-16 shrink-0">
                        <span className="text-sm font-bold uppercase">{new Date(rem.date).toLocaleString('en-us', { month: 'short' })}</span>
                        <span className="text-xl font-black">{new Date(rem.date).getDate()}</span>
                      </div>
                      <div className="flex flex-col justify-center">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">{rem.title}</h3>
                        {rem.description && <p className="text-sm text-slate-500 mt-1">{rem.description}</p>}
                      </div>
                    </div>
                    <button onClick={() => handleDelete(rem.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"><Trash2 className="w-5 h-5"/></button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <ReminderModal isOpen={showModal} onClose={() => setShowModal(false)} onAdd={fetchReminders} userInfo={userInfo} />
    </DashboardLayout>
  );
};

export default CalendarPage;
