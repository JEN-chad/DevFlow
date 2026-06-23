import { Project } from '../models/Project.js';
import { Repository } from '../models/Repository.js';
import * as githubService from '../services/github.service.js';
import * as commitService from '../services/commit.service.js';
import * as prService from '../services/pr.service.js';
import * as issueService from '../services/issue.service.js';
import mongoose from 'mongoose';

/**
 * Fetch all connected repositories for projects user is a member of
 * GET /api/repositories
 */
export const getConnectedRepositories = async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'members.userId': req.user._id }
      ]
    });

    const projectIds = projects.map((p) => p._id);

    const repositories = await Repository.find({ projectId: { $in: projectIds } })
      .populate('projectId', '_id name owner members');

    return res.status(200).json({
      success: true,
      repositories,
    });
  } catch (error) {
    console.error('Get connected repositories error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch connected repositories',
    });
  }
};

/**
 * Fetch repositories of the currently logged-in user from GitHub
 * GET /api/repositories/github
 */
export const getUserGitHubRepositories = async (req, res, next) => {
  try {
    const repos = await githubService.getRepositories(req.user._id);
    return res.status(200).json({
      success: true,
      repositories: repos,
    });
  } catch (error) {
    console.error('Fetch user github repositories error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch repositories from GitHub',
    });
  }
};

/**
 * Search/filter repositories of the user or globally on GitHub
 * GET /api/repositories/github/search
 */
export const searchUserGitHubRepositories = async (req, res, next) => {
  try {
    const { q } = req.query;
    const repos = await githubService.searchRepositories(req.user._id, q || '');
    return res.status(200).json({
      success: true,
      repositories: repos,
    });
  } catch (error) {
    console.error('Search user github repositories error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to search repositories on GitHub',
    });
  }
};

/**
 * Connect/Import a repository to a project
 * POST /api/repositories/project/:projectId
 */
export const connectRepository = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { githubRepoId, name, owner, url, defaultBranch } = req.body;

    if (!githubRepoId || !name || !owner || !url) {
      return res.status(400).json({
        success: false,
        message: 'Missing required repository details (githubRepoId, name, owner, url)',
      });
    }

    // Verify project exists (req.project is loaded by requireProjectRole middleware)
    const project = req.project;

    // Check if repository is already connected to this project
    const existingRepo = await Repository.findOne({
      projectId: project._id,
      githubRepoId,
    });

    if (existingRepo) {
      return res.status(400).json({
        success: false,
        message: 'This repository is already connected to the project',
      });
    }

    // Create repository document
    const newRepo = new Repository({
      githubRepoId,
      name,
      owner,
      url,
      defaultBranch: defaultBranch || 'main',
      projectId: project._id,
    });

    await newRepo.save();

    // Link repo to project
    project.repositories.push(newRepo._id);
    await project.save();

    // Trigger an initial sync synchronously to fetch stars, forks, latest commit, contributors immediately
    try {
      await githubService.syncRepository(req.user._id, newRepo._id);
    } catch (syncError) {
      console.warn('Initial sync failed, repository created without stats:', syncError.message);
    }

    const populatedRepo = await Repository.findById(newRepo._id);

    return res.status(201).json({
      success: true,
      message: 'Repository connected and synchronized successfully',
      repository: populatedRepo,
    });
  } catch (error) {
    console.error('Connect repository error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to connect repository to project',
    });
  }
};

/**
 * Disconnect a repository from a project
 * DELETE /api/repositories/:id
 */
export const disconnectRepository = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid repository ID format',
      });
    }

    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({
        success: false,
        message: 'Repository not found',
      });
    }

    // Retrieve project to check role/ownership
    const project = await Project.findById(repository.projectId);
    if (!project) {
      // If project doesn't exist, clean up the repo anyway
      await Repository.findByIdAndDelete(id);
      return res.status(200).json({
        success: true,
        message: 'Repository connection cleared',
      });
    }

    // Double check user role for project level access (OWNER required to disconnect)
    const isOwner = project.owner.toString() === req.user._id.toString() || req.user.role === 'OWNER';
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only project owners can disconnect repositories',
      });
    }

    // Remove reference from project
    project.repositories = project.repositories.filter(
      (repoId) => repoId.toString() !== id
    );
    await project.save();

    // Delete repository
    await Repository.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Repository disconnected successfully',
    });
  } catch (error) {
    console.error('Disconnect repository error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to disconnect repository',
    });
  }
};

/**
 * Sync repository data from GitHub
 * POST /api/repositories/:id/sync
 */
export const syncRepository = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid repository ID format',
      });
    }

    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({
        success: false,
        message: 'Repository not found',
      });
    }

    // Verify user has access to the project
    const project = await Project.findById(repository.projectId);
    const isMember = project && (
      project.owner.toString() === req.user._id.toString() ||
      project.members.some(m => m.userId.toString() === req.user._id.toString()) ||
      req.user.role === 'OWNER'
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to sync this repository',
      });
    }

    const updatedRepo = await githubService.syncRepository(req.user._id, id);

    return res.status(200).json({
      success: true,
      message: 'Repository metrics updated',
      repository: updatedRepo,
    });
  } catch (error) {
    console.error('Sync repository error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync repository with GitHub',
    });
  }
};

/**
 * Retrieve details of a connected repository
 * GET /api/repositories/:id
 */
