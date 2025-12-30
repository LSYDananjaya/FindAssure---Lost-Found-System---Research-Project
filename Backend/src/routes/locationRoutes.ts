import express from 'express';
import {
  getMainLocations,
  getBuildingFloors,
  getFloorHalls,
  getAllLocationData,
} from '../controllers/locationController';

const router = express.Router();

// Get all main campus locations
router.get('/main', getMainLocations);

// Get all location data at once
router.get('/all', getAllLocationData);

// Get floors for a specific building
router.get('/:building/floors', getBuildingFloors);

// Get halls for a specific floor in a building
router.get('/:building/floors/:floorId/halls', getFloorHalls);

export default router;
