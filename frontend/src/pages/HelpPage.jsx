import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';

const HelpPage = () => {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pt-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-center">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Help & Support</h1>
          <p className="text-slate-500 mb-6">Contact the IT Helpdesk for assistance with the system.</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">Submit a Ticket</button>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default HelpPage;
