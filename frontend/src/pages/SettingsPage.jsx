import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Toast from '../components/ui/Toast';

const SettingsPage = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
  const [settings, setSettings] = useState({
    email_notifications: true,
    theme_preference: 'system'
  });
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${userInfo.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSettings({
            email_notifications: data.email_notifications ?? true,
            theme_preference: data.theme_preference || 'system'
          });
        }
      } catch (err) { console.error(err); }
    };
    if (userInfo.token) fetchSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      const res = await fetch('http://localhost:5000/api/auth/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}` 
        },
        body: JSON.stringify({ [key]: value })
      });
      if (res.ok) {
        showToast('Settings saved successfully');
        if (key === 'theme_preference') {
          // Dispatch event or update global class
          if (value === 'dark') document.documentElement.classList.add('dark');
          else if (value === 'light') document.documentElement.classList.remove('dark');
          else {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
          localStorage.setItem('theme', value);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving settings');
    }
  };

  return (
    <DashboardLayout>
      <Toast message={toast} />
      <div className="max-w-4xl mx-auto pt-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">System Settings</h1>
          <div className="flex flex-col gap-4">
            
            <div className="flex justify-between items-center p-4 border border-slate-100 dark:border-slate-700 rounded-xl">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">Email Notifications</h3>
                <p className="text-sm text-slate-500">Receive alerts via email.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.email_notifications} 
                  onChange={(e) => updateSetting('email_notifications', e.target.checked)} 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex justify-between items-center p-4 border border-slate-100 dark:border-slate-700 rounded-xl">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">Dark Mode Preference</h3>
                <p className="text-sm text-slate-500">Choose your interface theme.</p>
              </div>
              <select 
                value={settings.theme_preference}
                onChange={(e) => updateSetting('theme_preference', e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
              </select>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default SettingsPage;
