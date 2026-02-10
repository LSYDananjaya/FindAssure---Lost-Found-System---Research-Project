import React, { useState, useEffect } from 'react';
import { campusLocations, newBuildingFloors, formatLocationName, type Floor } from '../data/locations';
import type { LocationDetail } from '../types';

interface LocationPickerProps {
  value: LocationDetail | null;
  onChange: (location: LocationDetail) => void;
  label?: string;
  required?: boolean;
  userType?: 'owner' | 'founder';
  allowDoNotRemember?: boolean;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ 
  value, 
  onChange, 
  label = 'Location',
  required = false,
  userType = 'owner',
  allowDoNotRemember = false
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string>(value?.location || '');
  const [selectedFloor, setSelectedFloor] = useState<string>(value?.floor_id || '');
  const [selectedHall, setSelectedHall] = useState<string>(value?.hall_name || '');
  const [showFloorSelect, setShowFloorSelect] = useState(false);
  const [showHallSelect, setShowHallSelect] = useState(false);
  const [doNotRememberFloor, setDoNotRememberFloor] = useState(false);
  const [doNotRememberHall, setDoNotRememberHall] = useState(false);

  // Determine if location has floors
  const hasFloors = (location: string): boolean => {
    return location === 'new_building';
  };

  // Get floor options for new_building
  const getFloorOptions = (): Floor[] => {
    return newBuildingFloors;
  };

  // Get hall options for selected floor
  const getHallOptions = (): any[] => {
    const floor = newBuildingFloors.find(f => f.floor_id === selectedFloor);
    return floor?.hall_list || [];
  };

  useEffect(() => {
    if (selectedLocation) {
      const locationHasFloors = hasFloors(selectedLocation);
      setShowFloorSelect(locationHasFloors);
      
      if (!locationHasFloors) {
        setSelectedFloor('');
        setSelectedHall('');
        setShowHallSelect(false);
        setDoNotRememberFloor(false);
        setDoNotRememberHall(false);
        
        onChange({
          location: selectedLocation,
          floor_id: null,
          hall_name: null,
        });
      } else {
        if (value?.location !== selectedLocation) {
          setSelectedFloor('');
          setSelectedHall('');
          setShowHallSelect(false);
        }
      }
    } else {
      setShowFloorSelect(false);
      setShowHallSelect(false);
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (doNotRememberFloor) {
      setSelectedFloor('');
      setSelectedHall('');
      setShowHallSelect(false);
      setDoNotRememberHall(false);
      
      onChange({
        location: selectedLocation,
        floor_id: null,
        hall_name: null,
      });
    } else if (selectedFloor) {
      setShowHallSelect(true);
      if (value?.floor_id !== selectedFloor) {
        setSelectedHall('');
        setDoNotRememberHall(false);
      }
    } else {
      setShowHallSelect(false);
    }
  }, [selectedFloor, doNotRememberFloor]);

  useEffect(() => {
    if (doNotRememberHall && selectedFloor) {
      setSelectedHall('');
      onChange({
        location: selectedLocation,
        floor_id: selectedFloor,
        hall_name: null,
      });
    } else if (selectedHall) {
      onChange({
        location: selectedLocation,
        floor_id: selectedFloor,
        hall_name: selectedHall,
      });
    }
  }, [selectedHall, doNotRememberHall]);

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
  };

  const handleFloorChange = (floor: string) => {
    setSelectedFloor(floor);
    setDoNotRememberFloor(false);
  };

  const handleHallChange = (hall: string) => {
    setSelectedHall(hall);
    setDoNotRememberHall(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {/* Building/Location Dropdown */}
        <select
          value={selectedLocation}
          onChange={(e) => handleLocationChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required={required}
        >
          <option value="">Select Location</option>
          {campusLocations.map((location) => (
            <option key={location} value={location}>
              {formatLocationName(location)}
            </option>
          ))}
        </select>
      </div>

      {/* Floor Selection for New Building */}
      {showFloorSelect && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Floor {userType === 'founder' ? <span className="text-red-500">*</span> : ''}
          </label>
          
          {allowDoNotRemember && userType === 'owner' && (
            <label className="flex items-center text-sm text-gray-600 mb-2">
              <input
                type="checkbox"
                checked={doNotRememberFloor}
                onChange={(e) => setDoNotRememberFloor(e.target.checked)}
                className="mr-2"
              />
              I don't remember the floor
            </label>
          )}
          
          {!doNotRememberFloor && (
            <select
              value={selectedFloor}
              onChange={(e) => handleFloorChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required={userType === 'founder'}
            >
              <option value="">Select Floor</option>
              {getFloorOptions().map((floor) => (
                <option key={floor.floor_id} value={floor.floor_id}>
                  Floor {floor.floor_id}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Hall Selection */}
      {showHallSelect && !doNotRememberFloor && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hall/Room {userType === 'founder' ? <span className="text-red-500">*</span> : ''}
          </label>
          
          {allowDoNotRemember && userType === 'owner' && (
            <label className="flex items-center text-sm text-gray-600 mb-2">
              <input
                type="checkbox"
                checked={doNotRememberHall}
                onChange={(e) => setDoNotRememberHall(e.target.checked)}
                className="mr-2"
              />
              I don't remember the hall
            </label>
          )}
          
          {!doNotRememberHall && (
            <select
              value={selectedHall}
              onChange={(e) => handleHallChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required={userType === 'founder'}
            >
              <option value="">Select Hall/Room</option>
              {getHallOptions().map((hall) => (
                <option key={hall.actual_location} value={hall.actual_location}>
                  {formatLocationName(hall.actual_location)}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Current Selection Display */}
      {value && value.location && (
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
          <strong className="text-blue-800">Selected Location:</strong>
          <div className="mt-1">
            <span className="text-blue-700">{formatLocationName(value.location)}</span>
            {value.floor_id && <span className="text-blue-700"> → Floor {value.floor_id}</span>}
            {value.hall_name && <span className="text-blue-700"> → {formatLocationName(value.hall_name)}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