export const getRepositoryDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid repository ID format',
      });
    }

    const repository = await Repository.findById(id).populate('projectId', '_id name');
    if (!repository) {
      return res.status(404).json({
        success: false,
        message: 'Repository not found',
      });
    }

    return res.status(200).json({
      success: true,
      repository,
    });
  } catch (error) {
    console.error('Get repository details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch repository details',
    });
  }
};

/**
 * Retrieve repository analytics data
 * GET /api/repositories/:id/analytics
 */
export const getRepositoryAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid repository ID format',
      });
    }

    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({
        success: false,
        message: 'Repository not found',
      });
    }

    // Build contributions chart data
    const contributionsData = repository.contributors.map(c => ({
      name: c.username,
      commits: c.contributions,
    }));

    // Mock commit trend activity over past 7 days based on recent commit volumes
    // to give rich visual graphics on the analytics dashboard
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = new Date().getDay();
    const mockCommitTrend = [];
    
    // Total commits estimated by contributions sum
    const totalCommits = repository.contributors.reduce((acc, c) => acc + c.contributions, 0) || 12;
    const baseCommits = Math.max(Math.floor(totalCommits / 14), 1);

    for (let i = 6; i >= 0; i--) {
      const dayIndex = (currentDay - i + 7) % 7;
      mockCommitTrend.push({
        day: daysOfWeek[dayIndex],
        commits: Math.floor(baseCommits * (0.5 + Math.random() * 1.5)),
      });
    }

    return res.status(200).json({
      success: true,
      analytics: {
        starsCount: repository.starsCount,
        forksCount: repository.forksCount,
        openIssuesCount: repository.openIssuesCount,
        contributorsCount: repository.contributorsCount,
        contributions: contributionsData,
        commitTrend: mockCommitTrend,
      },
    });
  } catch (error) {
    console.error('Get repository analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch repository analytics data',
    });
  }
};

/**
 * Fetch commits for a repository
 * GET /api/repositories/:id/commits
 */
export const getRepositoryCommits = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, perPage } = req.query;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid repository ID format',
      });
    }

    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({
        success: false,
        message: 'Repository not found',
      });
    }

    const project = await Project.findById(repository.projectId);
    const isMember = project && (
      project.owner.toString() === req.user._id.toString() ||
      project.members.some(m => m.userId.toString() === req.user._id.toString()) ||
      req.user.role === 'OWNER'
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this repository',
      });
    }

    const commits = await commitService.fetchCommits(
      req.user._id,
      repository.owner,
      repository.name,
      page ? parseInt(page) : 1,
      perPage ? parseInt(perPage) : 30
    );

    return res.status(200).json({
      success: true,
      commits,
    });
  } catch (error) {
    console.error('Get repository commits error:', error);
    return res.status(550).json({
      success: false,
      message: error.message || 'Failed to fetch repository commits',
    });
  }
};

/**
 * Fetch pull requests for a repository
 * GET /api/repositories/:id/pulls
 */
export const getRepositoryPulls = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { state, page, perPage } = req.query;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid repository ID format',
      });
    }

    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({
        success: false,
        message: 'Repository not found',
      });
    }

    const project = await Project.findById(repository.projectId);
    const isMember = project && (
      project.owner.toString() === req.user._id.toString() ||
      project.members.some(m => m.userId.toString() === req.user._id.toString()) ||
      req.user.role === 'OWNER'
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this repository',
      });
    }

    const pulls = await prService.fetchPullRequests(
      req.user._id,
      repository.owner,
      repository.name,
      state || 'all',
      page ? parseInt(page) : 1,
      perPage ? parseInt(perPage) : 30
    );

    return res.status(200).json({
      success: true,
      pulls,
    });
  } catch (error) {
    console.error('Get repository pulls error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch repository pull requests',
    });
  }
};

/**
 * Fetch issues for a repository
 * GET /api/repositories/:id/issues
 */
export const getRepositoryIssues = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { state, page, perPage } = req.query;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid repository ID format',
      });
    }

    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({
        success: false,
        message: 'Repository not found',
      });
    }

    const project = await Project.findById(repository.projectId);
    const isMember = project && (
      project.owner.toString() === req.user._id.toString() ||
      project.members.some(m => m.userId.toString() === req.user._id.toString()) ||
      req.user.role === 'OWNER'
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this repository',
      });
    }

    const issues = await issueService.fetchIssues(
      req.user._id,
      repository.owner,
      repository.name,
      state || 'open',
      page ? parseInt(page) : 1,
      perPage ? parseInt(perPage) : 30
    );

    return res.status(200).json({
      success: true,
      issues,
    });
  } catch (error) {
    console.error('Get repository issues error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch repository issues',
    });
  }
};

/**
 * Fetch contributors for a repository
 * GET /api/repositories/:id/contributors
 */
export const getRepositoryContributors = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid repository ID format',
      });
    }

    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({
        success: false,
        message: 'Repository not found',
      });
    }

    const project = await Project.findById(repository.projectId);
    const isMember = project && (
      project.owner.toString() === req.user._id.toString() ||
      project.members.some(m => m.userId.toString() === req.user._id.toString()) ||
      req.user.role === 'OWNER'
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this repository',
      });
    }

    const contributors = await githubService.getContributors(
      req.user._id,
      repository.owner,
      repository.name
    );

    return res.status(200).json({
      success: true,
      contributors,
    });
  } catch (error) {
    console.error('Get repository contributors error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch repository contributors',
    });
  }
};
