import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import './Profile.css';

interface ClaimedItem {
  _id: string;
  foundItemId: {
    _id: string;
    imageUrl: string;
    category: string;
    description: string;
    founderContact: {
      name: string;
      email: string;
      phone: string;
    };
    found_location: Array<{
      location: string;
      floor_id?: string;
      hall_name?: string;
    }>;
  };
  status: string;
  createdAt: string;
  similarityScore: number;
}

const Profile: React.FC = () => {
  const { user, updateProfile: updateUserProfile } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [claimedItems, setClaimedItems] = useState<ClaimedItem[]>([]);
  const [loadingClaimed, setLoadingClaimed] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      fetchClaimedItems();
    }
  }, [user]);

  const fetchClaimedItems = async () => {
    try {
      setLoadingClaimed(true);
      const response = await apiClient.get('/auth/claimed-items');
      setClaimedItems(response.data);
    } catch (error: any) {
      console.error('Failed to fetch claimed items:', error);
    } finally {
      setLoadingClaimed(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setMessage('Name is required');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      await updateUserProfile({ name, phone });
      setMessage('Profile updated successfully!');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p>Please login to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h1 className="profile-title">My Profile</h1>
      
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="profile-info">
            <h2>{user.name}</h2>
            <p className="profile-role">Role: {user.role}</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="profile-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={user.email}
              disabled
              className="input-disabled"
            />
            <small className="helper-text">Email cannot be changed</small>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          {message && (
            <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-save">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <div className="account-info">
          <h3>Account Information</h3>
          <div className="info-row">
            <span className="info-label">User ID:</span>
            <span className="info-value">{user._id}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Member Since:</span>
            <span className="info-value">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Claimed Items Section */}
      <div className="claimed-section">
        <h2 className="section-title">My Claimed Items</h2>
        
        {loadingClaimed ? (
          <div className="loading-text">Loading claimed items...</div>
        ) : claimedItems.length === 0 ? (
          <div className="empty-state">
            <p>No claimed items yet</p>
            <p className="empty-hint">
              When you successfully claim an item, it will appear here with the founder's contact information.
            </p>
          </div>
        ) : (
          <div className="claimed-items-grid">
            {claimedItems.map((item) => (
              <div key={item._id} className="claimed-item-card">
                <img
                  src={item.foundItemId?.imageUrl || 'https://via.placeholder.com/150'}
                  alt={item.foundItemId?.category}
                  className="item-image"
                />
                <div className="item-content">
                  <h3 className="item-category">{item.foundItemId?.category}</h3>
                  <p className="item-description">{item.foundItemId?.description}</p>
                  
                  <div className="item-meta">
                    <span className="claimed-badge">✓ Verified & Claimed</span>
                    <span className="claimed-date">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {item.similarityScore > 0 && (
                    <div className="score-badge">
                      Match Score: {(item.similarityScore * 100).toFixed(0)}%
                    </div>
                  )}

                  {/* Founder Contact Information */}
                  <div className="founder-info">
                    <h4 className="founder-title">📞 Founder Contact</h4>
                    <div className="founder-details">
                      <div className="founder-row">
                        <span className="founder-label">Name:</span>
                        <span className="founder-value">
                          {item.foundItemId?.founderContact?.name || 'N/A'}
                        </span>
                      </div>
                      <div className="founder-row">
                        <span className="founder-label">Email:</span>
                        <span className="founder-value">
                          <a href={`mailto:${item.foundItemId?.founderContact?.email}`}>
                            {item.foundItemId?.founderContact?.email || 'N/A'}
                          </a>
                        </span>
                      </div>
                      <div className="founder-row">
                        <span className="founder-label">Phone:</span>
                        <span className="founder-value">
                          <a href={`tel:${item.foundItemId?.founderContact?.phone}`}>
                            {item.foundItemId?.founderContact?.phone || 'N/A'}
                          </a>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  {item.foundItemId?.found_location && item.foundItemId.found_location.length > 0 && (
                    <div className="location-info">
                      <h4 className="location-title">📍 Found Location</h4>
                      {item.foundItemId.found_location.map((loc, idx) => (
                        <div key={idx} className="location-item">
                          {loc.location}
                          {loc.floor_id && ` - Floor ${loc.floor_id}`}
                          {loc.hall_name && ` - ${loc.hall_name}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
