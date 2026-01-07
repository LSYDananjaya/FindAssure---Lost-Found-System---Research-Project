import React, { useState, useEffect } from 'react';
import { campusLocations, newBuildingFloors, formatLocationName, type Floor } from '../data/locations';

interface LocationSelectorProps {
  value: string;
  onChange: (location: string) => void;
  label: string;
  required?: boolean;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ value, onChange, label, required = false }) => {
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedHall, setSelectedHall] = useState<string>('');
  const [rememberFloor, setRememberFloor] = useState<boolean>(true);
  const [rememberHall, setRememberHall] = useState<boolean>(true);

  // Parse existing value on component mount
  useEffect(() => {
    if (value) {
      // Check if it's a new_building location
      const floor = newBuildingFloors.find(f => 
        f.hall_list.some(h => h.actual_location === value)
      );
      
      if (floor) {
        setSelectedBuilding('new_building');
        setSelectedFloor(floor.floor_id);
        setSelectedHall(value);
        setRememberFloor(true);
        setRememberHall(true);
      } else if (campusLocations.includes(value)) {
        setSelectedBuilding(value);
        setSelectedFloor('');
        setSelectedHall('');
      }
    }
  }, [value]);

  const handleBuildingChange = (building: string) => {
    setSelectedBuilding(building);
    setSelectedFloor('');
    setSelectedHall('');
    setRememberFloor(true);
    setRememberHall(true);
    
    if (building !== 'new_building') {
      onChange(building);
    } else {
      onChange('');
    }
  };

  const handleFloorChange = (floorId: string) => {
    setSelectedFloor(floorId);
    setSelectedHall('');
    setRememberHall(true);
    
    if (!rememberFloor) {
      onChange('new_building');
    } else {
      onChange('');
    }
  };

  const handleHallChange = (hall: string) => {
    setSelectedHall(hall);
    onChange(hall);
  };

  const handleRememberFloorChange = (remember: boolean) => {
    setRememberFloor(remember);
    if (!remember) {
      setSelectedFloor('');
      setSelectedHall('');
      setRememberHall(true);
      onChange('new_building');
    } else {
      onChange('');
    }
  };

  const handleRememberHallChange = (remember: boolean) => {
    setRememberHall(remember);
    if (!remember && selectedFloor) {
      setSelectedHall('');
      onChange(`new_building_floor_${selectedFloor}`);
    } else {
      onChange('');
    }
  };

  const currentFloor: Floor | undefined = newBuildingFloors.find(f => f.floor_id === selectedFloor);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {/* Building/Location Dropdown */}
        <select
          value={selectedBuilding}
          onChange={(e) => handleBuildingChange(e.target.value)}
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

      {/* New Building - Floor Selection */}
      {selectedBuilding === 'new_building' && (
        <div>
          <div className="flex items-center gap-4 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Floor
            </label>
            <label className="flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                checked={!rememberFloor}
                onChange={(e) => handleRememberFloorChange(!e.target.checked)}
                className="mr-2"
              />
              Don't remember floor
            </label>
          </div>
          
          {rememberFloor && (
            <select
              value={selectedFloor}
              onChange={(e) => handleFloorChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Floor</option>
              {newBuildingFloors.map((floor) => (
                <option key={floor.floor_id} value={floor.floor_id}>
                  Floor {floor.floor_id}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* New Building - Hall Selection */}
      {selectedBuilding === 'new_building' && selectedFloor && rememberFloor && (
        <div>
          <div className="flex items-center gap-4 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Hall/Room
            </label>
            <label className="flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                checked={!rememberHall}
                onChange={(e) => handleRememberHallChange(!e.target.checked)}
                className="mr-2"
              />
              Don't remember hall
            </label>
          </div>
          
          {rememberHall && currentFloor && (
            <select
              value={selectedHall}
              onChange={(e) => handleHallChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Hall/Room</option>
              {currentFloor.hall_list.map((hall) => (
                <option key={hall.actual_location} value={hall.actual_location}>
                  {formatLocationName(hall.actual_location)}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Current Selection Display */}
      {value && (
        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
          <strong>Selected:</strong> {formatLocationName(value)}
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
