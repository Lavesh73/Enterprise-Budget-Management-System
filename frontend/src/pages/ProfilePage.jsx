import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Camera, CheckCircle2, User as UserIcon, Lock, Mail, Save } from 'lucide-react';
import Toast from '../components/ui/Toast';

const ProfilePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [userInfo, setUserInfo] = useState(() => {
    const str = localStorage.getItem('userInfo');
    return str ? JSON.parse(str) : null;
  });

  const [formData, setFormData] = useState({
    name: userInfo?.name || '',
    password: '',
    confirmPassword: '',
    avatar: userInfo?.avatar || ''
  });

  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!userInfo) navigate('/login');
  }, [userInfo, navigate]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
        body: JSON.stringify({
          name: formData.name,
          password: formData.password || undefined,
          avatar: formData.avatar
        })
      });

      const data = await response.json();
      if (response.ok) {
        // Update local storage
        const updatedUser = { ...userInfo, name: data.name, avatar: data.avatar, token: data.token };
        localStorage.setItem('userInfo', JSON.stringify(updatedUser));
        setUserInfo(updatedUser);
        
        // Dispatch event for Topbar to pick up changes
        window.dispatchEvent(new Event('profileUpdated'));

        setFormData({ ...formData, password: '', confirmPassword: '' });
        showToast('Profile updated successfully! Redirecting...');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        showToast(data.message || 'Error updating profile');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error');
    }
  };

  if (!userInfo) return null;

  return (
    <DashboardLayout>
      <Toast message={toast} />

      <div className="max-w-3xl mx-auto mt-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">My Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">Manage your personal information and credentials.</p>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
              <div className="w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-900 border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden">
                <img 
                  src={formData.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${userInfo.name}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={32} />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageChange}
              />
            </div>
            <p className="text-xs text-slate-500 mt-3">Click to change profile picture</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Read-only info */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Mail size={16} className="text-blue-500" /> Email Address
              </label>
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed">
                {userInfo.email}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <UserIcon size={16} className="text-blue-500" /> Username
              </label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                required
              />
            </div>

            {/* Password section */}
            <div className="md:col-span-2 pt-6 border-t border-slate-100 dark:border-slate-700/50">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <Lock size={18} className="text-slate-400" /> Change Password
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">New Password</label>
                  <input 
                    type="password" 
                    placeholder="Leave blank to keep current"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Confirm New Password</label>
                  <input 
                    type="password" 
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-end">
            <button 
              type="submit" 
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5"
            >
              <Save size={18} /> Save Changes
            </button>
          </div>

        </form>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
