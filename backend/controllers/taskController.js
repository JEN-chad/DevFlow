import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { Sprint } from '../models/Sprint.js';
import { Activity } from '../models/Activity.js';
import mongoose from 'mongoose';
import { emitProjectEvent } from '../config/socket.js';
import { createNotification } from '../services/notificationService.js';

// Helper to log activities
const logActivity = async (userId, projectId, action, metadata = {}) => {
  try {
    const activity = new Activity({
      user: userId,
      project: projectId,
      action,
      metadata,
    });
    await activity.save();
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

/**
 * Create a new task/issue
 * POST /api/projects/:projectId/tasks
 */
export const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log('Received task payload:', req.body);
    const { title, description, status, priority, sprintId, assignee, estimatedHours, storyPoints } = req.body;

    // 1. Validation checks
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required',
      });
    }

    if (title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Task title must be at least 3 characters',
      });
    }

    if (estimatedHours !== undefined && (typeof estimatedHours !== 'number' || estimatedHours < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Estimated hours must be a non-negative number',
      });
    }

    if (storyPoints !== undefined && (typeof storyPoints !== 'number' || storyPoints < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Story points must be a non-negative number',
      });
    }

    // 2. Project check
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // 3. Project role check
    let userRole = null;
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

    // System Owner override
    if (!userRole && req.user.role === 'OWNER') {
      userRole = 'OWNER';
    }

    if (!userRole || !['OWNER', 'SCRUM_MASTER', 'DEVELOPER'].includes(userRole)) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: You do not have permission to create tasks in this project',
      });
    }

    // 4. Sprint check
    if (sprintId) {
      if (!mongoose.isValidObjectId(sprintId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sprint ID format',
        });
      }
      const sprint = await Sprint.findById(sprintId);
      if (!sprint) {
        return res.status(404).json({
          success: false,
          message: 'Sprint not found',
        });
      }
      if (sprint.projectId.toString() !== projectId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Sprint does not belong to this project',
        });
      }
    }

    // 5. Create task
    const task = new Task({
      projectId,
      sprintId: sprintId || undefined,
      title: title.trim(),
      description: description?.trim() || '',
      status: status || 'TODO',
      priority: priority || 'MEDIUM',
      assignee: assignee || undefined,
      estimatedHours: estimatedHours || 0,
      completedHours: status === 'DONE' ? (estimatedHours || 0) : 0,
      storyPoints: storyPoints || 0,
    });

    await task.save();
    console.log('Created task:', task);

    // Trigger Notification for Assignee if assigned
    if (task.assignee) {
      await createNotification({
        recipient: task.assignee,
        sender: req.user._id,
        project: projectId,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned',
        message: `You have been assigned to task: "${task.title}"`,
        link: `/dashboard/tasks`,
      });
    }

    // Log activity
    await logActivity(req.user._id, projectId, `Created task "${task.title}"`, {
      taskId: task._id,
      taskTitle: task.title,
    });

    const populatedTask = await Task.findById(task._id).populate('assignee', '_id username email avatar');

    emitProjectEvent(projectId, 'task-created', populatedTask);

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: populatedTask,
    });
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create task',
    });
  }
};

/**
 * Get all tasks for a project
 * GET /api/projects/:projectId/tasks
 */
export const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { sprintId } = req.query;

    let filter = { projectId };
    if (sprintId) {
      filter.sprintId = sprintId;
    }

    const tasks = await Task.find(filter)
      .populate('assignee', '_id username email avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
    });
  }
};

/**
 * Update task details / status
 * PUT /api/tasks/:id
 */
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, sprintId, assignee, estimatedHours, completedHours, storyPoints } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const changes = [];

    const prevAssignee = task.assignee ? task.assignee.toString() : null;
    const prevStatus = task.status;

    if (title !== undefined && title.trim() !== task.title) {
      changes.push(`title to "${title.trim()}"`);
      task.title = title.trim();
    }
    if (description !== undefined && description.trim() !== task.description) {
      task.description = description.trim();
    }
    if (status !== undefined && status !== task.status) {
      changes.push(`status to "${status}"`);
      task.status = status;
      if (status === 'DONE' && task.estimatedHours > 0 && !completedHours) {
        task.completedHours = task.estimatedHours;
      }
    }
    if (priority !== undefined && priority !== task.priority) {
      changes.push(`priority to "${priority}"`);
      task.priority = priority;
    }
    if (sprintId !== undefined && String(sprintId || '') !== String(task.sprintId || '')) {
      changes.push(`sprint`);
      task.sprintId = sprintId || undefined;
    }
    if (assignee !== undefined && String(assignee || '') !== String(task.assignee || '')) {
      changes.push(`assignee`);
      task.assignee = assignee || undefined;
    }
    if (estimatedHours !== undefined && estimatedHours !== task.estimatedHours) {
      task.estimatedHours = estimatedHours;
    }
    if (completedHours !== undefined && completedHours !== task.completedHours) {
      task.completedHours = completedHours;
    }
    if (storyPoints !== undefined && storyPoints !== task.storyPoints) {
      changes.push(`story points to ${storyPoints}`);
      task.storyPoints = storyPoints;
    }

    await task.save();

    // Trigger Notification for assignee if assigned/changed
    const currentAssignee = task.assignee ? task.assignee.toString() : null;
    if (currentAssignee && currentAssignee !== prevAssignee) {
      await createNotification({
        recipient: task.assignee,
        sender: req.user._id,
        project: task.projectId,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned',
        message: `You have been assigned to task: "${task.title}"`,
        link: `/dashboard/tasks`,
      });
    }

    // Trigger Notification for task completed (status set to DONE)
    if (task.status === 'DONE' && prevStatus !== 'DONE') {
      const project = await Project.findById(task.projectId);
      if (project && project.owner) {
        await createNotification({
          recipient: project.owner,
          sender: req.user._id,
          project: task.projectId,
          type: 'TASK_COMPLETED',
          title: 'Task Completed',
          message: `Task "${task.title}" has been completed by ${req.user.username}`,
          link: `/dashboard/tasks`,
        });
      }
    }

    if (changes.length > 0) {
      await logActivity(req.user._id, task.projectId, `Updated task "${task.title}": changed ${changes.join(', ')}`, {
        taskId: task._id,
        taskTitle: task.title,
        changes,
      });
    }

    const populatedTask = await Task.findById(task._id).populate('assignee', '_id username email avatar');

    if (changes.length > 0) {
      const statusChanged = changes.some(c => c.startsWith('status to'));
      if (statusChanged) {
        emitProjectEvent(task.projectId, 'task-moved', populatedTask);
      } else {
        emitProjectEvent(task.projectId, 'task-updated', populatedTask);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: populatedTask,
    });
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update task',
    });
  }
};

/**
 * Delete task
 * DELETE /api/tasks/:id
 */
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    await Task.findByIdAndDelete(id);

    // Log activity
    await logActivity(req.user._id, task.projectId, `Deleted task "${task.title}"`, {
      taskId: task._id,
      taskTitle: task.title,
    });

    emitProjectEvent(task.projectId, 'task-deleted', { taskId: id });

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete task',
    });
  }
};
