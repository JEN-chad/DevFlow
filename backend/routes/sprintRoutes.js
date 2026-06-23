import express from 'express';
import { protectRoute } from '../middlewares/authMiddleware.js';
import {
  createSprint,
  getSprintsByProject,
  getSprintById,
  updateSprint,
  startSprint,
  completeSprint,
  deleteSprint,
} from '../controllers/sprintController.js';
import {
  validateCreateSprint,
  validateUpdateSprint,
} from '../validators/sprintValidator.js';

const router = express.Router();

// Ensure all sprint routes require active user authentication
router.use(protectRoute);

// Project-nested sprint routes
router.post('/projects/:projectId/sprints', validateCreateSprint, createSprint);
router.get('/projects/:projectId/sprints', getSprintsByProject);

// Individual sprint routes
router.get('/sprints/:id', getSprintById);
router.put('/sprints/:id', validateUpdateSprint, updateSprint);
router.delete('/sprints/:id', deleteSprint);
router.patch('/sprints/:id/start', startSprint);
router.patch('/sprints/:id/complete', completeSprint);

export default router;
