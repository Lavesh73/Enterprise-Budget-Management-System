import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';

const SettingsPage = () => {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pt-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">System Settings</h1>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center p-4 border border-slate-100 dark:border-slate-700 rounded-xl">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">Email Notifications</h3>
                <p className="text-sm text-slate-500">Receive alerts via email.</p>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="flex justify-between items-center p-4 border border-slate-100 dark:border-slate-700 rounded-xl">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">Dark Mode Preference</h3>
                <p className="text-sm text-slate-500">System is currently controlled by the Topbar toggler.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default SettingsPage;
