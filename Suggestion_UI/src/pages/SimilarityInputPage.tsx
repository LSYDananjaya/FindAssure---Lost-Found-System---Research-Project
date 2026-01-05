import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SimilarItem, SimilarityInput, User, FoundItem, LocationDetail } from '../types';
import LocationPicker from '../components/LocationPicker';
import ConfidenceStageSelector from '../components/ConfidenceStageSelector';
import { getAllUsers, getFoundItems, findItems, type FindItemsRequest } from '../services/itemService';

const SimilarityInputPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  
  const [formData, setFormData] = useState<SimilarityInput>({
    ownerId: '',
    owner_location: '',
    floor_id: null,
    hall_name: null,
    owner_location_confidence_stage: 0,
    items: [],
  });

  const [currentItem, setCurrentItem] = useState<SimilarItem>({
    itemId: '',
    similarityScore: 0,
  });

  // Fetch users and items on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, itemsData] = await Promise.all([
          getAllUsers(),
          getFoundItems()
        ]);
        setUsers(usersData.filter(u => u.role === 'owner')); // Only show owners
        setFoundItems(itemsData.filter(item => item.status === 'available')); // Only available items
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load users or items. Please try again.');
      } finally {
        setLoadingUsers(false);
        setLoadingItems(false);
      }
    };

    fetchData();
  }, []);

  const handleLocationChange = (location: LocationDetail) => {
    setFormData({
      ...formData,
      owner_location: location.location,
      floor_id: location.floor_id || null,
      hall_name: location.hall_name || null,
    });
  };

  const handleAddItem = () => {
    if (currentItem.itemId && currentItem.similarityScore > 0) {
      setFormData({
        ...formData,
        items: [...formData.items, currentItem],
      });
      setCurrentItem({
        itemId: '',
        similarityScore: 0,
      });
    } else {
      alert('Please fill in all item fields (Item ID and Similarity Score)');
    }
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleNext = async () => {
    if (formData.ownerId && formData.owner_location && formData.owner_location_confidence_stage > 0 && formData.items.length > 0) {
      try {
        // Get first item's category as the main category
        const firstItem = getSelectedItem(formData.items[0].itemId);
        if (!firstItem) {
          alert('Could not find the first selected item. Please try again.');
          return;
        }

        // Calculate average similarity score as description_match_cofidence
        const avgSimilarity = formData.items.reduce((sum, item) => sum + item.similarityScore, 0) / formData.items.length;
        const descriptionMatchConfidence = Math.round(avgSimilarity * 100);

        // Generate a numeric owner_id from the string _id (using hash or index)
        const ownerIndex = users.findIndex(u => u._id === formData.ownerId);
        const numericOwnerId = ownerIndex >= 0 ? ownerIndex + 100 : 100; // Start from 100 to avoid conflicts

        // Create a mapping between numeric IDs and MongoDB ObjectIds
        const idMapping: { [key: number]: string } = {};

        // Build the request payload
        const requestData: FindItemsRequest = {
          owner_id: numericOwnerId,
          categary_name: firstItem.category.toLowerCase(),
          categary_data: formData.items.map(item => {
            const foundItem = getSelectedItem(item.itemId);
            // Extract numeric ID from MongoDB ObjectId string or use a hash
            const numericItemId = parseInt(item.itemId.substring(item.itemId.length - 6), 16) % 10000;
            
            // Store the mapping for later retrieval
            idMapping[numericItemId] = item.itemId;
            
            return {
              id: numericItemId,
              description_scrore: Math.round(item.similarityScore * 100),
              found_location: foundItem?.found_location.map(loc => ({
                location: loc.location,
                floor_id: loc.floor_id ? parseInt(loc.floor_id) : null,
                hall_name: loc.hall_name || null,
              })) || [{
                location: 'unknown',
                floor_id: null,
                hall_name: null,
              }],
            };
          }),
          description_match_cofidence: descriptionMatchConfidence,
          owner_location: formData.owner_location,
          floor_id: formData.floor_id ? parseInt(formData.floor_id) : null,
          hall_name: formData.hall_name || null,
          owner_location_confidence_stage: formData.owner_location_confidence_stage,
        };

        console.log('Sending request to find-items API:', requestData);
        console.log('ID Mapping (numeric -> MongoDB ObjectId):', idMapping);

        // Call the API
        const response = await findItems(requestData);
        
        console.log('Response from find-items API:', response);

        if (response.success) {
          // Convert numeric IDs back to MongoDB ObjectIds
          const realItemIds = response.matched_item_ids
            .map(numericId => idMapping[Number(numericId)])
            .filter(id => id !== undefined); // Remove any that don't have a mapping

          console.log('Converted matched IDs to MongoDB ObjectIds:', realItemIds);

          // Store the real MongoDB ObjectIds instead of numeric IDs
          const responseWithRealIds = {
            ...response,
            matched_item_ids: realItemIds
          };

          // Store both the form data and the response for the next page
          sessionStorage.setItem('similarityData', JSON.stringify(formData));
          sessionStorage.setItem('matchedResults', JSON.stringify(responseWithRealIds));
          navigate('/matched-items');
        } else {
          alert('No matches found. Please try different items or locations.');
        }
      } catch (error: any) {
        console.error('Error calling find-items API:', error);
        alert(`Failed to find matching items: ${error.response?.data?.message || error.message || 'Unknown error'}`);
      }
    } else {
      alert('Please fill in all required fields: Owner, Location, Confidence Stage, and add at least one item');
    }
  };

  const getSelectedUser = () => {
    return users.find(u => u._id === formData.ownerId);
  };

  const getSelectedItem = (itemId: string) => {
    return foundItems.find(item => item._id === itemId);
  };

  const currentLocation: LocationDetail | null = formData.owner_location ? {
    location: formData.owner_location,
    floor_id: formData.floor_id,
    hall_name: formData.hall_name,
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Location Similarity Input</h1>
        <p className="text-gray-600 mb-6">Configure owner location and similar found items for testing</p>
        
        {/* Owner Information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">👤 Owner Information</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Owner <span className="text-red-500">*</span>
              </label>
              {loadingUsers ? (
                <div className="text-gray-500">Loading users...</div>
              ) : (
                <select
                  value={formData.ownerId}
                  onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose an owner...</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name || user.email} - {user.email}
                    </option>
                  ))}
                </select>
              )}
              {getSelectedUser() && (
                <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <strong>ID:</strong> {getSelectedUser()?._id}
                </div>
              )}
            </div>
            
            <LocationPicker
              value={currentLocation}
              onChange={handleLocationChange}
              label="Owner Location"
              required={true}
              userType="owner"
              allowDoNotRemember={true}
            />
            
            <ConfidenceStageSelector
              value={formData.owner_location_confidence_stage}
              onChange={(stage) => setFormData({ ...formData, owner_location_confidence_stage: stage })}
              label="Owner Location Confidence Stage"
              required={true}
            />
          </div>
        </div>

        {/* Add Similar Items */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">📦 Add Similar Found Items</h2>
          <div className="bg-gray-50 p-6 rounded-lg mb-4 border border-gray-200">
            <div className="grid grid-cols-1 gap-6 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Found Item <span className="text-red-500">*</span>
                </label>
                {loadingItems ? (
                  <div className="text-gray-500">Loading items...</div>
                ) : (
                  <>
                    <select
                      value={currentItem.itemId}
                      onChange={(e) => setCurrentItem({ ...currentItem, itemId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a found item...</option>
                      {foundItems.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.category} - {item.description.substring(0, 50)}...
                        </option>
                      ))}
                    </select>
                    {currentItem.itemId && getSelectedItem(currentItem.itemId) && (
                      <div className="mt-2 text-sm text-gray-600 bg-white p-3 rounded border">
                        <div><strong>ID:</strong> {currentItem.itemId}</div>
                        <div><strong>Category:</strong> {getSelectedItem(currentItem.itemId)?.category}</div>
                        <div><strong>Location:</strong> {getSelectedItem(currentItem.itemId)?.found_location[0]?.location}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Similarity Score (0-100) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={currentItem.similarityScore}
                  onChange={(e) => setCurrentItem({ ...currentItem, similarityScore: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0 - 100"
                  required
                />
                <small className="text-gray-500 text-xs">Description match score between 0 and 100</small>
              </div>
            </div>
            <button
              onClick={handleAddItem}
              disabled={!currentItem.itemId || currentItem.similarityScore <= 0}
              className="w-full md:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              ➕ Add Item
            </button>
          </div>

          {/* Items List */}
          {formData.items.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-700">
                📋 Added Items ({formData.items.length})
              </h3>
              {formData.items.map((item, index) => {
                const foundItem = getSelectedItem(item.itemId);
                const confidenceLabels = ['', '😊 Pretty Sure', '🙂 Sure', '🤔 Not Sure'];
                return (
                  <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-gray-500 uppercase font-semibold">Item</span>
                          <p className="font-medium text-gray-800">{foundItem?.category || 'Unknown'}</p>
                          <p className="text-sm text-gray-600 truncate">{item.itemId}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase font-semibold">Similarity Score</span>
                          <p className="font-medium text-blue-600 text-lg">{item.similarityScore.toFixed(2)}</p>
                        </div>
                       
                      </div>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="ml-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary and Next Button */}
        <div className="border-t pt-6">
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">📊 Summary</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <div><strong>Owner:</strong> {getSelectedUser()?.name || getSelectedUser()?.email || 'Not selected'}</div>
              <div><strong>Location:</strong> {formData.owner_location || 'Not selected'}</div>
              <div><strong>Confidence Stage:</strong> {['Not selected', '😊 Pretty Sure', '🙂 Sure', '🤔 Not Sure'][formData.owner_location_confidence_stage]}</div>
              <div><strong>Similar Items:</strong> {formData.items.length} item(s) added</div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleNext}
              disabled={!formData.ownerId || !formData.owner_location || formData.owner_location_confidence_stage === 0 || formData.items.length === 0}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium shadow-lg"
            >
              Next Step →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimilarityInputPage;
