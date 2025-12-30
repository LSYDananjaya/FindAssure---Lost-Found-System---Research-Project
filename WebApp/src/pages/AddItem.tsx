import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateQuestions, createFoundItem } from '../services/api';
import { LocationPicker } from '../components/LocationPicker';
import { LocationDetail } from '../constants/locationData';
import './AddItem.css';

const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Accessories',
  'Documents',
  'Bags',
  'Jewelry',
  'Keys',
  'Books',
  'Sports',
  'Other',
];

const AddItem: React.FC = () => {
  const navigate = useNavigate();
  
  // Step 1: Basic Information
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [location, setLocation] = useState<LocationDetail | null>(null);
  
  // Step 2: AI Generated Questions
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  
  // Step 3: Founder Answers
  const [founderAnswers, setFounderAnswers] = useState<string[]>([]);
  
  // Step 4: Contact Information
  const [founderName, setFounderName] = useState('');
  const [founderEmail, setFounderEmail] = useState('');
  const [founderPhone, setFounderPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateQuestions = async () => {
    if (!category || !description) {
      setError('Please select a category and enter a description');
      return;
    }

    try {
      setGeneratingQuestions(true);
      setError(null);
      const generatedQuestions = await generateQuestions(category, description);
      setSuggestedQuestions(generatedQuestions);
      setSelectedQuestions([]);
      setStep(2);
    } catch (err) {
      setError('Failed to generate questions. Please try again.');
      console.error('Error generating questions:', err);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...founderAnswers];
    newAnswers[index] = value;
    setFounderAnswers(newAnswers);
  };

  const handleToggleQuestion = (question: string) => {
    if (selectedQuestions.includes(question)) {
      setSelectedQuestions(selectedQuestions.filter(q => q !== question));
    } else {
      if (selectedQuestions.length >= 5) {
        setError('You can only select exactly 5 questions');
        return;
      }
      setSelectedQuestions([...selectedQuestions, question]);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    // Validate all answers are filled
    if (founderAnswers.some(answer => !answer.trim())) {
      setError('Please answer all questions');
      return;
    }

    if (!founderName || !founderEmail || !founderPhone) {
      setError('Please fill in all contact information');
      return;
    }

    if (!location || !location.location) {
      setError('Please select a location');
      return;
    }

    // For founder, if building has floors, must select hall
    if (location.floor_id && !location.hall_name) {
      setError('Please select the specific hall where you found the item');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await createFoundItem({
        imageUrl,
        category,
        description,
        questions: selectedQuestions,
        founderAnswers,
        found_location: [{
          location: location.location,
          floor_id: location.floor_id,
          hall_name: location.hall_name,
        }],
        founderContact: {
          name: founderName,
          email: founderEmail,
          phone: founderPhone,
        },
      });

      // Success - navigate to dashboard
      navigate('/', { state: { message: 'Found item added successfully!' } });
    } catch (err) {
      setError('Failed to create found item. Please try again.');
      console.error('Error creating found item:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="step-content">
      <h2>Basic Information</h2>
      <p className="step-description">Provide details about the found item</p>

      <div className="form-group">
        <label>Category *</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="form-input"
          required
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="form-input form-textarea"
          placeholder="Describe the found item in detail (color, brand, condition, etc.)"
          rows={4}
          required
        />
        <small className="form-hint">
          Provide as much detail as possible. This will help generate better verification questions.
        </small>
      </div>

      <div className="form-group">
        <label>Image URL *</label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="form-input"
          placeholder="https://example.com/image.jpg"
          required
        />
        <small className="form-hint">
          Enter a URL to an image of the found item
        </small>
      </div>

      <div className="form-group">
        <LocationPicker
          value={location}
          onChange={setLocation}
          userType="founder"
          label="Location Found"
          required
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-actions">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleGenerateQuestions}
          className="btn btn-primary"
          disabled={generatingQuestions || !category || !description || !imageUrl || !location || !location.location}
        >
          {generatingQuestions ? 'Generating Questions...' : 'Generate Questions with AI'}
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <div className="step-header">
        <button
          onClick={() => setStep(1)}
          className="back-btn"
        >
          ← Back
        </button>
        <div>
          <h2>Select Verification Questions</h2>
          <p className="step-description">
            Choose exactly 5 questions from the AI-generated list
          </p>
        </div>
      </div>

      <div className="questions-info">
        <div className="info-box">
          <strong>Note:</strong> These questions were generated by AI based on your description.
          Select 5 questions that you think are most relevant for verifying ownership.
        </div>
        <div className="selection-counter">
          <strong>Selected: {selectedQuestions.length} / 5</strong>
        </div>
      </div>

      <div className="questions-grid">
        {suggestedQuestions.map((question, index) => (
          <div 
            key={index} 
            className={`question-chip ${selectedQuestions.includes(question) ? 'selected' : ''}`}
            onClick={() => handleToggleQuestion(question)}
          >
            <span className="question-text">{question}</span>
            {selectedQuestions.includes(question) && (
              <span className="checkmark">✓</span>
            )}
          </div>
        ))}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-actions">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="btn btn-secondary"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => {
            if (selectedQuestions.length !== 5) {
              setError(`You must select exactly 5 questions. Currently selected: ${selectedQuestions.length}`);
            } else {
              setError(null);
              setFounderAnswers(new Array(5).fill(''));
              setStep(3);
            }
          }}
          className="btn btn-primary"
          disabled={selectedQuestions.length !== 5}
        >
          Continue to Answer Questions
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <div className="step-header">
        <button
          onClick={() => setStep(2)}
          className="back-btn"
        >
          ← Back
        </button>
        <div>
          <h2>Answer Selected Questions</h2>
          <p className="step-description">
            Provide your answers to the verification questions
          </p>
        </div>
      </div>

      <div className="questions-info">
        <div className="info-box">
          <strong>Note:</strong> The person who lost this item will need to answer the same questions to verify ownership.
        </div>
      </div>

      <div className="questions-list">
        {selectedQuestions.map((question, index) => (
          <div key={index} className="question-item">
            <label className="question-label">
              <span className="question-number">Q{index + 1}</span>
              {question}
            </label>
            <textarea
              value={founderAnswers[index]}
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

      <div className="form-actions">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="btn btn-secondary"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => {
            if (founderAnswers.some(answer => !answer.trim())) {
              setError('Please answer all questions');
            } else {
              setError(null);
              setStep(4);
            }
          }}
          className="btn btn-primary"
        >
          Continue to Contact Info
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="step-content">
      <div className="step-header">
        <button
          onClick={() => setStep(3)}
          className="back-btn"
        >
          ← Back
        </button>
        <div>
          <h2>Contact Information</h2>
          <p className="step-description">
            Provide your contact details so the owner can reach you
          </p>
        </div>
      </div>

      <div className="form-group">
        <label>Your Name *</label>
        <input
          type="text"
          value={founderName}
          onChange={(e) => setFounderName(e.target.value)}
          className="form-input"
          placeholder="John Doe"
          required
        />
      </div>

      <div className="form-group">
        <label>Your Email *</label>
        <input
          type="email"
          value={founderEmail}
          onChange={(e) => setFounderEmail(e.target.value)}
          className="form-input"
          placeholder="john@example.com"
          required
        />
      </div>

      <div className="form-group">
        <label>Your Phone *</label>
        <input
          type="tel"
          value={founderPhone}
          onChange={(e) => setFounderPhone(e.target.value)}
          className="form-input"
          placeholder="+94 77 123 4567"
          required
        />
      </div>

      <div className="summary-box">
        <h3>Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <strong>Category:</strong> {category}
          </div>
          <div className="summary-item">
            <strong>Location:</strong> {location ? (
              <>
                {location.location.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                {location.floor_id && ` - Floor ${location.floor_id}`}
                {location.hall_name && ` - ${location.hall_name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`}
              </>
            ) : 'Not selected'}
          </div>
          <div className="summary-item">
            <strong>Questions:</strong> {selectedQuestions.length} answered
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-actions">
        <button
          type="button"
          onClick={() => setStep(3)}
          className="btn btn-secondary"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Found Item'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="container">
      <div className="add-item-container">
        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <div className="progress-number">1</div>
            <div className="progress-label">Basic Info</div>
          </div>
          <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="progress-number">2</div>
            <div className="progress-label">Select Questions</div>
          </div>
          <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <div className="progress-number">3</div>
            <div className="progress-label">Answer Questions</div>
          </div>
          <div className={`progress-line ${step >= 4 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 4 ? 'active' : ''}`}>
            <div className="progress-number">4</div>
            <div className="progress-label">Contact Info</div>
          </div>
        </div>

        <div className="form-card">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
      </div>
    </div>
  );
};

export default AddItem;
