import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFoundItems } from '../services/api';
import type { FoundItem } from '../services/api';
import './Dashboard.css';

const CATEGORIES = [
  'All',
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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<FoundItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, selectedCategory, selectedStatus]);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFoundItems();
      setItems(data);
    } catch (err) {
      setError('Failed to load found items. Please try again.');
      console.error('Error loading items:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    setFilteredItems(filtered);
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
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading found items...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Found Items Dashboard</h1>
        <p className="subtitle">Manage and track all found items in the system</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={loadItems} className="retry-btn">Retry</button>
        </div>
      )}

      <div className="filters">
        <div className="filter-group">
          <label>Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="claimed">Claimed</option>
          </select>
        </div>

        <div className="filter-stats">
          <span className="stat-badge">{filteredItems.length} items</span>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h2>No items found</h2>
          <p>
            {selectedCategory !== 'All' || selectedStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'Start by adding your first found item'}
          </p>
          <button
            onClick={() => navigate('/add-item')}
            className="btn btn-primary"
          >
            Add Found Item
          </button>
        </div>
      ) : (
        <div className="items-grid">
          {filteredItems.map((item) => {
            const isLocalFile = item.imageUrl.startsWith('file://');
            const categoryEmojis: Record<string, string> = {
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
            };
            
            return (
              <div
                key={item._id}
                className="item-card"
                onClick={() => navigate(`/item/${item._id}`)}
              >
                <div className={`item-image ${isLocalFile ? 'placeholder' : ''}`}>
                  {isLocalFile ? (
                    <span style={{ fontSize: '4rem' }}>
                      {categoryEmojis[item.category] || '📦'}
                    </span>
                  ) : (
                    <img src={item.imageUrl} alt={item.category} />
                  )}
                </div>
                <div className="item-content">
                <div className="item-header">
                  <h3>{item.category}</h3>
                  <span className={`status-badge ${getStatusBadge(item.status).class}`}>
                    {getStatusBadge(item.status).text}
                  </span>
                </div>
                <p className="item-description">{item.description}</p>
                <div className="item-footer">
                  <div className="item-meta">
                    <span className="meta-item">
                      📍 {item.location}
                    </span>
                    <span className="meta-item">
                      📅 {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <div className="item-questions">
                    {item.questions.length} questions
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
