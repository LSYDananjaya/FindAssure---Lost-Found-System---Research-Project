import { Request, Response } from 'express';
import {
  MAIN_LOCATIONS,
  NEW_BUILDING_FLOORS,
  BUILDINGS_WITH_FLOORS,
  hasFloors,
  getFloorsForBuilding,
  formatLocationName,
} from '../constants/locationData';

/**
 * Get all main campus locations
 */
export const getMainLocations = async (req: Request, res: Response): Promise<void> => {
  try {
    const locations = MAIN_LOCATIONS.map((loc) => ({
      value: loc.actual_location,
      label: formatLocationName(loc.actual_location),
      hasFloors: hasFloors(loc.actual_location),
    }));

    res.status(200).json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error('Error fetching main locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch locations',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get floors for a specific building
 */
export const getBuildingFloors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { building } = req.params;

    if (!building) {
      res.status(400).json({
        success: false,
        message: 'Building name is required',
      });
      return;
    }

    if (!hasFloors(building)) {
      res.status(200).json({
        success: true,
        data: [],
        message: 'This building does not have floors',
      });
      return;
    }

    const floors = getFloorsForBuilding(building);
    const formattedFloors = floors.map((floor) => ({
      value: floor.floor_id,
      label: `Floor ${floor.floor_id}`,
      floor_id: floor.floor_id,
      up_flow: floor.up_flow,
      down_flow: floor.down_flow,
    }));

    res.status(200).json({
      success: true,
      data: formattedFloors,
    });
  } catch (error) {
    console.error('Error fetching building floors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch building floors',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get halls for a specific floor in a building
 */
export const getFloorHalls = async (req: Request, res: Response): Promise<void> => {
  try {
    const { building, floorId } = req.params;

    if (!building || !floorId) {
      res.status(400).json({
        success: false,
        message: 'Building name and floor ID are required',
      });
      return;
    }

    if (!hasFloors(building)) {
      res.status(200).json({
        success: true,
        data: [],
        message: 'This building does not have floors',
      });
      return;
    }

    const floors = getFloorsForBuilding(building);
    const floor = floors.find((f) => f.floor_id === floorId);

    if (!floor) {
      res.status(404).json({
        success: false,
        message: 'Floor not found',
      });
      return;
    }

    const halls = floor.hall_list.map((hall) => ({
      value: hall.actual_location,
      label: formatLocationName(hall.actual_location),
      directions: hall.directions,
    }));

    res.status(200).json({
      success: true,
      data: halls,
    });
  } catch (error) {
    console.error('Error fetching floor halls:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch floor halls',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get complete location data including all buildings, floors, and halls
 */
export const getAllLocationData = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: {
        mainLocations: MAIN_LOCATIONS,
        buildingsWithFloors: BUILDINGS_WITH_FLOORS,
        newBuildingFloors: NEW_BUILDING_FLOORS,
      },
    });
  } catch (error) {
    console.error('Error fetching all location data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
