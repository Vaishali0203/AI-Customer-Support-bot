import React from 'react';
import './Message.css';

const Message = ({ message, index, isExpanded, onToggleReferences, formatTime }) => {
  return (
    <div className={`message ${message.sender}`}>
      <div className="message-content">
        <div className={`message-bubble ${message.isLoading ? 'loading' : ''}`}>
          {message.isLoading ? (
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            <>
              <p>{message.text}</p>
              <span className="message-time">{formatTime(message.timestamp)}</span>
            </>
          )}
        </div>
        <div className="message-avatar">
          {message.sender === 'user' ? '👤' : '🤖'}
        </div>
      </div>
      {message.sender === 'bot' && message.references && message.references.length > 0 && (
        <div className="references-section">
          <button
            className="references-toggle"
            onClick={() => onToggleReferences(index)}
          >
            <span className="references-icon">
              {isExpanded ? '▼' : '▶'}
            </span>
            <span className="references-text">
              References ({message.references.length})
            </span>
          </button>
          {isExpanded && (
            <div className="references-content">
              {message.references.map((ref, refIndex) => (
                <div key={refIndex} className="reference-item">
                  <div className="reference-title">{ref.title || `Reference ${refIndex + 1}`}</div>
                  {ref.url && (
                    <a href={ref.url} target="_blank" rel="noopener noreferrer" className="reference-link">
                      {ref.url}
                    </a>
                  )}
                  {ref.content && (
                    <div className="reference-content">{ref.content}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Message; 