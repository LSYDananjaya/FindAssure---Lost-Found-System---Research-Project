import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/SelectQuestionsScreen.css';

function SelectQuestionsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { category, description, founderId, generatedQuestions } =
    location.state || {};

  const [questions, setQuestions] = useState(
    generatedQuestions?.map((q) => ({ text: q, isSelected: false })) || []
  );
  const [errorMessage, setErrorMessage] = useState('');

  // Redirect if no data
  if (!category || !generatedQuestions) {
    navigate('/');
    return null;
  }

  const toggleQuestion = (index) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === index ? { ...q, isSelected: !q.isSelected } : q
      )
    );
    setErrorMessage('');
  };

  const handleContinue = () => {
    const selectedQuestions = questions.filter((q) => q.isSelected);

    if (selectedQuestions.length === 0) {
      setErrorMessage('Please select at least one question');
      return;
    }

    navigate('/answer-questions', {
      state: {
        category,
        description,
        founderId,
        selectedQuestions: selectedQuestions.map((q) => q.text),
      },
    });
  };

  const selectedCount = questions.filter((q) => q.isSelected).length;

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
        <h1>Select Questions</h1>
      </div>

      <div className="info-banner">
        <div className="info-content">
          <h2>Select Verification Questions</h2>
          <p>Choose the questions you can answer to help verify the owner</p>
          <div className="selected-count">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              {selectedCount} question{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>
        </div>
      </div>

      <div className="content">
        <div className="questions-list">
          {questions.map((question, index) => (
            <div
              key={index}
              className={`question-card ${question.isSelected ? 'selected' : ''}`}
              onClick={() => toggleQuestion(index)}
            >
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  checked={question.isSelected}
                  onChange={() => toggleQuestion(index)}
                  className="question-checkbox"
                />
                <div className="checkbox-custom">
                  {question.isSelected && (
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <div className="question-text">{question.text}</div>
            </div>
          ))}
        </div>

        {errorMessage && (
          <div className="error-message">
            <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          className="primary-button"
          onClick={handleContinue}
          disabled={selectedCount === 0}
        >
          {selectedCount > 0
            ? `Continue to Answer (${selectedCount})`
            : 'Continue to Answer'}
        </button>
      </div>
    </div>
  );
}

export default SelectQuestionsScreen;
