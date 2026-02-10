import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFoundItemsByIds } from '../services/itemService';
import type { FoundItem } from '../types';

const ItemDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const selectedIds = sessionStorage.getItem('selectedItemIds');
        if (!selectedIds) {
          navigate('/');
          return;
        }

        const itemIds = JSON.parse(selectedIds);
        const fetchedItems = await getFoundItemsByIds(itemIds);
        setItems(fetchedItems);
      } catch (err) {
        setError('Failed to fetch item details. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [navigate]);

  const handleBack = () => {
    navigate('/select-items');
  };

  const handleStartOver = () => {
    sessionStorage.clear();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
          <div className="text-red-500 text-center mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={handleStartOver}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Found Item Details</h1>
          <p className="text-gray-600">Detailed information about the selected items</p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <p className="text-gray-600 mb-4">No items found with the selected IDs.</p>
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {items.map((item) => (
                <div key={item._id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {item.imageUrl && (
                    <div className="h-48 bg-gray-200 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.category}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">{item.category}</h2>
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {item.category}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.status === 'available' ? 'bg-green-100 text-green-800' :
                        item.status === 'claimed' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Description:</span>
                        <p className="text-gray-700 mt-1">{item.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Location:</span>
                          <p className="text-gray-700 font-medium">
                            {item.found_location?.[0]?.location || 'Location not specified'}
                            {item.found_location?.[0]?.floor_id && `, Floor ${item.found_location[0].floor_id}`}
                            {item.found_location?.[0]?.hall_name && `, ${item.found_location[0].hall_name}`}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Found Date:</span>
                          <p className="text-gray-700 font-medium">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {item.founderContact && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Contact:</span>
                          <p className="text-gray-700 font-medium">{item.founderContact.name} - {item.founderContact.email}</p>
                        </div>
                      )}

                      <div className="pt-3 border-t border-gray-200">
                        <span className="text-xs font-medium text-gray-400">Item ID:</span>
                        <p className="text-xs text-gray-500 font-mono">{item._id}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <div className="flex justify-between items-center">
                <button
                  onClick={handleBack}
                  className="px-8 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  ← Back
                </button>
                <button
                  onClick={handleStartOver}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Start New Search
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ItemDetailsPage;
