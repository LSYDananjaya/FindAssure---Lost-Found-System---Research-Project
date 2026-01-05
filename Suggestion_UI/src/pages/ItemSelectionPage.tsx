import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SimilarityInput } from '../types';

const ItemSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [similarityData, setSimilarityData] = useState<SimilarityInput | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    const data = sessionStorage.getItem('similarityData');
    if (data) {
      setSimilarityData(JSON.parse(data));
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleToggleItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      if (selectedItems.length < 5) {
        setSelectedItems([...selectedItems, itemId]);
      } else {
        alert('You can select a maximum of 5 items');
      }
    }
  };

  const handleNext = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }
    sessionStorage.setItem('selectedItemIds', JSON.stringify(selectedItems));
    navigate('/item-details');
  };

  const handleBack = () => {
    navigate('/');
  };

  if (!similarityData) {
    return null;
  }

  // Sort items by similarity score (highest first)
  const sortedItems = [...similarityData.items].sort((a, b) => b.similarityScore - a.similarityScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Select Items for Verification</h1>
        <p className="text-gray-600 mb-6">Select 1 to 5 items from the list below</p>

        {/* Owner Info Summary */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Owner ID:</span>
              <p className="font-medium text-gray-800">{similarityData.ownerId}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Owner Location:</span>
              <p className="font-medium text-gray-800">{similarityData.owner_location}</p>
            </div>
          </div>
        </div>

        {/* Selection Info */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-sm text-yellow-700">
            Selected: <span className="font-bold">{selectedItems.length}/5</span> items
          </p>
        </div>

        {/* Items Grid */}
        <div className="space-y-4 mb-8">
          {sortedItems.map((item, index) => {
            const isSelected = selectedItems.includes(item.itemId);
            const scoreColor = item.similarityScore >= 0.7 ? 'text-green-600' : 
                              item.similarityScore >= 0.5 ? 'text-yellow-600' : 'text-red-600';
            
            return (
              <div
                key={index}
                onClick={() => handleToggleItem(item.itemId)}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-5 h-5 text-blue-600"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Item #{index + 1}
                        </h3>
                        <p className="text-sm text-gray-500">ID: {item.itemId}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 ml-9">
                      <div>
                        <span className="text-sm text-gray-500">Similarity Score:</span>
                        <p className={`text-2xl font-bold ${scoreColor}`}>
                          {(item.similarityScore * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="ml-4">
                      <div className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            className="px-8 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            ← Back
          </button>
          <button
            onClick={handleNext}
            disabled={selectedItems.length === 0}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemSelectionPage;
