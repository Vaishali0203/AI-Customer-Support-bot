import React from 'react';
import axios from 'axios';
import { removeSessionId } from '../utils/sessionUtils';
import { CloseIcon } from '../icons';

const ChatListItem = ({ 
  chat, 
  chatId, 
  isActive, 
  onSwitch,
  chats,
  setChats,
  activeChat,
  setActiveChat
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

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteChat(chatId);
  };

  return (
    <div 
      className={`chat-item ${isActive ? 'active' : ''}`}
      onClick={() => onSwitch(chatId)}
    >
      <div className="chat-info">
        <div className="chat-title">{formatChatTitle(chat)}</div>
        <div className="chat-time">{formatTime(chat.lastActivity)}</div>
      </div>
      <button 
        className="delete-chat-button"
        onClick={handleDelete}
        title="Delete chat"
      >
        <CloseIcon size={14} />
      </button>
    </div>
  );
};

export default ChatListItem; 