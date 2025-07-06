import React, { useEffect } from 'react';
import axios from 'axios';
import { clearAllSessionIds, initializeSessionIds } from '../utils/sessionUtils';
import ChatListItem from './ChatListItem';
import { ChevronIcon, TrashIcon } from '../icons';
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

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>Chats</h2>
          <button 
            className="collapse-button"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronIcon direction={isCollapsed ? 'right' : 'left'} size={16} />
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
                  <ChatListItem
                    key={chatId}
                    chat={chat}
                    chatId={chatId}
                    isActive={activeChat === chatId}
                    onSwitch={onSwitchChat}
                    chats={chats}
                    setChats={setChats}
                    activeChat={activeChat}
                    setActiveChat={setActiveChat}
                  />
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
              <TrashIcon size={16} />
              Delete All Chats
            </button>
          </div>
        )}
      </div>
  );
};

export default Sidebar; 