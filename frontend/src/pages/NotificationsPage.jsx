import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { AnimatedList } from "@/components/ui/animated-list";
import { Plus, Trash2 } from 'lucide-react';
import { NotificationModal } from '../components/FeatureModals';
import { cn } from "@/lib/utils";

const DynamicNotification = ({ id, name, description, icon, color, time, onDelete }) => {
  return (
    <figure className={cn("group relative mx-auto min-h-fit w-full max-w-[500px] overflow-hidden rounded-2xl p-4", "transition-all duration-200 ease-in-out hover:scale-[103%]", "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]", "transform-gpu dark:bg-transparent dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)]")}>
      <div className="flex flex-row items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl" style={{ backgroundColor: color }}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center text-lg font-medium whitespace-pre dark:text-white">
            <span className="text-base sm:text-lg">{name}</span>
            <span className="mx-2 text-slate-300 dark:text-slate-600">•</span>
            <span className="text-sm text-slate-500">{time}</span>
          </figcaption>
          <p className="text-sm font-normal dark:text-white/60">{description}</p>
        </div>
        <button onClick={onDelete} className="ml-auto text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"><Trash2 className="w-4 h-4"/></button>
      </div>
    </figure>
  )
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

  const fetchNotifications = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/features/notifications', {
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/features/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto pt-6">
        <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Notifications</h1>
            <p className="text-slate-500 text-sm mt-1">Live system broadcasts and alerts.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Plus size={18} />
            Push Notification
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-[#020817] p-8 rounded-3xl min-h-[500px] flex justify-center items-start">
          <div className="w-full max-w-[500px]">
            <AnimatedList>
              {notifications.map((item, idx) => (
                <DynamicNotification {...item} key={item.id || idx} onDelete={() => handleDelete(item.id)} />
              ))}
              {notifications.length === 0 && (
                <p className="text-center text-slate-500 mt-10">No notifications yet. Try pushing one!</p>
              )}
            </AnimatedList>
          </div>
        </div>
      </div>

      <NotificationModal isOpen={showModal} onClose={() => setShowModal(false)} onAdd={fetchNotifications} userInfo={userInfo} />
    </DashboardLayout>
  );
};

export default NotificationsPage;
