import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createItem } from '../services/apiService';
import '../styles/AnswerQuestionsScreen.css';

function AnswerQuestionsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { category, description, founderId, selectedQuestions } =
    location.state || {};

  const [answers, setAnswers] = useState(
    selectedQuestions?.map(() => '') || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Redirect if no data
  if (!category || !selectedQuestions) {
    navigate('/');
    return null;
  }

  const handleAnswerChange = (index, value) => {
    setAnswers((prev) => prev.map((ans, i) => (i === index ? value : ans)));
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    for (let i = 0; i < answers.length; i++) {
      if (!answers[i].trim()) {
        setErrorMessage(`Please provide an answer for question ${i + 1}`);
        return;
      }
      if (answers[i].trim().length < 2) {
        setErrorMessage(`Answer ${i + 1} must be at least 2 characters`);
        return;
      }
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // Create item object - match backend expected format
      const itemData = {
        category,
        description,
        founderId,
        questions: selectedQuestions.map((question, index) => ({
          question: question,
          founderAnswer: answers[index].trim(),
        })),
      };

      const savedItem = await createItem(itemData);

      // Navigate to success screen
      navigate('/success', {
        state: { item: savedItem },
        replace: true,
      });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="screen-container">
      <div className="app-bar">
        <button
          className="back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <h1>Answer Questions</h1>
      </div>

      <div className="info-banner">
        <div className="info-content">
          <h2>Provide Your Answers</h2>
          <p>Answer these questions to help verify the true owner</p>
        </div>
      </div>

      <div className="content">
        <form onSubmit={handleSubmit} className="answers-form">
          {selectedQuestions.map((question, index) => (
            <div key={index} className="answer-card">
              <div className="question-header">
                <div className="question-number">{index + 1}</div>
                <div className="question-text">{question}</div>
              </div>
              <textarea
                value={answers[index]}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                placeholder="Enter your answer..."
                rows="3"
                className="answer-input"
              />
            </div>
          ))}

          {errorMessage && (
            <div className="error-message">
              <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            className="primary-button save-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner" />
            ) : (
              'Save Item'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AnswerQuestionsScreen;
