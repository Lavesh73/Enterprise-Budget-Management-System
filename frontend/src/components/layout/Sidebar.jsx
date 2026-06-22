import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Car, Briefcase, MessageSquare, HelpCircle, Settings } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { name: 'Projects', icon: <Briefcase size={20} />, path: '/projects' },
    { name: 'Org.', icon: <Users size={20} />, path: '/org' },
    { name: 'Calendar', icon: <Calendar size={20} />, path: '/calendar' },
    { name: 'Parkings', icon: <Car size={20} />, path: '/parkings' },
    { name: 'Notifications', icon: <MessageSquare size={20} />, path: '/notifications' },
  ];

  const bottomItems = [
    { name: 'Help', icon: <HelpCircle size={20} />, path: '/help' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/settings' },
  ];

  const location = useLocation();
  const isProjectOpen = location.pathname.startsWith('/projects/') && location.pathname !== '/projects';

  return (
    <div className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out ${isProjectOpen ? 'bottom-2 scale-75 opacity-70 hover:opacity-100 hover:scale-[0.8]' : 'bottom-6 scale-100 opacity-100'}`}>
      <nav className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border border-white/20 dark:border-slate-700/50">
        {[...navItems, { isDivider: true }, ...bottomItems].map((item, idx) => {
          if (item.isDivider) {
            return <div key={`divider-${idx}`} className="w-px h-10 bg-slate-200 dark:bg-slate-700 mx-2"></div>;
          }
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 hover:scale-110 hover:-translate-y-2 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              {item.icon}
              {/* macOS-style Tooltip */}
              <span className="absolute -top-12 scale-0 group-hover:scale-100 origin-bottom transition-all duration-200 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-semibold py-1.5 px-3 rounded-lg shadow-lg pointer-events-none whitespace-nowrap">
                {item.name}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-100 rotate-45"></div>
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
