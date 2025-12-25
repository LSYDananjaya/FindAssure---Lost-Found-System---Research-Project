import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import './VerificationResult.css';

interface VerificationResult {
  question_id: number;
  final_similarity: string;
  status: 'match' | 'partial_match' | 'mismatch';
  local_explanation: string;
  gemini_analysis: string | null;
}

interface PythonVerificationResponse {
  final_confidence: string;
  is_absolute_owner: boolean;
  gemini_recommendation: string;
  gemini_reasoning: string;
  results: VerificationResult[];
}

interface VerificationData {
  _id: string;
  status: 'pending' | 'passed' | 'failed';
  similarityScore: number | null;
  pythonVerificationResult?: PythonVerificationResponse;
  foundItemId: {
    _id: string;
    category: string;
    description: string;
    imageUrl: string;
    location: string;
    founderContact: {
      name: string;
      email: string;
      phone: string;
    };
  };
}

const VerificationResultPage: React.FC = () => {
  const { verificationId } = useParams<{ verificationId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (verificationId) {
      fetchVerificationResult();
    }
  }, [verificationId]);

  const fetchVerificationResult = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/items/verification/${verificationId}`);
      setVerification(response.data);
    } catch (err: any) {
      console.error('Error fetching verification:', err);
      if (err.response?.status === 401) {
        setError('Please login to view verification results.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(err.response?.data?.message || 'Failed to load verification result');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading verification result...</p>
        </div>
      </div>
    );
  }

  if (error || !verification) {
    return (
      <div className="container">
        <div className="error-box">
          <h2>Error</h2>
          <p>{error || 'Failed to load verification result'}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const pythonResult = verification.pythonVerificationResult;
  const isVerified = verification.status === 'passed' && pythonResult?.is_absolute_owner;

  return (
    <div className="container">
      <div className="verification-result-container">
        <button onClick={() => navigate('/')} className="back-btn">
          ← Back to Dashboard
        </button>

        {/* Status Header */}
        <div className={`status-header ${isVerified ? 'status-success' : 'status-failure'}`}>
          <div className="status-icon">{isVerified ? '✅' : '❌'}</div>
          <h1 className="status-title">
            {isVerified ? 'Verification Successful!' : 'Verification Failed'}
          </h1>
          <p className="status-message">
            {isVerified
              ? 'You have been verified as the owner of this item'
              : 'Your answers did not match sufficiently. This may not be your item.'}
          </p>
        </div>

        {/* Verification Score */}
        {pythonResult && (
          <div className="score-card">
            <h2 className="score-title">Confidence Score</h2>
            <div className="score-value">{pythonResult.final_confidence}</div>
            <div className="score-label">{pythonResult.gemini_recommendation}</div>
          </div>
        )}

        {/* AI Reasoning */}
        {pythonResult?.gemini_reasoning && (
          <div className="reasoning-card">
            <h2>AI Analysis</h2>
            <p>{pythonResult.gemini_reasoning}</p>
          </div>
        )}

        {/* Founder Contact Info - Only show if verified */}
        {isVerified && verification.foundItemId.founderContact && (
          <div className="contact-card verified-contact">
            <h2>🎉 Founder Contact Information</h2>
            <div className="contact-grid">
              <div className="contact-item">
                <strong>Name:</strong>
                <span>{verification.foundItemId.founderContact.name}</span>
              </div>
              <div className="contact-item">
                <strong>Email:</strong>
                <span>
                  <a href={`mailto:${verification.foundItemId.founderContact.email}`}>
                    {verification.foundItemId.founderContact.email}
                  </a>
                </span>
              </div>
              <div className="contact-item">
                <strong>Phone:</strong>
                <span>
                  <a href={`tel:${verification.foundItemId.founderContact.phone}`}>
                    {verification.foundItemId.founderContact.phone}
                  </a>
                </span>
              </div>
            </div>
            <p className="contact-instructions">
              Please contact the finder to arrange retrieval of your item.
            </p>
          </div>
        )}

        {/* Item Details */}
        <div className="item-info-card">
          <h2>Item Details</h2>
          <div className="item-info-grid">
            <div className="info-item">
              <strong>Category:</strong>
              <span>{verification.foundItemId.category}</span>
            </div>
            <div className="info-item">
              <strong>Location:</strong>
              <span>{verification.foundItemId.location}</span>
            </div>
            <div className="info-item">
              <strong>Description:</strong>
              <span>{verification.foundItemId.description}</span>
            </div>
          </div>
        </div>

        {/* Question Results */}
        {pythonResult?.results && pythonResult.results.length > 0 && (
          <div className="results-card">
            <h2>Question Analysis</h2>
            <div className="results-list">
              {pythonResult.results.map((result) => (
                <div key={result.question_id} className="result-item">
                  <div className="result-header">
                    <span className="result-question">Q{result.question_id}</span>
                    <span className="result-similarity">{result.final_similarity}</span>
                    <span className={`result-status status-${result.status}`}>
                      {result.status === 'match' ? '✓ Match' :
                       result.status === 'partial_match' ? '~ Partial' :
                       '✗ Mismatch'}
                    </span>
                  </div>
                  {result.gemini_analysis && (
                    <p className="result-analysis">{result.gemini_analysis}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="actions-container">
          {!isVerified && (
            <p className="try-again-text">
              If you believe this is your item, you can try again with more accurate answers.
            </p>
          )}
          <button onClick={() => navigate('/')} className="btn btn-primary btn-large">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationResultPage;
