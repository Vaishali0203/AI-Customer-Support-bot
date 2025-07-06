import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import ChatInput from "./ChatInput";
import Message from "./Message";
import Header from "./Header";
import WelcomeMessage from "./WelcomeMessage";
import useDarkMode from "../hooks/useDarkMode";
import useResponsiveSidebar from "../hooks/useResponsiveSidebar";
import { generateSessionId, saveSessionId } from "../utils/sessionUtils";
import { formatTime } from "../utils/chatUtils";
import "../css/App.css";

function App() {
  const [expandedReferences, setExpandedReferences] = useState(new Set());
  const [chats, setChats] = useState({});
  const [activeChat, setActiveChat] = useState(null);

  // Custom hooks
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { sidebarCollapsed, toggleSidebar } = useResponsiveSidebar();

  const chatEndRef = useRef(null);

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