import { Sprint } from '../models/Sprint.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import mongoose from 'mongoose';
import { emitProjectEvent } from '../config/socket.js';
import { createNotification } from '../services/notificationService.js';

/**
 * Helper function to check project role permissions for a sprint
 */
const getProjectRole = async (projectId, userId, systemUser) => {
  const project = await Project.findById(projectId);
  if (!project) return null;

  if (project.owner.toString() === userId.toString()) {
    return 'OWNER';
  }

  const member = project.members.find(
    (m) => m.userId.toString() === userId.toString()
  );

  if (member) {
    return member.role;
  }

  // System Owner fallback
  if (systemUser && systemUser.role === 'OWNER') {
    return 'OWNER';
  }

  return null;
};

/**
 * Create a new Sprint
 * POST /api/projects/:projectId/sprints
 */
export const createSprint = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, goal, startDate, endDate } = req.body;

    const userRole = await getProjectRole(projectId, req.user._id, req.user);
    if (!userRole || !['OWNER', 'SCRUM_MASTER'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only OWNER and SCRUM_MASTER can create sprints',
      });
    }

    const sprint = new Sprint({
      projectId,
      name: name.trim(),
      goal: goal?.trim() || '',
      startDate,
      endDate,
      status: 'PLANNED',
      velocity: 0,
    });

    await sprint.save();

    emitProjectEvent(projectId, 'sprint-created', sprint);

    return res.status(201).json({
      success: true,
      message: 'Sprint planned successfully',
      sprint,
    });
  } catch (error) {
    console.error('Create sprint error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create sprint',
    });
  }
};

/**
 * Get all Sprints for a project
 * GET /api/projects/:projectId/sprints
 */
export const getSprintsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const userRole = await getProjectRole(projectId, req.user._id, req.user);
    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not a member of this project',
      });
    }

    const sprints = await Sprint.find({ projectId }).sort({ startDate: -1 });

    return res.status(200).json({
      success: true,
      sprints,
    });
  } catch (error) {
    console.error('Get sprints error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch sprints',
    });
  }
};

/**
 * Get Sprint details and task stats
 * GET /api/sprints/:id
 */
export const getSprintById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sprint ID format',
      });
    }

    const sprint = await Sprint.findById(id);
    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found',
      });
    }

    const userRole = await getProjectRole(sprint.projectId, req.user._id, req.user);
    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not a member of this project',
      });
    }

    // Retrieve all tasks associated with this sprint
    const tasks = await Task.find({ sprintId: sprint._id }).populate('assignee', '_id username email avatar');
    console.log('Sprint query tasks:', tasks);

    // Calculate metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
    const remainingTasks = totalTasks - completedTasks;

    const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalCompletedHours = tasks.reduce((sum, t) => sum + (t.completedHours || 0), 0);
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return res.status(200).json({
      success: true,
      sprint,
      userRole,
      stats: {
        totalTasks,
        completedTasks,
        remainingTasks,
        totalEstimatedHours,
        totalCompletedHours,
        progressPercentage,
      },
      tasks,
    });
  } catch (error) {
    console.error('Get sprint by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch sprint details',
    });
  }
};

/**
 * Update Sprint details
 * PUT /api/sprints/:id
 */
export const updateSprint = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, goal, startDate, endDate } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sprint ID format',
      });
    }

    const sprint = await Sprint.findById(id);
    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found',
      });
    }

    const userRole = await getProjectRole(sprint.projectId, req.user._id, req.user);
    if (!userRole || !['OWNER', 'SCRUM_MASTER'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only OWNER and SCRUM_MASTER can update sprints',
      });
    }

    if (name !== undefined) sprint.name = name.trim();
    if (goal !== undefined) sprint.goal = goal.trim();
    if (startDate !== undefined) sprint.startDate = startDate;
    if (endDate !== undefined) sprint.endDate = endDate;

    await sprint.save();

    emitProjectEvent(sprint.projectId, 'sprint-updated', sprint);

    return res.status(200).json({
      success: true,
      message: 'Sprint updated successfully',
      sprint,
    });
  } catch (error) {
    console.error('Update sprint error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update sprint',
    });
  }
};

/**
 * Start a Sprint (Transition to ACTIVE)
 * PATCH /api/sprints/:id/start
 */
