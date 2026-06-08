import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Command, User, LogOut, Check } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

const Topbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState(() => {
    const str = localStorage.getItem('userInfo');
    return str ? JSON.parse(str) : null;
  });
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const notifRef = useRef();
  const profileRef = useRef();

  useEffect(() => {
    // Handle click outside to close dropdowns
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (userInfo?.token) {
      fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch(err => console.error(err));
    }
    
    // Listen for custom event to update profile avatar across components
    const handleProfileUpdate = () => {
      const str = localStorage.getItem('userInfo');
      if (str) setUserInfo(JSON.parse(str));
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, [userInfo?.token]);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-20">
      <nav className="flex items-center gap-6 font-medium text-slate-600 dark:text-slate-300 text-sm h-full">
        <NavLink to="/dashboard" className={({ isActive }) => `pb-7 pt-8 border-b-2 transition-colors ${isActive || location.pathname.includes('dashboard') ? 'text-slate-900 dark:text-white border-blue-600' : 'border-transparent hover:text-slate-900 dark:hover:text-white hover:border-slate-300'}`}>Dashboard</NavLink>
        <NavLink to="/leave" className={({ isActive }) => `pb-7 pt-8 border-b-2 transition-colors ${isActive ? 'text-slate-900 dark:text-white border-blue-600' : 'border-transparent hover:text-slate-900 dark:hover:text-white hover:border-slate-300'}`}>Leave</NavLink>
        <NavLink to="/attendance" className={({ isActive }) => `pb-7 pt-8 border-b-2 transition-colors ${isActive ? 'text-slate-900 dark:text-white border-blue-600' : 'border-transparent hover:text-slate-900 dark:hover:text-white hover:border-slate-300'}`}>Attendance</NavLink>
        <NavLink to="/performance" className={({ isActive }) => `px-4 py-2 rounded-full transition-colors ${isActive ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50'}`}>Performance</NavLink>
      </nav>

      <div className="flex items-center gap-6">
        <div className="relative flex items-center">
          <Search className="absolute left-3 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="pl-10 pr-14 py-2.5 bg-slate-100 dark:bg-slate-800 border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 rounded-full w-72 text-sm transition-all outline-none text-slate-700 dark:text-slate-200"
          />
          <div className="absolute right-2 flex items-center gap-1 text-slate-400 text-[11px] font-semibold bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
            <Command size={12} /> F
          </div>
        </div>

        <AnimatedThemeToggler 
          variant="star" 
          style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: 'transparent',
            cursor: 'pointer',
            border: 'none',
            color: 'inherit'
          }}
        />

        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            )}
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full font-semibold">{unreadCount} new</span>}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-6 text-center text-sm text-slate-500">No notifications yet.</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${!n.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                      <p className="text-sm text-slate-800 dark:text-slate-200">{n.name}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</span>
                        {!n.is_read && (
                          <button onClick={() => markAsRead(n.id)} className="text-[10px] text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1">
                            <Check size={12} /> Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 ml-2 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm transition-transform hover:scale-105">
              <img src={userInfo?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${userInfo?.name || 'User'}`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
          
          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden py-2">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 mb-2">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{userInfo?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{userInfo?.email}</p>
              </div>
              <NavLink to="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <User size={16} /> My Profile
              </NavLink>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
