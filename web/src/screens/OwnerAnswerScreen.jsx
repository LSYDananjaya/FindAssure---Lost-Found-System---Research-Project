import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { submitVerification } from '../services/apiService';
import './OwnerAnswerScreen.css';

const OwnerAnswerScreen = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { item, questions } = location.state || {};

  const [ownerName, setOwnerName] = useState('');
  const [answers, setAnswers] = useState(
    questions?.map(q => ({ questionId: q.id, ownerAnswer: '' })) || []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index].ownerAnswer = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!ownerName.trim()) {
      setError('Please enter your name');
      return;
    }

    const unanswered = answers.filter(a => !a.ownerAnswer.trim());
    if (unanswered.length > 0) {
      setError('Please answer all questions');
      return;
    }

    try {
      setLoading(true);

      const verificationData = {
        itemId: parseInt(itemId),
        claimerId: ownerName, // In production, this would be a user ID
        answers: answers.map(a => ({
          questionId: a.questionId,
          answer: a.ownerAnswer.trim()
        }))
      };

      const result = await submitVerification(verificationData);

      // Navigate to result screen with verification data
      navigate('/verification-result', { 
        state: { 
          item,
          result,
          ownerName 
        } 
      });
    } catch (err) {
      setError(err.message || 'Failed to submit verification');
      console.error('Error submitting verification:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/item/${itemId}`);
  };

  if (!item || !questions) {
    return (
      <div className="owner-answer-screen">
        <div className="error-container">
          <h2>Missing Data</h2>
          <p>Unable to load verification data. Please start from the item details page.</p>
          <button onClick={() => navigate('/view-items')} className="btn-secondary">
            Back to Items
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="owner-answer-screen">
      <div className="answer-container">
        <div className="header-section">
          <button onClick={handleBack} className="back-button" disabled={loading}>
            ← Back
          </button>
          <h1>Verify Ownership</h1>
        </div>

        <div className="item-summary-card">
          <h3>{item.category}</h3>
          <p>{item.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="verification-form">
          <div className="form-section">
            <h3>Your Information</h3>
            <div className="form-group">
              <label htmlFor="ownerName">Your Name *</label>
              <input
                type="text"
                id="ownerName"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Enter your full name"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Verification Questions</h3>
            <p className="section-description">
              Please answer all questions accurately. Your answers will be compared
              with the item reporter's answers using AI semantic matching.
            </p>

            {questions.map((question, index) => (
              <div key={question.id} className="question-group">
                <label htmlFor={`answer-${index}`}>
                  <span className="question-number">{index + 1}</span>
                  {question.question_text}
                </label>
                <textarea
                  id={`answer-${index}`}
                  value={answers[index]?.ownerAnswer || ''}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  placeholder="Enter your answer..."
                  rows="3"
                  disabled={loading}
                  required
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="actions-section">
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Verifying...
                </>
              ) : (
                'Submit Verification'
              )}
            </button>
            <button 
              type="button" 
              onClick={handleBack} 
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OwnerAnswerScreen;
