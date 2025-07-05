import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  // Backend health check function
  const checkBackendHealth = async () => {
    try {
      const response = await axios.get("http://localhost:8000/", {
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

    const userMessage = message.trim();
    setMessage("");
    setIsLoading(true);

    // Show user's message
    setChat((prev) => [...prev, { sender: "user", text: userMessage, timestamp: new Date() }]);

    try {
      const res = await axios.post("http://localhost:8000/chat", {
        question: userMessage,
      });

      setChat((prev) => [...prev, { sender: "bot", text: res.data.answer, timestamp: new Date() }]);
      setIsBackendOnline(true); // Mark backend as online if message sent successfully
    } catch (err) {
      setIsBackendOnline(false); // Mark backend as offline on error
      setChat((prev) => [
        ...prev,
        { 
          sender: "bot", 
          text: "Sorry, I'm having trouble connecting right now. Please try again in a moment.", 
          timestamp: new Date(),
          isError: true
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app">
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">🤖</div>
              <div className="logo-text">
                <h1>Ardoq Support</h1>
                <p>AI Assistant</p>
              </div>
            </div>
            <div className="status-indicator">
              <div className={`status-dot ${isBackendOnline ? 'online' : 'offline'}`}></div>
              <span>{isBackendOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="chat-messages">
          {chat.length === 0 && (
            <div className="welcome-message">
              <div className="welcome-icon">👋</div>
              <h2>Welcome to Ardoq Support!</h2>
              <p>I'm here to help you with any questions about Ardoq. How can I assist you today?</p>
            </div>
          )}
          
          {chat.map((msg, i) => (
            <div key={i} className={`message ${msg.sender}`}>
              <div className="message-content">
                <div className="message-bubble">
                  <p>{msg.text}</p>
                  <span className="message-time">{formatTime(msg.timestamp)}</span>
                </div>
                <div className="message-avatar">
                  {msg.sender === 'user' ? '👤' : '🤖'}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message bot">
              <div className="message-content">
                <div className="message-bubble loading">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <div className="message-avatar">🤖</div>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="chat-input">
          <div className="input-container">
            <input
              type="text"
              placeholder={isBackendOnline ? "Type your message here..." : "Agent is offline..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={isLoading || !isBackendOnline}
              className="message-input"
            />
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
}

export default App;
