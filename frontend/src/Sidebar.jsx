import React from 'react';
import './Sidebar.css';

const Sidebar = ({ 
  chats, 
  activeChat, 
  onCreateNewChat, 
  onSwitchChat, 
  onDeleteChat,
  onDeleteChatBySessionId,
  onDeleteAllChats
}) => {
  const formatChatTitle = (chat) => {
    if (chat.messages.length === 0) {
      return 'New Chat';
    }
    // Use first user message as title, truncated
    const firstMessage = chat.messages.find(msg => msg.sender === 'user');
    if (firstMessage) {
      return firstMessage.text.length > 30 
        ? firstMessage.text.substring(0, 30) + '...' 
        : firstMessage.text;
    }
    return 'New Chat';
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return messageTime.toLocaleDateString();
  };

  return (
    <div className="sidebar">
        <div className="sidebar-header">
          <h2>Chats</h2>
        </div>

        <div className="sidebar-content">
          {Object.entries(chats).length === 0 ? (
            <div className="no-chats">
              <p>No chat history yet</p>
              <button onClick={onCreateNewChat} className="create-first-chat">
                Create your first chat
              </button>
            </div>
          ) : (
            <div className="chat-list">
              {Object.entries(chats)
                .sort(([, a], [, b]) => new Date(b.lastActivity) - new Date(a.lastActivity))
                .map(([chatId, chat]) => (
                  <div 
                    key={chatId}
                    className={`chat-item ${activeChat === chatId ? 'active' : ''}`}
                    onClick={() => onSwitchChat(chatId)}
                  >
                    <div className="chat-info">
                      <div className="chat-title">{formatChatTitle(chat)}</div>
                      <div className="chat-time">{formatTime(chat.lastActivity)}</div>
                    </div>
                    <button 
                      className="delete-chat-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chatId);
                      }}
                      title="Delete chat"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

        {Object.keys(chats).length > 0 && (
          <div className="sidebar-footer">
            <button 
              className="delete-all-button"
              onClick={onDeleteAllChats}
              title="Delete all chats"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Delete All Chats
            </button>
          </div>
        )}
      </div>
  );
};

export default Sidebar; 