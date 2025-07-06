import { useState, useEffect } from 'react';

const useResponsiveSidebar = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userManuallyCollapsed, setUserManuallyCollapsed] = useState(false);

  // Check if screen is small based on aspect ratio and dimensions (mobile/tablet)
  const isSmallScreen = () => {
    const aspectRatio = window.innerWidth / window.innerHeight;
    const smallerDimension = Math.min(window.innerWidth, window.innerHeight);
    
    // Portrait or square-ish screens (mobile portrait, tablet portrait)
    if (aspectRatio < 1.0) return true;
    
    // Landscape but with small height (mobile landscape, small tablets)
    if (smallerDimension < 600) return true;
    
    // Wide landscape screens with sufficient height (desktop)
    return false;
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const newCollapsed = !prev;
      setUserManuallyCollapsed(newCollapsed);
      return newCollapsed;
    });
  };

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      const smallScreen = isSmallScreen();
      
      if (smallScreen && !userManuallyCollapsed) {
        // Auto-collapse on small screens unless user manually collapsed
        setSidebarCollapsed(true);
      } else if (!smallScreen && !userManuallyCollapsed) {
        // Auto-expand on large screens unless user manually collapsed
        setSidebarCollapsed(false);
      }
      // If user manually collapsed, respect their choice regardless of screen size
    };

    // Set initial state based on screen size
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [userManuallyCollapsed]);

  // Reset user preference when they manually expand on small screen
  useEffect(() => {
    if (!sidebarCollapsed && isSmallScreen()) {
      setUserManuallyCollapsed(false);
    }
  }, [sidebarCollapsed]);

  return {
    sidebarCollapsed,
    toggleSidebar
  };
};

export default useResponsiveSidebar; 