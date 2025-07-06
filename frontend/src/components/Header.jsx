import React from 'react';
import useBackendHealth from '../hooks/useBackendHealth';

const Header = ({ 
  sidebarCollapsed, 
  onToggleSidebar, 
  darkMode, 
  onToggleDarkMode 
}) => {
  const { isBackendOnline } = useBackendHealth();
  return (
    <div className="chat-header">
      <div className="header-content">
        {sidebarCollapsed && (
          <button className="expand-sidebar-button" onClick={onToggleSidebar} title="Show sidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <div className="logo">
          <div className="logo-icon">🤖</div>
          <div className="logo-text">
            <h1>Ardoq Support</h1>
            <p>AI Assistant</p>
          </div>
        </div>
        <div className="header-controls">
          <button className="dark-mode-toggle" onClick={onToggleDarkMode} title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {darkMode ? (
                <path d="M12 3V4M12 20V21M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H2M22 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              )}
            </svg>
          </button>
          <div className="status-indicator">
            <div className={`status-dot ${isBackendOnline ? 'online' : 'offline'}`}></div>
            <span>{isBackendOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header; 