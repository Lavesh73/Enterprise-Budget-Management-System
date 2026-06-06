import React from 'react';
import { Search, Bell, Command } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

const Topbar = () => {
  const userInfoStr = localStorage.getItem('userInfo');
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;

  return (
    <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-20">
      <nav className="flex items-center gap-6 font-medium text-slate-600 dark:text-slate-300 text-sm h-full">
        <NavLink to="/admin-dashboard" className={({ isActive }) => `pb-7 pt-8 border-b-2 transition-colors ${isActive ? 'text-slate-900 dark:text-white border-blue-600' : 'border-transparent hover:text-slate-900 dark:hover:text-white hover:border-slate-300'}`}>Dashboard</NavLink>
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

        <button className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
          <Bell size={20} />
          <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>

        <div className="flex items-center gap-3 ml-2">
          <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${userInfo?.name || 'User'}`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
