import React, { useState, useEffect } from 'react';
import {
  getLocationOptions,
  getFloorOptions,
  getHallOptions,
  hasFloors,
} from '../constants/locationData';
import type { LocationDetail } from '../constants/locationData';
import './LocationPicker.css';

interface LocationPickerProps {
  value: LocationDetail | null;
  onChange: (location: LocationDetail) => void;
  allowDoNotRemember?: boolean;
  userType?: 'founder' | 'owner';
  label?: string;
  error?: string;
  required?: boolean;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  allowDoNotRemember = false,
  userType = 'founder',
  label = 'Location',
  error,
  required = true,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string>(value?.location || '');
  const [selectedFloor, setSelectedFloor] = useState<string>(value?.floor_id || '');
  const [selectedHall, setSelectedHall] = useState<string>(value?.hall_name || '');
  const [showFloorSelect, setShowFloorSelect] = useState(false);
  const [showHallSelect, setShowHallSelect] = useState(false);

  const locationOptions = getLocationOptions();

  useEffect(() => {
    if (selectedLocation) {
      const locationHasFloors = hasFloors(selectedLocation);
      setShowFloorSelect(locationHasFloors);
      
      if (!locationHasFloors) {
        // If location doesn't have floors, set empty for floor and hall
        setSelectedFloor('');
        setSelectedHall('');
        setShowHallSelect(false);
        
        onChange({
          location: selectedLocation,
          floor_id: null,
          hall_name: null,
        });
      } else {
        // Reset floor and hall when location changes
        if (value?.location !== selectedLocation) {
          setSelectedFloor('');
          setSelectedHall('');
          setShowHallSelect(false);
        }
      }
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (selectedFloor && selectedFloor !== 'do_not_remember') {
      // Both founder and owner should see hall selection
      setShowHallSelect(true);
      if (value?.floor_id !== selectedFloor) {
        setSelectedHall('');
      }
    } else if (selectedFloor === 'do_not_remember') {
      setShowHallSelect(false);
      setSelectedHall('');
      onChange({
        location: selectedLocation,
        floor_id: null,
        hall_name: null,
      });
    } else {
      setShowHallSelect(false);
      setSelectedHall('');
    }
  }, [selectedFloor, userType]);

  useEffect(() => {
    if (selectedHall) {
      if (selectedHall === 'do_not_remember') {
        // Owner can choose not to remember hall
        onChange({
          location: selectedLocation,
          floor_id: selectedFloor,
          hall_name: null,
        });
      } else {
        onChange({
          location: selectedLocation,
          floor_id: selectedFloor,
          hall_name: selectedHall,
        });
      }
    }
  }, [selectedHall]);

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLocation(e.target.value);
  };

  const handleFloorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFloor(e.target.value);
  };

  const handleHallChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedHall(e.target.value);
  };

  const floorOptions = selectedLocation ? getFloorOptions(selectedLocation) : [];
  const hallOptions = selectedLocation && selectedFloor ? getHallOptions(selectedLocation, selectedFloor) : [];

  return (
    <div className="location-picker">
      {label && (
        <label className="location-picker-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      
      {/* Main Location Select */}
      <div className="select-wrapper">
        <select
          value={selectedLocation}
          onChange={handleLocationChange}
          className={`location-select ${error ? 'error' : ''}`}
          required={required}
        >
          <option value="">Select Location</option>
          {locationOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Floor Select - Only show if location has floors */}
      {showFloorSelect && (
        <div className="select-wrapper">
          <select
            value={selectedFloor}
            onChange={handleFloorChange}
            className="location-select"
            required={userType === 'founder'}
          >
            <option value="">Select Floor</option>
            {userType === 'owner' && allowDoNotRemember && (
              <option value="do_not_remember">Do Not Remember</option>
            )}
            {floorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Hall Select - Show if floor is selected */}
      {showHallSelect && selectedFloor && selectedFloor !== 'do_not_remember' && (
        <div className="select-wrapper">
          <select
            value={selectedHall}
            onChange={handleHallChange}
            className="location-select"
            required={userType === 'founder'}
          >
            <option value="">Select Hall</option>
            {userType === 'owner' && allowDoNotRemember && (
              <option value="do_not_remember">Do Not Remember</option>
            )}
            {hallOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Error Message */}
      {error && <div className="location-picker-error">{error}</div>}

      {/* Help Text */}
      {selectedLocation && hasFloors(selectedLocation) && !selectedFloor && (
        <div className="location-picker-help">
          {userType === 'founder' 
            ? 'Please select the floor where the item was found' 
            : 'Please select the floor or choose "Do Not Remember"'}
        </div>
      )}
      
      {selectedFloor && !selectedHall && selectedFloor !== 'do_not_remember' && (
        <div className="location-picker-help">
          {userType === 'founder'
            ? 'Please select the specific hall'
            : 'Please select the hall or choose "Do Not Remember"'}
        </div>
      )}
    </div>
  );
};
