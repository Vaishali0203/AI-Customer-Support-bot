import React from 'react';
import useBackendHealth from '../hooks/useBackendHealth';
import { MenuIcon, ThemeToggleIcon } from '../icons';

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
            <MenuIcon size={20} />
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
            <ThemeToggleIcon darkMode={darkMode} size={18} />
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