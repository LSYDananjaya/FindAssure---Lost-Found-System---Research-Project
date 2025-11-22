import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateQuestions } from '../services/apiService';
import '../styles/AddItemScreen.css';

const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Accessories',
  'Documents',
  'Keys',
  'Bags',
  'Books',
  'Jewelry',
  'Sports Equipment',
  'Other',
];

function AddItemScreen() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    founderId: '',
    category: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.founderId.trim()) {
      setErrorMessage('Please enter your ID');
      return;
    }
    if (!formData.category) {
      setErrorMessage('Please select a category');
      return;
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setErrorMessage('Description must be at least 10 characters');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const questions = await generateQuestions(
        formData.category,
        formData.description
      );

      // Navigate to question selection screen
      navigate('/select-questions', {
        state: {
          category: formData.category,
          description: formData.description,
          founderId: formData.founderId,
          generatedQuestions: questions,
        },
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
        <h1>Report Found Item</h1>
      </div>

      <div className="content">
        <div className="header-section">
          <div className="icon-container">
            <svg
              className="header-icon"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="subtitle">
            Help reunite lost items with their owners
          </p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="founderId">Your ID</label>
            <div className="input-with-icon">
              <svg className="input-icon" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="text"
                id="founderId"
                name="founderId"
                value={formData.founderId}
                onChange={handleInputChange}
                placeholder="Enter your identifier"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category">Item Category</label>
            <div className="input-with-icon">
              <svg className="input-icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-input form-select"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Item Description</label>
            <div className="input-with-icon">
              <svg className="input-icon textarea-icon" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z"
                  clipRule="evenodd"
                />
              </svg>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Provide detailed description of the item..."
                rows="5"
                className="form-input form-textarea"
              />
            </div>
          </div>

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
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner" />
            ) : (
              'Generate Verification Questions'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddItemScreen;
