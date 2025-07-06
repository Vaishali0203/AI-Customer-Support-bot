import React, { useEffect } from 'react';
import axios from 'axios';
import { removeSessionId, clearAllSessionIds, initializeSessionIds } from '../utils/sessionUtils';
import '../css/Sidebar.css';

const Sidebar = ({ 
  chats, 
  setChats,
  activeChat, 
  setActiveChat,
  onCreateNewChat, 
  onSwitchChat, 
  onLoadChatHistory,
  isCollapsed,
  onToggleCollapse
}) => {
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
      } catch (error) {
        console.error('Some chats failed to delete from backend:', error);
        alert('Some chats could not be deleted. Please check your connection and try again.');
      }
    }
  };

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
  }, [setChats, setActiveChat]);

  // Load chat history when activeChat changes
  useEffect(() => {
    if (activeChat && chats[activeChat] && chats[activeChat].messages.length === 0) {
      onLoadChatHistory(activeChat);
    }
  }, [activeChat, chats, onLoadChatHistory]);

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
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>Chats</h2>
          <button 
            className="collapse-button"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {isCollapsed ? (
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              )}
            </svg>
          </button>
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
                        deleteChat(chatId);
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
              onClick={deleteAllChats}
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