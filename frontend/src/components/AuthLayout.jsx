import { NeonGradientCard } from './ui/neon-gradient-card';
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="w-full min-h-screen flex items-center justify-center relative bg-slate-50 dark:bg-transparent text-slate-900 dark:text-white">
      <div className="absolute top-6 right-6 z-50">
        <AnimatedThemeToggler 
          variant="star" 
          style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: 'var(--tw-bg-opacity, rgba(255, 255, 255, 0.1))',
            cursor: 'pointer',
            border: '1px solid rgba(150, 150, 150, 0.2)',
            color: 'inherit',
            backdropFilter: 'blur(10px)'
          }}
        />
      </div>
      <div style={{ width: '900px', maxWidth: '95%', height: '600px' }} className="relative z-10">
        <NeonGradientCard className="w-full h-full" borderRadius={24} borderSize={4}>
          <div className="auth-container" style={{ width: '100%', height: '100%', boxShadow: 'none', borderRadius: 'inherit' }}>
            <div className="auth-left">
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            <div className="auth-right">
              {children}
            </div>
          </div>
        </NeonGradientCard>
      </div>
    </div>
  );
};

export default AuthLayout;
