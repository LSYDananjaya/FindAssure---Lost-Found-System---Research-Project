import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './VerificationResultScreen.css';

const VerificationResultScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { item, result, ownerName } = location.state || {};

  if (!result || !item) {
    return (
      <div className="verification-result-screen">
        <div className="error-container">
          <h2>No Results</h2>
          <p>Unable to load verification results.</p>
          <button onClick={() => navigate('/view-items')} className="btn-secondary">
            Back to Items
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (recommendation) => {
    switch (recommendation) {
      case 'VERIFIED':
        return '#27ae60';
      case 'LIKELY_MATCH':
        return '#2ecc71';
      case 'UNCERTAIN':
        return '#f39c12';
      case 'NOT_MATCH':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const getStatusIcon = (recommendation) => {
    switch (recommendation) {
      case 'VERIFIED':
        return '✓';
      case 'LIKELY_MATCH':
        return '✓';
      case 'UNCERTAIN':
        return '?';
      case 'NOT_MATCH':
        return '✗';
      default:
        return '•';
    }
  };

  const getStatusMessage = (recommendation) => {
    switch (recommendation) {
      case 'VERIFIED':
        return 'Ownership Verified';
      case 'LIKELY_MATCH':
        return 'Likely Owner';
      case 'UNCERTAIN':
        return 'Uncertain Match';
      case 'NOT_MATCH':
        return 'Does Not Match';
      default:
        return 'Unknown Status';
    }
  };

  const getScorePercentage = (score) => {
    return Math.round(score * 100);
  };

  const handleViewItems = () => {
    navigate('/view-items');
  };

  const handleTryAgain = () => {
    navigate(`/item/${item.id}`);
  };

  return (
    <div className="verification-result-screen">
      <div className="result-container">
        <div className="header-section">
          <h1>Verification Results</h1>
        </div>

        <div className="result-card">
          <div 
            className="status-indicator"
            style={{ 
              background: getStatusColor(result.verification.recommendation),
              boxShadow: `0 5px 20px ${getStatusColor(result.verification.recommendation)}40`
            }}
          >
            <div className="status-icon">
              {getStatusIcon(result.verification.recommendation)}
            </div>
            <h2>{getStatusMessage(result.verification.recommendation)}</h2>
            <div className="match-score">
              {getScorePercentage(result.verification.overall_match_score)}% Match
            </div>
          </div>

          <div className="verification-info">
            <div className="info-section">
              <h3>Item Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Item ID:</label>
                  <span>#{item.id}</span>
                </div>
                <div className="info-item">
                  <label>Category:</label>
                  <span>{item.category}</span>
                </div>
                <div className="info-item">
                  <label>Description:</label>
                  <span>{item.description}</span>
                </div>
                <div className="info-item">
                  <label>Your Name:</label>
                  <span>{ownerName}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>Match Analysis</h3>
              <div className="match-details">
                {result.verification.match_details && result.verification.match_details.map((detail, index) => (
                  <div key={index} className="match-item">
                    <div className="match-header">
                      <span className="question-number">{index + 1}</span>
                      <span className="match-status" style={{
                        color: detail.match_score >= 0.8 ? '#27ae60' : 
                               detail.match_score >= 0.6 ? '#f39c12' : '#e74c3c'
                      }}>
                        {getScorePercentage(detail.match_score)}% match
                      </span>
                    </div>
                    <div className="match-reasoning">
                      {detail.reasoning}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {result.verification.overall_reasoning && (
              <div className="info-section">
                <h3>Overall Assessment</h3>
                <div className="overall-reasoning">
                  {result.verification.overall_reasoning}
                </div>
              </div>
            )}

            <div className="info-section">
              <h3>Verification Details</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Verified At:</label>
                  <span>{new Date(result.verification.verified_at).toLocaleString()}</span>
                </div>
                <div className="info-item">
                  <label>Verification ID:</label>
                  <span>#{result.verification.id}</span>
                </div>
                <div className="info-item">
                  <label>Status:</label>
                  <span className={`status-badge ${result.verification.is_verified ? 'verified' : 'not-verified'}`}>
                    {result.verification.is_verified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="actions-section">
          <button onClick={handleViewItems} className="btn-primary">
            View All Items
          </button>
          <button onClick={handleTryAgain} className="btn-secondary">
            View Item Details
          </button>
        </div>

        {(result.verification.recommendation === 'VERIFIED' || 
          result.verification.recommendation === 'LIKELY_MATCH') && (
          <div className="next-steps-card">
            <h3>📋 Next Steps</h3>
            <ul>
              <li>Contact the item reporter to arrange pickup</li>
              <li>Bring valid identification</li>
              <li>Be prepared to answer additional questions if needed</li>
              <li>Save this verification ID for reference: #{result.verification.id}</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationResultScreen;
