import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItemById, getItemQuestions } from '../services/apiService';
import './ItemDetailScreen.css';

const ItemDetailScreen = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadItemData();
  }, [itemId]);

  const loadItemData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load item details and questions in parallel
      const [itemData, questionsData] = await Promise.all([
        getItemById(itemId),
        getItemQuestions(itemId)
      ]);

      setItem(itemData);
      setQuestions(questionsData);
    } catch (err) {
      setError(err.message || 'Failed to load item details');
      console.error('Error loading item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartVerification = () => {
    navigate(`/item/${itemId}/verify`, { 
      state: { item, questions } 
    });
  };

  const handleBack = () => {
    navigate('/view-items');
  };

  if (loading) {
    return (
      <div className="item-detail-screen">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading item details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="item-detail-screen">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={handleBack} className="btn-secondary">
            Back to Items
          </button>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="item-detail-screen">
        <div className="error-container">
          <h2>Item Not Found</h2>
          <p>The requested item could not be found.</p>
          <button onClick={handleBack} className="btn-secondary">
            Back to Items
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="item-detail-screen">
      <div className="detail-container">
        <div className="header-section">
          <button onClick={handleBack} className="back-button">
            ← Back
          </button>
          <h1>Item Details</h1>
        </div>

        <div className="item-info-card">
          <div className="info-header">
            <h2>{item.category}</h2>
            <span className="item-id-badge">ID: {item.id}</span>
          </div>

          <div className="info-content">
            <div className="info-row">
              <label>Description:</label>
              <p>{item.description}</p>
            </div>

            <div className="info-row">
              <label>Reported By:</label>
              <p>User #{item.founder_id}</p>
            </div>

            <div className="info-row">
              <label>Reported Date:</label>
              <p>{new Date(item.created_at).toLocaleString()}</p>
            </div>

            <div className="info-row">
              <label>Location:</label>
              <p>{item.location || 'Not specified'}</p>
            </div>
          </div>
        </div>

        <div className="questions-card">
          <h3>Verification Questions ({questions?.length || 0})</h3>
          <p className="questions-description">
            To verify your ownership, you'll need to answer these questions about the item.
          </p>

          <div className="questions-list">
            {questions?.map((q, index) => (
              <div key={q.id} className="question-preview">
                <span className="question-number">{index + 1}</span>
                <p>{q.question_text}</p>
              </div>
            )) || <p>No questions available</p>}
          </div>
        </div>

        <div className="actions-section">
          <button onClick={handleStartVerification} className="btn-primary">
            Start Verification
          </button>
          <button onClick={handleBack} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailScreen;
