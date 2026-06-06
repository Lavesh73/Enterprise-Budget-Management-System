import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import CalendarPage from './pages/CalendarPage';
import NotificationsPage from './pages/NotificationsPage';
import OrgPage from './pages/OrgPage';
import ParkingsPage from './pages/ParkingsPage';
import RecruitPage from './pages/RecruitPage';
import LeavePage from './pages/LeavePage';
import AttendancePage from './pages/AttendancePage';
import PerformancePage from './pages/PerformancePage';
import ProjectsPage from './pages/ProjectsPage';
import BudgetsPage from './pages/BudgetsPage';
import HelpPage from './pages/HelpPage';
import SettingsPage from './pages/SettingsPage';
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

const DashboardRedirect = () => {
  const userInfoStr = localStorage.getItem('userInfo');
  if (!userInfoStr) return <Navigate to="/login" replace />;
  const userInfo = JSON.parse(userInfoStr);
  if (userInfo.role === 'admin') {
    return <Navigate to="/admin-dashboard" replace />;
  }
  return <Navigate to="/employee-dashboard" replace />;
};

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/org" element={<OrgPage />} />
          <Route path="/parkings" element={<ParkingsPage />} />
          <Route path="/recruit" element={<RecruitPage />} />
          <Route path="/leave" element={<LeavePage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
