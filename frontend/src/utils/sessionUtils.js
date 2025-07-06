// Generate a unique session ID (UUID)
export const generateSessionId = () => {
  return crypto.randomUUID();
};

// Session ID management functions
export const saveSessionId = (sessionId) => {
  const existingSessionIds = JSON.parse(localStorage.getItem('sessionIds') || '[]');
  if (!existingSessionIds.includes(sessionId)) {
    existingSessionIds.push(sessionId);
    localStorage.setItem('sessionIds', JSON.stringify(existingSessionIds));
  }
};

export const removeSessionId = (sessionId) => {
  const existingSessionIds = JSON.parse(localStorage.getItem('sessionIds') || '[]');
  const updatedSessionIds = existingSessionIds.filter(id => id !== sessionId);
  localStorage.setItem('sessionIds', JSON.stringify(updatedSessionIds));
};

export const clearAllSessionIds = () => {
  localStorage.removeItem('sessionIds');
};

export const initializeSessionIds = (chatsData) => {
  const sessionIds = Object.values(chatsData).map(chat => chat.sessionId);
  localStorage.setItem('sessionIds', JSON.stringify(sessionIds));
  console.log('Initialized session IDs:', sessionIds);
}; 