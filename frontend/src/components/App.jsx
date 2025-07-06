import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import ChatInput from "./ChatInput";
import Message from "./Message";
import Header from "./Header";
import WelcomeMessage from "./WelcomeMessage";
import useDarkMode from "../hooks/useDarkMode";
import { generateSessionId, saveSessionId } from "../utils/sessionUtils";
import { formatTime } from "../utils/chatUtils";
import "../css/App.css";

function App() {
  const [expandedReferences, setExpandedReferences] = useState(new Set());
  const [chats, setChats] = useState({});
  const [activeChat, setActiveChat] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userManuallyCollapsed, setUserManuallyCollapsed] = useState(false);

  // Custom hooks
  const { darkMode, toggleDarkMode } = useDarkMode();

  const chatEndRef = useRef(null);

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
        setChats={setChats}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        onCreateNewChat={() => createNewChat()}
        onSwitchChat={switchChat}
        onLoadChatHistory={loadChatHistory}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />
      
      <div className={`chat-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Header */}
        <Header 
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        {/* Chat Messages */}
        <div className="chat-messages">
          <div className="messages-container">
            {(!hasChats || currentMessages.length === 0) && (
              <WelcomeMessage />
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
            
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <ChatInput
          chats={chats}
          setChats={setChats}
          activeChat={activeChat}
          setActiveChat={setActiveChat}
          getCurrentChat={getCurrentChat}
          onCreateNewChat={createNewChat}
          onHeightChange={handleInputHeightChange}
        />
      </div>
    </div>
  );
}

export default App;

