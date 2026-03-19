import React from 'react';
import '../../styles/ResultPopup.css';
 
function ResultPopup({ isOpen, onClose, result }) {
  if (!isOpen) return null;
 
  const getStatusIcon = (message) => {
    if (message.includes('Mail sent')) return '✅';
    if (message.includes('not found')) return '❌';
    if (message.includes('Failed')) return '⚠️';
    return '📧';
  };
 
  return (
    <div className="result-popup-overlay" onClick={onClose}>
      <div className="result-popup-container" onClick={(e) => e.stopPropagation()}>
        <div className="result-popup-header">
          <h3>Email Results Summary</h3>
          <button className="result-popup-close" onClick={onClose}>×</button>
        </div>
       
        <div className="result-popup-body">
          <div className="result-stats">
            <div className="stat-item success">
              <span className="stat-label">Sent:</span>
              <span className="stat-value">{result?.sent || 0}</span>
            </div>
            <div className="stat-item warning">
              <span className="stat-label">Skipped:</span>
              <span className="stat-value">{result?.skipped || 0}</span>
            </div>
            <div className="stat-item error">
              <span className="stat-label">Failed:</span>
              <span className="stat-value">{result?.failed || 0}</span>
            </div>
          </div>
 
          <div className="result-messages">
            <h4>Details:</h4>
            <div className="messages-list">
              {result?.messages?.map((message, index) => (
                <div key={index} className={`message-item ${
                  message.includes('Mail sent') ? 'success' :
                  message.includes('not found') ? 'error' : 'warning'
                }`}>
                  <span className="message-icon">{getStatusIcon(message)}</span>
                  <span className="message-text">{message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
 
        <div className="result-popup-footer">
          <button className="btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
 
export default ResultPopup;