export const startSprint = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sprint ID format',
      });
    }

    const sprint = await Sprint.findById(id);
    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found',
      });
    }

    const userRole = await getProjectRole(sprint.projectId, req.user._id, req.user);
    if (!userRole || !['OWNER', 'SCRUM_MASTER'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only OWNER and SCRUM_MASTER can start sprints',
      });
    }

    if (sprint.status !== 'PLANNED') {
      return res.status(400).json({
        success: false,
        message: `Cannot start a sprint that is already ${sprint.status}`,
      });
    }

    // Verify no other ACTIVE sprint exists for this project
    const activeSprint = await Sprint.findOne({
      projectId: sprint.projectId,
      status: 'ACTIVE',
    });

    if (activeSprint) {
      return res.status(400).json({
        success: false,
        message: `Project already has an active sprint: "${activeSprint.name}". Complete it before starting a new one.`,
      });
    }

    sprint.status = 'ACTIVE';
    await sprint.save();

    // Trigger Notification for Sprint Started to all project members
    try {
      const project = await Project.findById(sprint.projectId);
      if (project) {
        const recipientIds = [];
        if (project.owner.toString() !== req.user._id.toString()) {
          recipientIds.push(project.owner);
        }
        project.members.forEach((m) => {
          if (m.userId.toString() !== req.user._id.toString()) {
            recipientIds.push(m.userId);
          }
        });

        for (const recipientId of recipientIds) {
          await createNotification({
            recipient: recipientId,
            sender: req.user._id,
            project: sprint.projectId,
            type: 'SPRINT_STARTED',
            title: 'Sprint Started',
            message: `Sprint "${sprint.name}" has been started in project "${project.name}"`,
            link: `/dashboard/sprints`,
          });
        }
      }
    } catch (notifErr) {
      console.error('Failed to trigger sprint started notifications:', notifErr);
    }

    emitProjectEvent(sprint.projectId, 'sprint-updated', sprint);

    return res.status(200).json({
      success: true,
      message: 'Sprint started successfully',
      sprint,
    });
  } catch (error) {
    console.error('Start sprint error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start sprint',
    });
  }
};

/**
 * Complete a Sprint (Transition to COMPLETED & calculate velocity)
 * PATCH /api/sprints/:id/complete
 */
export const completeSprint = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sprint ID format',
      });
    }

    const sprint = await Sprint.findById(id);
    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found',
      });
    }

    const userRole = await getProjectRole(sprint.projectId, req.user._id, req.user);
    if (!userRole || !['OWNER', 'SCRUM_MASTER'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only OWNER and SCRUM_MASTER can complete sprints',
      });
    }

    if (sprint.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete a sprint that is in status: ${sprint.status}`,
      });
    }

    // Velocity = sum of estimatedHours of completed tasks (status: 'DONE')
    const completedTasks = await Task.find({
      sprintId: sprint._id,
      status: 'DONE',
    });

    const calculatedVelocity = completedTasks.reduce(
      (sum, task) => sum + (task.estimatedHours || 0),
      0
    );

    sprint.status = 'COMPLETED';
    sprint.velocity = calculatedVelocity;
    await sprint.save();

    emitProjectEvent(sprint.projectId, 'sprint-updated', sprint);

    return res.status(200).json({
      success: true,
      message: `Sprint completed successfully. Final velocity: ${calculatedVelocity} hours.`,
      sprint,
    });
  } catch (error) {
    console.error('Complete sprint error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete sprint',
    });
  }
};

/**
 * Delete a Sprint
 * DELETE /api/sprints/:id
 */
export const deleteSprint = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sprint ID format',
      });
    }

    const sprint = await Sprint.findById(id);
    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found',
      });
    }

    const userRole = await getProjectRole(sprint.projectId, req.user._id, req.user);
    if (!userRole || !['OWNER', 'SCRUM_MASTER'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only OWNER and SCRUM_MASTER can delete sprints',
      });
    }

    // Unlink any associated tasks
    await Task.updateMany({ sprintId: sprint._id }, { $unset: { sprintId: 1 } });

    await Sprint.findByIdAndDelete(id);

    emitProjectEvent(sprint.projectId, 'sprint-deleted', { sprintId: id });

    return res.status(200).json({
      success: true,
      message: 'Sprint deleted successfully and associated tasks unlinked',
    });
  } catch (error) {
    console.error('Delete sprint error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete sprint',
    });
  }
};
