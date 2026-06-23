import express from 'express';
import { protectRoute } from '../middlewares/authMiddleware.js';
import {
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask
} from '../controllers/taskController.js';

const router = express.Router();

// Authenticate all task operations
router.use(protectRoute);

// Project nested task routes
router.post('/projects/:projectId/tasks', createTask);
router.get('/projects/:projectId/tasks', getTasksByProject);

// Individual task routes
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

export default router;
