import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SimilarityInput } from '../types';

const ItemSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [similarityData, setSimilarityData] = useState<SimilarityInput | null>(null);
  const [matchedItemIds, setMatchedItemIds] = useState<(string | number)[]>([]);
  const [locationMatch, setLocationMatch] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    const data = sessionStorage.getItem('similarityData');
    const matched = sessionStorage.getItem('matchedItemIds');
    const locMatch = sessionStorage.getItem('locationMatch');
    
    if (data && matched) {
      setSimilarityData(JSON.parse(data));
      setMatchedItemIds(JSON.parse(matched));
      setLocationMatch(locMatch === 'true');
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

  // Filter items to only show matched ones from Python backend
  const matchedItems = similarityData.items.filter(item => 
    matchedItemIds.some(id => String(id) === String(item.itemId))
  );

  // Sort items by similarity score (highest first)
  const sortedItems = [...matchedItems].sort((a, b) => b.similarityScore - a.similarityScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Matched Items</h1>
        <p className="text-gray-600 mb-6">Select 1 to 5 items from the matched list below</p>

        {/* Owner Info Summary */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Owner ID:</span>
              <p className="font-medium text-gray-800">{similarityData.ownerId}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Category:</span>
              <p className="font-medium text-gray-800">{similarityData.categoryName}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Owner Location:</span>
              <p className="font-medium text-gray-800">{similarityData.ownerLocation}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Location Match:</span>
              <p className={`font-medium ${locationMatch ? 'text-green-600' : 'text-orange-600'}`}>
                {locationMatch ? '✓ Yes' : '○ Partial'}
              </p>
            </div>
          </div>
        </div>

        {/* Match Results Banner */}
        <div className={`border-l-4 p-4 mb-6 ${locationMatch ? 'bg-green-50 border-green-400' : 'bg-yellow-50 border-yellow-400'}`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {locationMatch ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm ${locationMatch ? 'text-green-700' : 'text-yellow-700'}`}>
                Found <span className="font-bold">{matchedItems.length}</span> matching items based on location proximity
              </p>
            </div>
          </div>
        </div>

        {/* Selection Info */}
        <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 mb-6">
          <p className="text-sm text-indigo-700">
            Selected: <span className="font-bold">{selectedItems.length}/5</span> items
          </p>
        </div>

        {/* No matches message */}
        {matchedItems.length === 0 && (
          <div className="bg-gray-50 rounded-lg p-8 text-center mb-6">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Matching Items Found</h3>
            <p className="text-gray-500 mb-4">
              The Python backend did not find any items matching your location criteria.
            </p>
            <button
              onClick={handleBack}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Items Grid */}
        <div className="space-y-4 mb-8">
          {sortedItems.map((item, index) => {
            const isSelected = selectedItems.includes(item.itemId);
            const scoreColor = item.similarityScore >= 70 ? 'text-green-600' : 
                              item.similarityScore >= 50 ? 'text-yellow-600' : 'text-red-600';
            
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
                      <div className="ml-auto">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Matched
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 ml-9">
                      <div>
                        <span className="text-sm text-gray-500">Description Score:</span>
                        <p className={`text-2xl font-bold ${scoreColor}`}>
                          {item.similarityScore}%
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Location:</span>
                        <p className="font-medium text-gray-800">{item.location}</p>
                        {item.floorId && <p className="text-xs text-gray-500 mt-1">Floor: {item.floorId}</p>}
                        {item.hallName && <p className="text-xs text-gray-500">Hall: {item.hallName}</p>}
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
        {matchedItems.length > 0 && (
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
        )}
      </div>
    </div>
  );
};

export default ItemSelectionPage;
