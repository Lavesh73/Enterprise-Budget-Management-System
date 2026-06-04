import React from 'react';

import { NeonGradientCard } from './ui/neon-gradient-card';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div style={{ width: '900px', maxWidth: '95%', height: '600px' }}>
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
  );
};

export default AuthLayout;
