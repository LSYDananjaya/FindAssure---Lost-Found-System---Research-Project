import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/SuccessScreen.css';

function SuccessScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { item } = location.state || {};

  // Redirect if no data
  if (!item) {
    navigate('/');
    return null;
  }

  const handleReportAnother = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="screen-container success-container">
      <div className="success-content">
        <div className="success-icon-container">
          <svg className="success-icon" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <h1 className="success-title">Item Saved Successfully!</h1>
        <p className="success-subtitle">
          Your found item has been registered in the system
        </p>

        <div className="item-details-card">
          <h2 className="details-title">Item Details</h2>

          <div className="detail-row">
            <div className="detail-label">Item ID:</div>
            <div className="detail-value">#{item.id || 'N/A'}</div>
          </div>

          <div className="detail-row">
            <div className="detail-label">Category:</div>
            <div className="detail-value">{item.category}</div>
          </div>

          <div className="detail-row">
            <div className="detail-label">Description:</div>
            <div className="detail-value description-text">
              {item.description}
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-label">Founder ID:</div>
            <div className="detail-value">{item.founder_id || item.founderId}</div>
          </div>

          <div className="detail-row">
            <div className="detail-label">Questions:</div>
            <div className="detail-value">
              {item.questions?.length || 0} verification question(s)
            </div>
          </div>

          {item.created_at && (
            <div className="detail-row">
              <div className="detail-label">Registered:</div>
              <div className="detail-value">
                {new Date(item.created_at).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        <div className="info-box">
          <svg className="info-icon" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="info-text">
            <strong>What's next?</strong>
            <p>
              The owner can now verify their identity by answering your questions.
              You'll be notified when a match is found.
            </p>
          </div>
        </div>

        <div className="action-buttons">
          <button
            className="primary-button"
            onClick={() => navigate('/view-items')}
          >
            View All Items
          </button>
          <button
            className="secondary-button"
            onClick={handleReportAnother}
          >
            Report Another Item
          </button>
        </div>
      </div>
    </div>
  );
}

export default SuccessScreen;
