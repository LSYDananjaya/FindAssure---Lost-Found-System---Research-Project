import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFoundItemsByIds } from '../services/itemService';
import type { FoundItem } from '../types';

interface MatchedResults {
  location_match: boolean;
  matched_item_ids: (string | number)[]; // Support both ID formats
  matched_locations: string[];
  success: boolean;
}

const MatchedItemsPage: React.FC = () => {
  const navigate = useNavigate();
  const [matchedItems, setMatchedItems] = useState<FoundItem[]>([]);
  const [matchedResults, setMatchedResults] = useState<MatchedResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMatchedItems = async () => {
      try {
        // Get matched results from sessionStorage
        const resultsStr = sessionStorage.getItem('matchedResults');
        if (!resultsStr) {
          alert('No matched results found. Redirecting...');
          navigate('/');
          return;
        }

        const results: MatchedResults = JSON.parse(resultsStr);
        setMatchedResults(results);

        console.log('Matched results from Python backend:', results);

        if (results.matched_item_ids.length === 0) {
          alert('No matching items found.');
          setLoading(false);
          return;
        }

        // Fetch full item details for matched IDs
        const itemIds = results.matched_item_ids.map(id => id.toString());
        console.log('Fetching items with IDs:', itemIds);
        
        const items = await getFoundItemsByIds(itemIds);
        console.log('Fetched items:', items);
        setMatchedItems(items);
      } catch (error) {
        console.error('Error loading matched items:', error);
        alert('Failed to load matched items. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadMatchedItems();
  }, [navigate]);

  const handleBack = () => {
    navigate('/');
  };

  const handleStartOver = () => {
    sessionStorage.removeItem('similarityData');
    sessionStorage.removeItem('matchedResults');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading matched items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
    <div className="max-w-7xl mx-auto">
      {/* Header with Back Button on Left */}
      <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Back
          </button>
          <div className="flex-1 ml-6">
            <h1 className="text-3xl font-bold text-gray-800">🎯 Matched Items</h1>
            <p className="text-gray-600 mt-2">
              Found {matchedItems.length} matching item{matchedItems.length !== 1 ? 's' : ''} based on location and similarity
            </p>
          </div>
        </div>

          {/* Match Summary */}
        {matchedResults && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6 mt-4">
            <h2 className="text-xl font-semibold text-green-800 mb-3">✅ Match Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Location Match:</span>
                <p className={`text-lg font-bold ${matchedResults.location_match ? 'text-green-600' : 'text-red-600'}`}>
                  {matchedResults.location_match ? '✓ YES' : '✗ NO'}
                </p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Matched Items:</span>
                <p className="text-lg font-bold text-blue-600">{matchedResults.matched_item_ids.length}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Matched Locations:</span>
                <p className="text-sm text-gray-800 mt-1">
                  {matchedResults.matched_locations.join(', ') || 'None'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* Matched Items Grid */}
        {matchedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchedItems.map((item) => {
              const isPlaceholder = item.imageUrl.includes('placeholder') || item.imageUrl.startsWith('file://');
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
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Item Image */}
                  <div className={`h-48 flex items-center justify-center ${isPlaceholder ? 'bg-gray-100' : 'bg-gray-200'}`}>
                    {isPlaceholder ? (
                      <span className="text-6xl">{categoryEmojis[item.category] || '📦'}</span>
                    ) : (
                      <img
                        src={item.imageUrl}
                        alt={item.category}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-800">{item.category}</h3>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        Matched
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">📍 Location:</span>
                        <p className="text-gray-600 ml-5">
                          {item.found_location[0]?.location || 'Not specified'}
                          {item.found_location[0]?.floor_id && `, Floor ${item.found_location[0].floor_id}`}
                          {item.found_location[0]?.hall_name && `, ${item.found_location[0].hall_name}`}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">📅 Found on:</span>
                        <p className="text-gray-600 ml-5">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">❓ Questions:</span>
                        <p className="text-gray-600 ml-5">{item.questions.length} verification questions</p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">🏷️ ID:</span>
                        <p className="text-gray-600 ml-5 font-mono text-xs">{item._id}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Matches Found</h2>
            <p className="text-gray-600 mb-6">
              No items matched the location criteria. Try adjusting your search parameters.
            </p>
            <button
              onClick={handleStartOver}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Start Over
            </button>
          </div>
        )}

        {/* Actions */}
        {matchedItems.length > 0 && (
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={handleStartOver}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
            >
              🔄 Start New Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchedItemsPage;
