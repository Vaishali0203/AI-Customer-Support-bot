import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useBackendHealth from '../hooks/useBackendHealth';
import "../css/ChatInput.css";

const ChatInput = ({ 
  chats,
  setChats,
  activeChat,
  setActiveChat,
  getCurrentChat,
  onCreateNewChat,
  onHeightChange
}) => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { isBackendOnline } = useBackendHealth();

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    // Create chat if none exists
    let currentChat = getCurrentChat();
    let currentChatId = activeChat;
    if (!currentChat) {
      const { chatId, chat } = onCreateNewChat();
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
    } catch (err) {
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

  // Reset textarea height when message is sent
  useEffect(() => {
    const textarea = document.querySelector('.message-input');
    if (textarea && message === '') {
      textarea.style.height = 'auto';
      if (onHeightChange) {
        onHeightChange();
      }
    }
  }, [message, onHeightChange]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInput = (e) => {
    // Auto-resize textarea
    const oldHeight = e.target.style.height;
    e.target.style.height = 'auto';
    const newHeight = Math.min(e.target.scrollHeight, 120) + 'px';
    e.target.style.height = newHeight;
    
    // Notify parent if height changed
    if (oldHeight !== newHeight && onHeightChange) {
      onHeightChange();
    }
  };

  return (
    <div className="chat-input">
      <div className="input-container-wrapper">
        <button 
          className="new-chat-button"
          onClick={onCreateNewChat}
          title="Start new chat"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div className="input-container">
          <textarea
            placeholder={isBackendOnline ? "Type your message here..." : "Agent is offline..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || !isBackendOnline}
            className="message-input"
            rows={1}
            style={{
              minHeight: '44px',
              maxHeight: '120px',
              height: 'auto',
              resize: 'none',
              overflowY: 'auto'
            }}
            onInput={handleInput}
          />
          <div className="send-button-container">
            <button 
              onClick={sendMessage} 
              disabled={!message.trim() || isLoading || !isBackendOnline}
              className="send-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput; 