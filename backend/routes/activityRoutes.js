import express from 'express';
import { protectRoute } from '../middlewares/authMiddleware.js';
import {
  getProjectActivities,
  getTaskActivities,
  getUserActivities
} from '../controllers/activityController.js';

const router = express.Router();

// Authenticate all activity endpoints
router.use(protectRoute);

router.get('/activities', getUserActivities);
router.get('/projects/:projectId/activities', getProjectActivities);
router.get('/tasks/:taskId/activities', getTaskActivities);

export default router;
