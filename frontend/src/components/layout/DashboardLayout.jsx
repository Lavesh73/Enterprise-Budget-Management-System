import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { motion } from 'motion/react';
import { useLocation } from 'react-router-dom';

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  
  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-[#020817] text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-8 pb-32 bg-slate-50 dark:bg-[#020817]">
          <div className="max-w-[1400px] mx-auto">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </div>
        </main>
        <Sidebar />
      </div>
    </div>
  );
};

export default DashboardLayout;
