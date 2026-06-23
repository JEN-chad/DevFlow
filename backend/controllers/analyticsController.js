import * as analyticsService from '../services/analyticsService.js';
import Project from '../models/Project.js';
import mongoose from 'mongoose';

// Simple in-memory cache for analytics (expires in 5 minutes)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

const getCacheKey = (userId, projectId) => {
  return `${userId}_${projectId || 'all'}`;
};

/**
 * Fetch overview analytics
 * GET /api/analytics
 */
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const userId = req.user._id;

    // 1. Resolve projects that user belongs to
    const userProjects = await Project.find({
      $or: [
        { owner: userId },
        { 'members.userId': userId }
      ]
    });

    if (userProjects.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No active projects found for this user.',
        analytics: {
          overview: {
            activeProjects: 0,
            activeSprints: 0,
            openTasks: 0,
            completedTasks: 0,
            leadTimeHours: 0,
            cycleTimeHours: 0,
            sprintCompletionRate: 0,
            weeklyThroughput: 0,
            totalStoryPoints: 0,
            completedStoryPoints: 0
          },
          taskDistribution: [],
          teamProductivity: [],
          commitActivity: [],
          pullRequestTrends: [],
          sprintVelocity: []
        }
      });
    }

    // 2. Validate if requested projectId is accessible to user
    let targetProjectIds = userProjects.map(p => p._id);
    if (projectId) {
      if (!mongoose.isValidObjectId(projectId)) {
        return res.status(400).json({ success: false, message: 'Invalid project ID format' });
      }

      const hasAccess = userProjects.some(p => String(p._id) === String(projectId));
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: 'Access denied: You are not a member of this project' });
      }
      targetProjectIds = [new mongoose.Types.ObjectId(projectId)];
    }

    // 3. Cache lookup
    const cacheKey = getCacheKey(userId, projectId);
    const cachedData = cache.get(cacheKey);

    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
      return res.status(200).json({
        success: true,
        fromCache: true,
        analytics: cachedData.data
      });
    }

    // 4. Fetch metrics using aggregations
    const analytics = await analyticsService.getDashboardAnalyticsData(targetProjectIds);

    // 5. Store in cache
    cache.set(cacheKey, {
      timestamp: Date.now(),
      data: analytics
    });

    return res.status(200).json({
      success: true,
      fromCache: false,
      analytics
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to aggregate dashboard analytics data'
    });
  }
};

/**
 * Fetch sprint burndown data
 * GET /api/analytics/sprints/:sprintId/burndown
 */
export const getSprintBurndown = async (req, res, next) => {
  try {
    const { sprintId } = req.params;
    if (!mongoose.isValidObjectId(sprintId)) {
      return res.status(400).json({ success: false, message: 'Invalid sprint ID format' });
    }

    // Sprint burndown is fetched and calculated
    const burndown = await analyticsService.getSprintBurndownData(sprintId);

    return res.status(200).json({
      success: true,
      burndown
    });
  } catch (error) {
    console.error('Get sprint burndown error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch sprint burndown data'
    });
  }
};
