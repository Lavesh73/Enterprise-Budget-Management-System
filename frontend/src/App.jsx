import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

function App() {
  return (
    <>
      <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 50 }}>
        <AnimatedThemeToggler 
          variant="star" 
          style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: 'var(--card-light)', 
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            border: 'none',
            color: 'var(--text-dark)'
          }}
        />
      </div>
      <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Placeholder for future dashboard */}
        <Route path="/dashboard" element={
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Dashboard</h1>
            <p>Welcome to Enterprise Budget Management System</p>
          </div>
        } />
      </Routes>
    </Router>
    </>
  );
}

export default App;
