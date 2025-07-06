import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import ChatInput from "./ChatInput";
import Message from "./Message";
import "../css/App.css";

function App() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [expandedReferences, setExpandedReferences] = useState(new Set());
  const [chats, setChats] = useState({});
  const [activeChat, setActiveChat] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userManuallyCollapsed, setUserManuallyCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const chatEndRef = useRef(null);

  // Generate a unique session ID (UUID)
  const generateSessionId = () => {
    return crypto.randomUUID();
  };

  // Session ID management functions
  const saveSessionId = (sessionId) => {
    const existingSessionIds = JSON.parse(localStorage.getItem('sessionIds') || '[]');
    if (!existingSessionIds.includes(sessionId)) {
      existingSessionIds.push(sessionId);
      localStorage.setItem('sessionIds', JSON.stringify(existingSessionIds));
    }
  };

  const removeSessionId = (sessionId) => {
    const existingSessionIds = JSON.parse(localStorage.getItem('sessionIds') || '[]');
    const updatedSessionIds = existingSessionIds.filter(id => id !== sessionId);
    localStorage.setItem('sessionIds', JSON.stringify(updatedSessionIds));
  };

  const clearAllSessionIds = () => {
    localStorage.removeItem('sessionIds');
  };

  const initializeSessionIds = (chatsData) => {
    const sessionIds = Object.values(chatsData).map(chat => chat.sessionId);
    localStorage.setItem('sessionIds', JSON.stringify(sessionIds));
    console.log('Initialized session IDs:', sessionIds);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newDarkMode = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
      return newDarkMode;
    });
  };

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const newCollapsed = !prev;
      setUserManuallyCollapsed(newCollapsed);
      return newCollapsed;
    });
  };

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

  // Create a new chat
  const createNewChat = useCallback(() => {
    const newChatId = generateSessionId();
    const newChat = {
      id: newChatId,
      sessionId: newChatId,
      messages: [],
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    // Save the session ID to localStorage
    saveSessionId(newChatId);
    
    setChats(prev => ({
      ...prev,
      [newChatId]: newChat
    }));
    
    setActiveChat(newChatId);
    setExpandedReferences(new Set());
    return { chatId: newChatId, chat: newChat };
  }, []);

  // Load chat history when switching chats
  const loadChatHistory = useCallback(async (chatId) => {
    if (!chats[chatId]) return;
    
    const chat = chats[chatId];
    // Only fetch if messages are empty (avoid refetching)
    if (chat.messages.length === 0) {
      try {
        const response = await axios.get(`http://localhost:8000/chat/history?session_id=${chat.sessionId}&limit=10`);
        const historyData = response.data.history || [];
        
        if (historyData.length > 0) {
          // Convert history format to message format
          const messages = [];
          historyData.forEach(item => {
            // Add user message
            messages.push({
              sender: "user",
              text: item.question,
              timestamp: new Date(item.timestamp)
            });
            // Add bot response
            messages.push({
              sender: "bot",
              text: item.answer,
              timestamp: new Date(item.timestamp),
              references: []
            });
          });

          setChats(prev => ({
            ...prev,
            [chatId]: {
              ...prev[chatId],
              messages: messages,
              lastActivity: new Date().toISOString()
            }
          }));
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    }
  }, [chats]);

  // Initialize chats from localStorage
  useEffect(() => {
    const storedChats = localStorage.getItem('chats');
    const storedActiveChat = localStorage.getItem('activeChat');
    
    if (storedChats) {
      const parsedChats = JSON.parse(storedChats);
      setChats(parsedChats);
      
      // Initialize session IDs from existing chats
      initializeSessionIds(parsedChats);
      
      if (storedActiveChat && parsedChats[storedActiveChat]) {
        setActiveChat(storedActiveChat);
      } else {
        // Set first chat as active if stored active chat doesn't exist
        const firstChatId = Object.keys(parsedChats)[0];
        if (firstChatId) {
          setActiveChat(firstChatId);
        }
      }
    }
    // Don't create chat automatically - wait for first message
  }, []);

  // Load chat history when activeChat changes
  useEffect(() => {
    if (activeChat && chats[activeChat] && chats[activeChat].messages.length === 0) {
      loadChatHistory(activeChat);
    }
  }, [activeChat, chats, loadChatHistory]);

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    if (Object.keys(chats).length > 0) {
      localStorage.setItem('chats', JSON.stringify(chats));
    } else {
      // Clear localStorage when no chats remain
      localStorage.removeItem('chats');
      localStorage.removeItem('activeChat');
    }
  }, [chats]);

  // Save active chat to localStorage whenever it changes
  useEffect(() => {
    if (activeChat) {
      localStorage.setItem('activeChat', activeChat);
    } else {
      localStorage.removeItem('activeChat');
    }
  }, [activeChat]);

  // Get current chat
  const getCurrentChat = () => {
    return activeChat ? chats[activeChat] : null;
  };

  // Switch to a different chat
  const switchChat = (chatId) => {
    if (chats[chatId]) {
      setActiveChat(chatId);
      setExpandedReferences(new Set());
    }
  };

  // Delete a chat by chat ID
  const deleteChat = async (chatId) => {
    const chat = chats[chatId];
    if (!chat) return;

    try {
      // Call backend API to delete chat by session ID
      await axios.delete(`http://localhost:8000/chat/session/${chat.sessionId}`);
      console.log(`Successfully deleted chat session ${chat.sessionId} from backend`);
      
      // Only proceed with frontend deletion if backend deletion succeeds
      // Remove session ID from localStorage
      removeSessionId(chat.sessionId);

      // Remove from local state
      setChats(prev => {
        const newChats = { ...prev };
        delete newChats[chatId];
        return newChats;
      });
      
      if (activeChat === chatId) {
        // Switch to another chat if deleting the active one
        const remainingChats = Object.keys(chats).filter(id => id !== chatId);
        if (remainingChats.length > 0) {
          setActiveChat(remainingChats[0]);
        } else {
          // No chats left, clear active chat
          setActiveChat(null);
        }
      }
    } catch (error) {
      console.error(`Failed to delete chat session ${chat.sessionId} from backend:`, error);
      // Don't delete from frontend if backend deletion fails
      alert('Failed to delete chat. Please check your connection and try again.');
    }
  };

  // Delete a chat by session ID
  const deleteChatBySessionId = async (sessionId) => {
    try {
      // Call backend API to delete chat by session ID
      await axios.delete(`http://localhost:8000/chat/session/${sessionId}`);
      console.log(`Successfully deleted chat session ${sessionId} from backend`);
      
      // Only proceed with frontend deletion if backend deletion succeeds
      // Remove session ID from localStorage
      removeSessionId(sessionId);

      // Find and remove from local state
      const chatEntry = Object.entries(chats).find(([, chat]) => chat.sessionId === sessionId);
      if (chatEntry) {
        const [chatId] = chatEntry;
        setChats(prev => {
          const newChats = { ...prev };
          delete newChats[chatId];
          return newChats;
        });
        
        if (activeChat === chatId) {
          // Switch to another chat if deleting the active one
          const remainingChats = Object.keys(chats).filter(id => id !== chatId);
          if (remainingChats.length > 0) {
            setActiveChat(remainingChats[0]);
          } else {
            // No chats left, clear active chat
            setActiveChat(null);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to delete chat session ${sessionId} from backend:`, error);
      // Don't delete from frontend if backend deletion fails
      alert('Failed to delete chat. Please check your connection and try again.');
    }
  };

  // Delete all chats
  const deleteAllChats = async () => {
    if (Object.keys(chats).length === 0) return;
    
    if (window.confirm('Are you sure you want to delete all chats? This action cannot be undone.')) {
      // Get all unique session IDs
      const sessionIds = [...new Set(Object.values(chats).map(chat => chat.sessionId))];
      
      // Delete each session from backend
      const deletePromises = sessionIds.map(async (sessionId) => {
        await axios.delete(`http://localhost:8000/chat/session/${sessionId}`);
        console.log(`Successfully deleted chat session ${sessionId} from backend`);
      });

      try {
        // Wait for all deletions to complete - if any fail, this will throw an error
        await Promise.all(deletePromises);

        // Only proceed with frontend deletion if all backend deletions succeed
        // Clear all session IDs from localStorage
        clearAllSessionIds();

        // Clear local state
        setChats({});
        setActiveChat(null);
        setExpandedReferences(new Set());
      } catch (error) {
        console.error('Some chats failed to delete from backend:', error);
        alert('Some chats could not be deleted. Please check your connection and try again.');
      }
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle input height change - scroll to bottom to keep messages visible
  const handleInputHeightChange = useCallback(() => {
    setTimeout(() => {
      scrollToBottom();
    }, 0);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeChat, chats]);

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

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    // Create chat if none exists
    let currentChat = getCurrentChat();
    let currentChatId = activeChat;
    if (!currentChat) {
      const { chatId, chat } = createNewChat();
      currentChat = chat;
      currentChatId = chatId;
    }

    const userMessage = message.trim();
    setMessage("");
    setIsLoading(true);

    // Show user's message
    const userMessageObj = { sender: "user", text: userMessage, timestamp: new Date() };
    setChats(prev => ({
      ...prev,
      [currentChatId]: {
        ...prev[currentChatId],
        messages: [...prev[currentChatId].messages, userMessageObj],
        lastActivity: new Date().toISOString()
      }
    }));

    try {
      const res = await axios.post("http://localhost:8000/chat", {
        question: userMessage,
        session_id: currentChat.sessionId,
      });

      const botMessageObj = { 
        sender: "bot", 
        text: res.data.answer, 
        references: res.data.references || [], 
        timestamp: new Date() 
      };

      setChats(prev => ({
        ...prev,
        [currentChatId]: {
          ...prev[currentChatId],
          messages: [...prev[currentChatId].messages, botMessageObj],
          lastActivity: new Date().toISOString()
        }
      }));
      setIsBackendOnline(true); // Mark backend as online if message sent successfully
    } catch (err) {
      setIsBackendOnline(false); // Mark backend as offline on error
      const errorMessageObj = { 
        sender: "bot", 
        text: "Sorry, I'm having trouble connecting right now. Please try again in a moment.", 
        timestamp: new Date(),
        isError: true
      };
      
      setChats(prev => ({
        ...prev,
        [currentChatId]: {
          ...prev[currentChatId],
          messages: [...prev[currentChatId].messages, errorMessageObj],
          lastActivity: new Date().toISOString()
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleReferences = (messageIndex) => {
    setExpandedReferences(prev => {
      // If clicking on an already expanded reference, collapse it
      if (prev.has(messageIndex)) {
        return new Set();
      } else {
        // Otherwise, collapse all others and expand this one
        return new Set([messageIndex]);
      }
    });
  };

  const currentChat = getCurrentChat();
  const currentMessages = currentChat ? currentChat.messages : [];
  const hasChats = Object.keys(chats).length > 0;

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      <Sidebar 
        chats={chats}
        activeChat={activeChat}
        onCreateNewChat={() => createNewChat()}
        onSwitchChat={switchChat}
        onDeleteChat={deleteChat}
        onDeleteChatBySessionId={deleteChatBySessionId}
        onDeleteAllChats={deleteAllChats}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />
      
      <div className={`chat-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Header */}
        <div className="chat-header">
          <div className="header-content">
            {sidebarCollapsed && (
              <button className="expand-sidebar-button" onClick={toggleSidebar} title="Show sidebar">
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
              <button className="dark-mode-toggle" onClick={toggleDarkMode} title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
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

        {/* Chat Messages */}
        <div className="chat-messages">
          <div className="messages-container">
            {(!hasChats || currentMessages.length === 0) && (
              <div className="welcome-message">
                <div className="welcome-icon">👋</div>
                <h2>Welcome to Ardoq Support!</h2>
                <p>I'm here to help you with any questions about Ardoq. How can I assist you today?</p>
              </div>
            )}
            
            {currentMessages.map((msg, i) => (
              <Message
                key={i}
                message={msg}
                index={i}
                isExpanded={expandedReferences.has(i)}
                onToggleReferences={toggleReferences}
                formatTime={formatTime}
              />
            ))}
            
            {isLoading && (
              <Message
                message={{
                  sender: 'bot',
                  text: '',
                  timestamp: new Date(),
                  isLoading: true
                }}
                index={-1}
                isExpanded={false}
                onToggleReferences={() => {}}
                formatTime={formatTime}
              />
            )}
            
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <ChatInput
          message={message}
          setMessage={setMessage}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          isBackendOnline={isBackendOnline}
          onHeightChange={handleInputHeightChange}
          onCreateNewChat={createNewChat}
        />
      </div>
    </div>
  );
}

export default App;

