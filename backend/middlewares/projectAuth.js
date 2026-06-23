import { Project } from '../models/Project.js';
import mongoose from 'mongoose';

/**
 * Middleware to restrict route access based on project-specific roles
 * @param  {...string} allowedRoles - Array of allowed roles: 'OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'VIEWER'
 */
export const requireProjectRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Find the project ID from request parameters
      const projectId = req.params.projectId || req.params.id;

      if (!projectId || !mongoose.isValidObjectId(projectId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project ID format',
        });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found',
        });
      }

      let userRole = null;

      // Determine the user's project-specific role
      if (project.owner.toString() === req.user._id.toString()) {
        userRole = 'OWNER';
      } else {
        const member = project.members.find(
          (m) => m.userId.toString() === req.user._id.toString()
        );
        if (member) {
          userRole = member.role;
        }
      }

      // System OWNER override: allow access as OWNER if user is system administrator
      if (!userRole && req.user.role === 'OWNER') {
        userRole = 'OWNER';
      }

      if (!userRole || !allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: Access denied. Required project role: [${allowedRoles.join(', ')}]. Your project role: ${userRole || 'None'}`,
        });
      }

      // Attach the project instance and resolved role to the request
      req.project = project;
      req.projectRole = userRole;
      
      next();
    } catch (error) {
      console.error('Project authorization middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during project authorization verification',
      });
    }
  };
};
