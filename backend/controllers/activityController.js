import { Activity } from '../models/Activity.js';
import { Project } from '../models/Project.js';

/**
 * Get activity logs across all projects the user is associated with
 * GET /api/activities
 */
export const getUserActivities = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    // Find all projects where the user is owner or member
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'members.userId': req.user._id },
      ],
    });

    const projectIds = projects.map((p) => p._id);

    const activities = await Activity.find({ project: { $in: projectIds } })
      .populate('user', '_id username email avatar')
      .populate('project', '_id name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error('Get user activities error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
    });
  }
};

/**
 * Get all activity logs for a project
 * GET /api/projects/:projectId/activities
 */
export const getProjectActivities = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 50 } = req.query;

    const activities = await Activity.find({ project: projectId })
      .populate('user', '_id username email avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error('Get project activities error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch project activities',
    });
  }
};

/**
 * Get activity logs for a specific task
 * GET /api/tasks/:taskId/activities
 */
export const getTaskActivities = async (req, res) => {
  try {
    const { taskId } = req.params;

    const activities = await Activity.find({ 'metadata.taskId': taskId })
      .populate('user', '_id username email avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error('Get task activities error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch task activities',
    });
  }
};
