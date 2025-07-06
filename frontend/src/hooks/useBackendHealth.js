import { useState, useEffect } from 'react';
import axios from 'axios';

const useBackendHealth = () => {
  const [isBackendOnline, setIsBackendOnline] = useState(true);

  // Backend health check function
  const checkBackendHealth = async () => {
    try {
      const response = await axios.get("http://localhost:8000/health", {
        timeout: 5000 // 5 second timeout
      });
      setIsBackendOnline(response.status === 200);
    } catch (error) {
      setIsBackendOnline(false);
    }
  };

  // Monitor backend health
  useEffect(() => {
    // Check immediately on mount
    checkBackendHealth();
    
    // Set up interval to check every 30 seconds
    const healthCheckInterval = setInterval(checkBackendHealth, 30000);
    
    // Cleanup interval on unmount
    return () => clearInterval(healthCheckInterval);
  }, []);

  return { isBackendOnline, setIsBackendOnline, checkBackendHealth };
};

export default useBackendHealth; 