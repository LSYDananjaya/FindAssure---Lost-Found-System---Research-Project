import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SimilarItem, SimilarityInput } from '../types';
import LocationSelector from '../components/LocationSelector';

const SimilarityInputPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SimilarityInput>({
    ownerId: '',
    ownerLocation: '',
    items: [],
  });

  const [currentItem, setCurrentItem] = useState<SimilarItem>({
    itemId: '',
    similarityScore: 0,
    location: '',
  });

  const handleAddItem = () => {
    if (currentItem.itemId && currentItem.location) {
      setFormData({
        ...formData,
        items: [...formData.items, currentItem],
      });
      setCurrentItem({
        itemId: '',
        similarityScore: 0,
        location: '',
      });
    }
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleNext = () => {
    if (formData.ownerId && formData.ownerLocation && formData.items.length > 0) {
      // Store data in sessionStorage to pass to next page
      sessionStorage.setItem('similarityData', JSON.stringify(formData));
      navigate('/select-items');
    } else {
      alert('Please fill in all required fields and add at least one item');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Location Similarity Input</h1>
        
        {/* Owner Information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Owner Information</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner ID *
              </label>
              <input
                type="text"
                value={formData.ownerId}
                onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter owner ID"
              />
            </div>
            <div>
              <LocationSelector
                value={formData.ownerLocation}
                onChange={(location) => setFormData({ ...formData, ownerLocation: location })}
                label="Owner Location"
                required={true}
              />
            </div>
          </div>
        </div>

        {/* Add Items */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Add Similar Items</h2>
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
                  placeholder="Enter found item ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Similarity Score (0-1) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={currentItem.similarityScore}
                  onChange={(e) => setCurrentItem({ ...currentItem, similarityScore: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00 - 1.00"
                />
              </div>
              <div>
                <LocationSelector
                  value={currentItem.location}
                  onChange={(location) => setCurrentItem({ ...currentItem, location })}
                  label="Item Location"
                  required={false}
                />
              </div>
            </div>
            <button
              onClick={handleAddItem}
              className="w-full md:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
                      <p className="font-medium">{item.similarityScore.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Location:</span>
                      <p className="font-medium">{item.location}</p>
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
            disabled={!formData.ownerId || !formData.ownerLocation || formData.items.length === 0}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimilarityInputPage;
