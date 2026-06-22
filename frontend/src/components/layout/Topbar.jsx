import { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, LogOut, Check, Loader2, Sparkles, LayoutDashboard, Folder, DollarSign, Receipt, Calendar, CalendarMinus, TrendingUp, Settings, HelpCircle, UserCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

const appPages = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', path: '/projects', icon: Folder },
  { name: 'Budgets', path: '/budgets', icon: DollarSign },
  { name: 'Expenditures', path: '/expenditures', icon: Receipt },
  { name: 'Profile', path: '/profile', icon: UserCircle },
  { name: 'Attendance', path: '/attendance', icon: Calendar },
  { name: 'Leave', path: '/leave', icon: CalendarMinus },
  { name: 'Performance', path: '/performance', icon: TrendingUp },
  { name: 'Settings', path: '/settings', icon: Settings },
  { name: 'Help', path: '/help', icon: HelpCircle },
];

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchMode, setSearchMode] = useState('local');
  const [isFocused, setIsFocused] = useState(false);
  
  const notifRef = useRef();
  const profileRef = useRef();
  const searchRef = useRef();

  useEffect(() => {
    // Handle click outside to close dropdowns
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchDropdown(false);
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

  const filteredPages = appPages.filter(page => 
    page.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      if (searchMode === 'local') {
        if (filteredPages.length > 0) {
          navigate(filteredPages[0].path);
          setShowSearchDropdown(false);
          setSearchQuery('');
        }
      } else {
        setIsSearching(true);
        setShowSearchDropdown(true);
        setSearchResult('');
        
        try {
        const response = await fetch('http://localhost:5000/api/gemini/search', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(userInfo?.token ? { 'Authorization': `Bearer ${userInfo.token}` } : {})
          },
          body: JSON.stringify({ query: searchQuery })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setSearchResult(data.response);
        } else {
          setSearchResult(`Error: ${data.message}`);
        }
      } catch (error) {
        setSearchResult('An error occurred while fetching the response.');
        console.error(error);
      } finally {
        setIsSearching(false);
      }
    }
  }
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
        <div className="relative" ref={searchRef}>
          <div 
            className={`relative flex items-center transition-all duration-300 ease-in-out ${
              isFocused || searchQuery || searchMode === 'gemini' ? 'w-[400px]' : 'w-72'
            }`}
          >
            <Search className={`absolute left-3 transition-colors ${searchMode === 'gemini' ? 'text-blue-500' : 'text-slate-400'}`} size={16} />
            <input 
              type="text" 
              placeholder={searchMode === 'gemini' ? "Ask Gemini anything..." : "Search pages..."}
              value={searchQuery}
              onFocus={() => { setIsFocused(true); setShowSearchDropdown(true); }}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onKeyDown={handleSearch}
              className={`pl-10 pr-24 py-2.5 bg-slate-100 dark:bg-slate-800 border focus:bg-white dark:focus:bg-slate-900 rounded-full w-full text-sm transition-all outline-none text-slate-700 dark:text-slate-200 ${
                searchMode === 'gemini' 
                  ? 'border-blue-200 focus:border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                  : 'border-transparent focus:border-blue-500'
              }`}
            />
            
            <div className="absolute right-2 flex items-center gap-1">
              {searchMode === 'local' ? (
                <button 
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input blur
                    setSearchMode('gemini');
                    setSearchQuery('');
                    setSearchResult('');
                    setTimeout(() => searchRef.current?.querySelector('input')?.focus(), 0);
                  }}
                  className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all"
                >
                  <Sparkles size={12} /> AI
                </button>
              ) : (
                <button 
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearchMode('local');
                    setSearchQuery('');
                    setTimeout(() => searchRef.current?.querySelector('input')?.focus(), 0);
                  }}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Exit AI
                </button>
              )}
            </div>
          </div>

          {/* Search Dropdown */}
          {showSearchDropdown && (searchQuery || searchMode === 'gemini') && (
            <div className={`absolute left-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[500px] transition-all duration-300 ${
              isFocused || searchQuery || searchMode === 'gemini' ? 'w-[450px]' : 'w-[350px]'
            }`}>
              {searchMode === 'gemini' ? (
                <>
                  <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">Gemini AI Assistant</h3>
                    </div>
                  </div>
                  <div className="p-4 overflow-y-auto flex-1 text-sm text-slate-700 dark:text-slate-300">
                    {isSearching ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <Loader2 size={24} className="animate-spin text-blue-500" />
                        <p className="text-slate-500 animate-pulse">Thinking...</p>
                      </div>
                    ) : searchResult ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{searchResult}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-center py-4">Type your question and press Enter.</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-2 overflow-y-auto max-h-[350px]">
                  {filteredPages.length > 0 ? (
                    filteredPages.map(page => {
                      const Icon = page.icon;
                      return (
                        <button
                          key={page.path}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            navigate(page.path);
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                            <Icon size={16} />
                          </div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{page.name}</span>
                        </button>
                      );
                    })
                  ) : (
                    <p className="p-4 text-center text-sm text-slate-500">No pages found matching "{searchQuery}"</p>
                  )}
                </div>
              )}
            </div>
          )}
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
