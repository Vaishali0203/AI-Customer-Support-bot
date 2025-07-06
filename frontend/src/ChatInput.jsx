import React, { useEffect } from 'react';
import './ChatInput.css';

const ChatInput = ({ 
  message, 
  setMessage, 
  onSendMessage, 
  isLoading, 
  isBackendOnline,
  onHeightChange,
  onCreateNewChat
}) => {
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
      onSendMessage();
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
              onClick={onSendMessage} 
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