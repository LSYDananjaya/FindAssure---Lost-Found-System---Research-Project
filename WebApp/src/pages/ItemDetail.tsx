import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFoundItemById, createVerification } from '../services/api';
import type { FoundItem } from '../services/api';
import './ItemDetail.css';

const ItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [item, setItem] = useState<FoundItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Verification state
  const [showVerification, setShowVerification] = useState(false);
  const [ownerAnswers, setOwnerAnswers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadItem(id);
    }
  }, [id]);

  const loadItem = async (itemId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFoundItemById(itemId);
      setItem(data);
      setOwnerAnswers(new Array(data.questions.length).fill(''));
    } catch (err) {
      setError('Failed to load item details. Please try again.');
      console.error('Error loading item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...ownerAnswers];
    newAnswers[index] = value;
    setOwnerAnswers(newAnswers);
  };

  const handleSubmitVerification = async () => {
    if (!item) return;

    // Validate all answers are filled
    if (ownerAnswers.some(answer => !answer.trim())) {
      setError('Please answer all questions');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Build unified owner answers array with questionId, answer, and videoKey
      const ownerAnswersInput = ownerAnswers.map((answer, index) => ({
        questionId: index,
        answer: answer.trim(),
        videoKey: 'default_video_placeholder', // Will be replaced with actual video key in future
      }));

      await createVerification({
        foundItemId: item._id,
        ownerAnswers: ownerAnswersInput,
      });

      // Success
      alert('Verification submitted successfully! The system will compare your answers with the founder\'s answers.');
      navigate('/');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('You need to be logged in to claim this item. This feature requires authentication.');
      } else {
        setError('Failed to submit verification. Please try again.');
      }
      console.error('Error submitting verification:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      available: { class: 'status-available', text: 'Available' },
      pending_verification: { class: 'status-pending', text: 'Pending Verification' },
      claimed: { class: 'status-claimed', text: 'Claimed' },
    };
    return badges[status as keyof typeof badges] || badges.available;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading item details...</div>
      </div>
    );
  }

  if (error && !item) {
    return (
      <div className="container">
        <div className="error-box">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container">
        <div className="error-box">
          <h2>Item Not Found</h2>
          <p>The item you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="item-detail-container">
        <button onClick={() => navigate('/')} className="back-btn">
          ← Back to Dashboard
        </button>

        <div className="item-detail-card">
          <div className="item-detail-header">
            <div className="item-image-large">
              {item.imageUrl.startsWith('file://') ? (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontSize: '8rem'
                }}>
                  {
                    {
                      Electronics: '📱',
                      Clothing: '👕',
                      Accessories: '👜',
                      Documents: '📄',
                      Bags: '🎒',
                      Jewelry: '💍',
                      Keys: '🔑',
                      Books: '📚',
                      Sports: '⚽',
                      Other: '📦',
                    }[item.category] || '📦'
                  }
                </div>
              ) : (
                <img src={item.imageUrl} alt={item.category} />
              )}
            </div>
            <div className="item-header-content">
              <div className="item-title-row">
                <h1>{item.category}</h1>
                <span className={`status-badge ${getStatusBadge(item.status).class}`}>
                  {getStatusBadge(item.status).text}
                </span>
              </div>
              <p className="item-description-full">{item.description}</p>
              <div className="item-meta-grid">
                <div className="meta-item">
                  <strong>📍 Location:</strong> {item.location}
                </div>
                <div className="meta-item">
                  <strong>📅 Found on:</strong> {formatDate(item.createdAt)}
                </div>
                <div className="meta-item">
                  <strong>❓ Questions:</strong> {item.questions.length}
                </div>
              </div>
            </div>
          </div>

          <div className="item-detail-body">
            <div className="section">
              <h2>Verification Questions</h2>
              <p className="section-description">
                These questions were answered by the person who found this item. 
                {!showVerification && ' If this is your item, click "Claim This Item" to answer the same questions and verify ownership.'}
              </p>

              <div className="questions-display">
                {item.questions.map((question, index) => (
                  <div key={index} className="question-display-item">
                    <div className="question-display-label">
                      <span className="question-number">Q{index + 1}</span>
                      <span>{question}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!showVerification && item.status === 'available' && (
              <div className="claim-section">
                <div className="claim-info">
                  <h3>Is this your item?</h3>
                  <p>
                    To claim this item, you'll need to answer the same questions that the founder answered.
                    Your answers will be compared with the founder's answers to verify ownership.
                  </p>
                </div>
                <button
                  onClick={() => setShowVerification(true)}
                  className="btn btn-primary btn-large"
                >
                  Claim This Item
                </button>
              </div>
            )}

            {showVerification && (
              <div className="verification-section">
                <div className="verification-header">
                  <h2>Answer Verification Questions</h2>
                  <p>Please answer all questions about your lost item</p>
                </div>

                <div className="verification-questions">
                  {item.questions.map((question, index) => (
                    <div key={index} className="verification-question-item">
                      <label className="question-label">
                        <span className="question-number">Q{index + 1}</span>
                        {question}
                      </label>
                      <textarea
                        value={ownerAnswers[index]}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        className="form-input form-textarea"
                        placeholder="Your answer..."
                        rows={3}
                        required
                      />
                    </div>
                  ))}
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="verification-actions">
                  <button
                    onClick={() => setShowVerification(false)}
                    className="btn btn-secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitVerification}
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Verification'}
                  </button>
                </div>
              </div>
            )}

            <div className="section contact-section">
              <h2>Founder Contact Information</h2>
              <p className="section-description">
                Once your verification is approved, you can contact the founder using the information below.
              </p>
              <div className="contact-grid">
                <div className="contact-item">
                  <strong>Name:</strong>
                  <span>{item.founderContact.name}</span>
                </div>
                <div className="contact-item">
                  <strong>Email:</strong>
                  <span>{item.founderContact.email}</span>
                </div>
                <div className="contact-item">
                  <strong>Phone:</strong>
                  <span>{item.founderContact.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;
