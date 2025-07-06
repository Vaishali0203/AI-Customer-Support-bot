import React from 'react';

const ThemeToggleIcon = ({ darkMode = false, size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {darkMode ? (
      // Sun icon for light mode
      <path d="M12 3V4M12 20V21M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H2M22 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    ) : (
      // Moon icon for dark mode
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    )}
  </svg>
);

export default ThemeToggleIcon; 