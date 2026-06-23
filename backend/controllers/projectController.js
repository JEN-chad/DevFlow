import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { Sprint } from '../models/Sprint.js';
import { Task } from '../models/Task.js';
import { Repository } from '../models/Repository.js';
import mongoose from 'mongoose';
import { emitProjectEvent } from '../config/socket.js';

/**
 * Create a new project
 * POST /api/projects
 */
export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    const project = new Project({
      name: name.trim(),
      description: description?.trim() || '',
      owner: req.user._id,
      members: [
        {
          userId: req.user._id,
          role: 'OWNER',
        },
      ],
      repositories: [],
      status: 'ACTIVE',
    });

    await project.save();

    // Populate owner details for UI
    const populatedProject = await Project.findById(project._id)
      .populate('owner', '_id username email avatar');

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: populatedProject,
    });
  } catch (error) {
    console.error('Create project error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create project',
    });
  }
};

/**
 * Get all projects where user is owner or member
 * GET /api/projects
 */
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'members.userId': req.user._id }
      ]
    })
      .populate('owner', '_id username email avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
    });
  }
};

/**
 * Get single project details
 * GET /api/projects/:id
 */
export const getProjectById = async (req, res) => {
  try {
    // Populate full details for rendering details page
    const project = await Project.findById(req.project._id)
      .populate('owner', '_id username email avatar')
      .populate('members.userId', '_id username email avatar role')
      .populate('repositories');

    return res.status(200).json({
      success: true,
      project,
      userRole: req.projectRole, // Resolved by requireProjectRole middleware
    });
  } catch (error) {
    console.error('Get project details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch project details',
    });
  }
};

/**
 * Update project details
 * PUT /api/projects/:id
 */
export const updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = req.project;

    if (name !== undefined) project.name = name.trim();
    if (description !== undefined) project.description = description.trim();

    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('owner', '_id username email avatar')
      .populate('members.userId', '_id username email avatar role');

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project: populatedProject,
    });
  } catch (error) {
    console.error('Update project error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update project',
    });
  }
};

/**
 * Delete project and cascade clean related models
 * DELETE /api/projects/:id
 */
export const deleteProject = async (req, res) => {
  try {
    const project = req.project;

    // Delete associated sprint, task, repository documents
    await Sprint.deleteMany({ projectId: project._id });
    await Task.deleteMany({ projectId: project._id });
    await Repository.deleteMany({ projectId: project._id });

    // Delete project itself
    await Project.findByIdAndDelete(project._id);

    return res.status(200).json({
      success: true,
      message: 'Project and all related data deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete project',
    });
  }
};

/**
 * Toggle project archived status
 * PATCH /api/projects/:id/archive
 */
export const archiveProject = async (req, res) => {
  try {
    const project = req.project;

    project.status = project.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED';
    await project.save();

    return res.status(200).json({
      success: true,
      message: `Project status set to ${project.status}`,
      project,
    });
  } catch (error) {
    console.error('Archive project error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update project archive status',
    });
  }
};

/**
 * Invite/Add member to project
 * POST /api/projects/:id/members
 */
export const inviteMember = async (req, res) => {
  try {
    const { username, email, role } = req.body;
    const project = req.project;

    // Search for user in database
    let query = {};
    if (email) {
      query.email = email.toLowerCase().trim();
    } else if (username) {
      query.username = username.trim();
    }

    const userToInvite = await User.findOne(query);
    if (!userToInvite) {
      return res.status(404).json({
        success: false,
        message: 'No registered user matches that criteria',
      });
    }

    // Check if user is already in the project members array
    const alreadyMember = project.members.some(
      (m) => m.userId.toString() === userToInvite._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project',
      });
    }

    // Add user as project member
    project.members.push({
      userId: userToInvite._id,
      role: role || 'DEVELOPER',
    });

    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('owner', '_id username email avatar')
      .populate('members.userId', '_id username email avatar role');

    emitProjectEvent(project._id, 'member-added', populatedProject);

    return res.status(200).json({
      success: true,
      message: `${userToInvite.username} added to project successfully`,
      project: populatedProject,
    });
  } catch (error) {
    console.error('Invite project member error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to invite team member',
    });
  }
};

/**
 * Update member role within project
 * PUT /api/projects/:id/members/:userId
 */
export const updateMemberRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const project = req.project;

    // Prevent changing role of primary owner
    if (project.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify role of the primary project owner',
      });
    }

    const member = project.members.find(
      (m) => m.userId.toString() === userId
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this project',
      });
    }

    // Update role
    member.role = role;
    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('owner', '_id username email avatar')
      .populate('members.userId', '_id username email avatar role');

    return res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      project: populatedProject,
    });
  } catch (error) {
    console.error('Update member role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update member role',
    });
  }
};

/**
 * Remove member from project
 * DELETE /api/projects/:id/members/:userId
 */
export const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const project = req.project;

    // Prevent removing primary owner
    if (project.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the primary project owner',
      });
    }

    const memberIndex = project.members.findIndex(
      (m) => m.userId.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this project',
      });
    }

    // Remove member
    project.members.splice(memberIndex, 1);
    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('owner', '_id username email avatar')
      .populate('members.userId', '_id username email avatar role');

    return res.status(200).json({
      success: true,
      message: 'Member removed from project successfully',
      project: populatedProject,
    });
  } catch (error) {
    console.error('Remove member error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove member from project',
    });
  }
};

/**
 * Get project dashboard analytical counts
 * GET /api/projects/:id/dashboard
 */
export const getProjectDashboard = async (req, res) => {
  try {
    const project = req.project;

    // Resolve counts
    const membersCount = project.members.length; // Owner is included in members array in createProject
    const repositoriesCount = project.repositories.length;
    
    const sprintsCount = await Sprint.countDocuments({ projectId: project._id });
    const openTasksCount = await Task.countDocuments({ 
      projectId: project._id,
      status: { $ne: 'DONE' }
    });

    return res.status(200).json({
      success: true,
      dashboard: {
        membersCount,
        repositoriesCount,
        sprintsCount,
        openTasksCount,
      },
    });
  } catch (error) {
    console.error('Get project dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch project dashboard statistics',
    });
  }
};
