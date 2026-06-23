import express from 'express';
import { getDashboardAnalytics, getSprintBurndown } from '../controllers/analyticsController.js';
import { protectRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to protect all analytics endpoints
router.use(protectRoute);

// Base route for dashboard overview and metrics
router.get('/', getDashboardAnalytics);

// Sprint-specific burndown metrics
router.get('/sprints/:sprintId/burndown', getSprintBurndown);

export default router;
