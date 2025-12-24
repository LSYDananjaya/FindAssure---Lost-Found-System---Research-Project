import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SimilarItem, SimilarityInput } from '../types';
import LocationSelector from '../components/LocationSelector';
import { findMatchingItems } from '../services/locationMatchService';

const SimilarityInputPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<SimilarityInput>({
    ownerId: '',
    categoryName: '',
    descriptionMatchConfidence: 90,
    ownerLocation: '',
    ownerFloorId: null,
    ownerHallName: null,
    ownerLocationConfidenceStage: 2,
    items: [],
  });

  const [currentItem, setCurrentItem] = useState<SimilarItem>({
    itemId: '',
    similarityScore: 0,
    location: '',
    floorId: null,
    hallName: null,
  });

  // Parse location details from LocationSelector
  const handleOwnerLocationChange = (location: string) => {
    // Check if location contains explicit floor pattern (e.g., "new_building_floor_2")
    // This pattern specifically looks for "_floor_" followed by digits
    const floorMatch = location.match(/^(.+)_floor_(\d+)$/);
    if (floorMatch) {
      const baseLocation = floorMatch[1];
      const floorId = parseInt(floorMatch[2]);
      
      setFormData({
        ...formData,
        ownerLocation: baseLocation,
        ownerFloorId: floorId,
        ownerHallName: null,
      });
    } else {
      // Regular location without floor (e.g., "basketball_court", "tennis_court")
      setFormData({
        ...formData,
        ownerLocation: location,
        ownerFloorId: null,
        ownerHallName: null,
      });
    }
  };

  const handleItemLocationChange = (location: string) => {
    console.log('Item location changed:', location); // Debug log
    
    // Check if location contains explicit floor pattern (e.g., "new_building_floor_2")
    // This pattern specifically looks for "_floor_" followed by digits
    const floorMatch = location.match(/^(.+)_floor_(\d+)$/);
    if (floorMatch) {
      const baseLocation = floorMatch[1];
      const floorId = parseInt(floorMatch[2]);
      
      setCurrentItem({
        ...currentItem,
        location: baseLocation,
        floorId: floorId,
        hallName: null,
      });
    } else {
      // Regular location without floor (e.g., "basketball_court", "tennis_court")
      setCurrentItem({
        ...currentItem,
        location: location,
        floorId: null,
        hallName: null,
      });
    }
  };

  const handleAddItem = () => {
    console.log('Add Item clicked. Current item:', currentItem); // Debug log
    
    if (currentItem.itemId && currentItem.location) {
      setFormData({
        ...formData,
        items: [...formData.items, { ...currentItem }],
      });
      setCurrentItem({
        itemId: '',
        similarityScore: 0,
        location: '',
        floorId: null,
        hallName: null,
      });
    } else {
      console.log('Validation failed - itemId:', currentItem.itemId, 'location:', currentItem.location);
    }
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleNext = async () => {
    // Validation
    if (!formData.ownerId || !formData.categoryName || !formData.ownerLocation || formData.items.length === 0) {
      setError('Please fill in all required fields and add at least one item');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call Python backend API
      const response = await findMatchingItems(formData);
      
      if (!response.success) {
        throw new Error('Location matching failed');
      }

      // Store both the original data and the matched results
      sessionStorage.setItem('similarityData', JSON.stringify(formData));
      sessionStorage.setItem('matchedItemIds', JSON.stringify(response.matched_item_ids));
      sessionStorage.setItem('matchedLocations', JSON.stringify(response.matched_locations));
      sessionStorage.setItem('locationMatch', JSON.stringify(response.location_match));
      
      // Navigate to item selection page with matched items
      navigate('/select-items');
    } catch (err) {
      console.error('Error calling Python backend:', err);
      setError(err instanceof Error ? err.message : 'Failed to match items. Please ensure the Python backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Location-Based Item Suggestion</h1>
        
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Owner Information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Owner Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner ID *
              </label>
              <input
                type="text"
                value={formData.ownerId}
                onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter owner ID (e.g., 692e7edb5c6402c6e07dc156)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={formData.categoryName}
                onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter category (e.g., laptop)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description Match Confidence (0-100) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.descriptionMatchConfidence}
                onChange={(e) => setFormData({ ...formData, descriptionMatchConfidence: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter confidence (0-100)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Location Confidence Stage *
              </label>
              <select
                value={formData.ownerLocationConfidenceStage}
                onChange={(e) => setFormData({ ...formData, ownerLocationConfidenceStage: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>Stage 1 - Low Confidence</option>
                <option value={2}>Stage 2 - Medium Confidence</option>
                <option value={3}>Stage 3 - High Confidence</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <LocationSelector
                value={formData.ownerLocation}
                onChange={handleOwnerLocationChange}
                label="Owner Location"
                required={true}
              />
            </div>
          </div>
        </div>

        {/* Add Items */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Add Found Items</h2>
          <div className="bg-gray-50 p-6 rounded-lg mb-4">
            <div className="grid grid-cols-1 gap-6 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item ID (Found Item) *
                </label>
                <input
                  type="text"
                  value={currentItem.itemId}
                  onChange={(e) => setCurrentItem({ ...currentItem, itemId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter found item ID (e.g., 692e7edb5c6402c6e07dc156)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description Score (0-100) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={currentItem.similarityScore}
                  onChange={(e) => setCurrentItem({ ...currentItem, similarityScore: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter score (0-100)"
                />
              </div>
              <div>
                <LocationSelector
                  value={currentItem.location}
                  onChange={handleItemLocationChange}
                  label="Item Location"
                  required={false}
                />
              </div>
            </div>
            
            {/* Debug Info - Remove after testing */}
            <div className="bg-gray-100 p-3 rounded text-xs">
              <p><strong>Debug:</strong></p>
              <p>Item ID: {currentItem.itemId || '(empty)'}</p>
              <p>Location: {currentItem.location || '(empty)'}</p>
              <p>Score: {currentItem.similarityScore}</p>
              <p>Button enabled: {currentItem.itemId && currentItem.location ? 'YES' : 'NO'}</p>
            </div>
            
            <button
              onClick={handleAddItem}
              disabled={!currentItem.itemId || !currentItem.location}
              className="w-full md:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Add Item
            </button>
          </div>

          {/* Items List */}
          {formData.items.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-700">Added Items ({formData.items.length})</h3>
              {formData.items.map((item, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                  <div className="grid grid-cols-3 gap-4 flex-1">
                    <div>
                      <span className="text-sm text-gray-500">Item ID:</span>
                      <p className="font-medium">{item.itemId}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Score:</span>
                      <p className="font-medium">{item.similarityScore}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Location:</span>
                      <p className="font-medium">{item.location}</p>
                      {item.floorId && <p className="text-xs text-gray-500">Floor: {item.floorId}</p>}
                      {item.hallName && <p className="text-xs text-gray-500">Hall: {item.hallName}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="ml-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Next Button */}
        <div className="flex justify-end">
          <button
            onClick={handleNext}
            disabled={loading || !formData.ownerId || !formData.categoryName || !formData.ownerLocation || formData.items.length === 0}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Matching Items...
              </>
            ) : (
              'Find Matches →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimilarityInputPage;
