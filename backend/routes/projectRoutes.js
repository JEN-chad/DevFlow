import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  archiveProject,
  inviteMember,
  updateMemberRole,
  removeMember,
  getProjectDashboard,
} from '../controllers/projectController.js';
import { protectRoute } from '../middlewares/authMiddleware.js';
import { requireProjectRole } from '../middlewares/projectAuth.js';
import {
  validateCreateProject,
  validateUpdateProject,
  validateInviteMember,
  validateUpdateMemberRole,
} from '../validators/projectValidator.js';

const router = express.Router();

// Ensure user is authenticated for any project operations
router.use(protectRoute);

// Project CRUD Base Routes
router.post('/', validateCreateProject, createProject);
router.get('/', getProjects);

// Single Project View & Management
router.get('/:id', requireProjectRole('OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'VIEWER'), getProjectById);
router.put('/:id', requireProjectRole('OWNER'), validateUpdateProject, updateProject);
router.delete('/:id', requireProjectRole('OWNER'), deleteProject);
router.patch('/:id/archive', requireProjectRole('OWNER'), archiveProject);

// Analytics Dashboard Endpoint
router.get('/:id/dashboard', requireProjectRole('OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'VIEWER'), getProjectDashboard);

// Project Member Operations (Owner only)
router.post('/:id/members', requireProjectRole('OWNER'), validateInviteMember, inviteMember);
router.put('/:id/members/:userId', requireProjectRole('OWNER'), validateUpdateMemberRole, updateMemberRole);
router.delete('/:id/members/:userId', requireProjectRole('OWNER'), removeMember);

export default router;
