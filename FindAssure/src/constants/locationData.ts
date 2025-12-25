// Location data types
export interface LocationDirections {
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  front?: string;
  back?: string;
}

export interface MainLocation {
  actual_location: string;
  directions: LocationDirections;
}

export interface Hall {
  actual_location: string;
  directions: LocationDirections;
}

export interface Floor {
  floor_id: string;
  up_flow: string;
  down_flow: string;
  hall_list: Hall[];
}

export interface LocationDetail {
  location: string;
  floor_id?: string | null;
  hall_name?: string | null;
}

// Main campus locations
export const MAIN_LOCATIONS: MainLocation[] = [
  {
    actual_location: "auditorium",
    directions: {
      left: "road",
      right: "sliit_islands",
      top: "n/a",
      bottom: "n/a",
      front: "main_entrance",
      back: "anohana_canteen"
    }
  },
  {
    actual_location: "anohana_canteen",
    directions: {
      left: "road",
      right: "auditorium",
      top: "n/a",
      bottom: "n/a",
      front: "road",
      back: "main_building"
    }
  },
  {
    actual_location: "main_building",
    directions: {
      left: "anohana_canteen",
      right: "road",
      top: "n/a",
      bottom: "basement_canteen",
      front: "sliit_islands",
      back: "road"
    }
  },
  {
    actual_location: "basement_canteen",
    directions: {
      left: "road",
      right: "anohana_canteen",
      top: "main_building",
      bottom: "n/a",
      front: "road",
      back: "sliit_islands"
    }
  },
  {
    actual_location: "business_faculty",
    directions: {
      left: "n/a",
      right: "car_park1",
      top: "n/a",
      bottom: "juice_bar",
      front: "road",
      back: "play_ground"
    }
  },
  {
    actual_location: "juice_bar",
    directions: {
      left: "road",
      right: "play_ground",
      top: "business_faculty",
      bottom: "n/a",
      front: "car_park1",
      back: "n/a"
    }
  },
  {
    actual_location: "play_ground",
    directions: {
      left: "sliit_beach",
      right: "lake_view",
      top: "n/a",
      bottom: "n/a",
      front: "road",
      back: "n/a"
    }
  },
  {
    actual_location: "bird_nest",
    directions: {
      left: "open_theater",
      right: "road",
      top: "n/a",
      bottom: "finagle_canteen",
      front: "road",
      back: "road"
    }
  },
  {
    actual_location: "volleyball_court",
    directions: {
      left: "basketball_court",
      right: "sliit_islands",
      top: "n/a",
      bottom: "n/a",
      front: "road",
      back: "n/a"
    }
  },
  {
    actual_location: "basketball_court",
    directions: {
      left: "vehicle_parking",
      right: "volleyball_court",
      top: "n/a",
      bottom: "n/a",
      front: "road",
      back: "n/a"
    }
  },
  {
    actual_location: "tennis_court",
    directions: {
      left: "engineering_faculty",
      right: "n/a",
      top: "n/a",
      bottom: "n/a",
      front: "road",
      back: "n/a"
    }
  },
  {
    actual_location: "engineering_faculty",
    directions: {
      left: "new_building",
      right: "tennis_court",
      top: "n/a",
      bottom: "n/a",
      front: "car_park2",
      back: "n/a"
    }
  },
  {
    actual_location: "new_building",
    directions: {
      left: "willium_angliss",
      right: "engineering_faculty",
      top: "n/a",
      bottom: "canteen",
      front: "road",
      back: "n/a"
    }
  },
  {
    actual_location: "willium_angliss",
    directions: {
      left: "n/a",
      right: "new_building",
      top: "n/a",
      bottom: "n/a",
      front: "road",
      back: "swimming_pool"
    }
  },
  {
    actual_location: "green_house",
    directions: {
      left: "lake",
      right: "n/a",
      top: "n/a",
      bottom: "n/a",
      front: "road",
      back: "n/a"
    }
  },
  {
    actual_location: "lake",
    directions: {
      left: "road",
      right: "green_house",
      top: "n/a",
      bottom: "n/a",
      front: "road",
      back: "n/a"
    }
  },
  {
    actual_location: "car_park1",
    directions: {
      left: "road",
      right: "business_faculty",
      top: "n/a",
      bottom: "n/a",
      front: "sliit_beach",
      back: "road"
    }
  },
  {
    actual_location: "reception",
    directions: {
      left: "sliit_islands",
      right: "road",
      top: "n/a",
      bottom: "gymnasium",
      front: "road",
      back: "p&S_canteen"
    }
  },
  {
    actual_location: "guard_room",
    directions: {
      left: "n/a",
      right: "road",
      top: "n/a",
      bottom: "n/a",
      front: "road",
      back: "main_entrance"
    }
  }
];

// Buildings that have floor/hall structure
export const BUILDINGS_WITH_FLOORS = ['new_building'];

// New Building floor and hall data - Due to size, importing from separate file
import { NEW_BUILDING_FLOORS } from './newBuildingFloors';
export { NEW_BUILDING_FLOORS };

// Helper functions
export const hasFloors = (location: string): boolean => {
  return BUILDINGS_WITH_FLOORS.includes(location);
};

export const getFloorsForBuilding = (building: string): Floor[] => {
  if (building === 'new_building') {
    return NEW_BUILDING_FLOORS;
  }
  return [];
};

export const formatLocationName = (location: string): string => {
  return location
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getLocationOptions = () => {
  return MAIN_LOCATIONS.map((loc) => ({
    label: formatLocationName(loc.actual_location),
    value: loc.actual_location,
  }));
};

export const getFloorOptions = (building: string) => {
  const floors = getFloorsForBuilding(building);
  return floors.map((floor) => ({
    label: `Floor ${floor.floor_id}`,
    value: floor.floor_id,
  }));
};

export const getHallOptions = (building: string, floorId: string) => {
  const floors = getFloorsForBuilding(building);
  const floor = floors.find((f) => f.floor_id === floorId);
  
  if (!floor) return [];
  
  return floor.hall_list.map((hall) => ({
    label: formatLocationName(hall.actual_location),
    value: hall.actual_location,
  }));
};
