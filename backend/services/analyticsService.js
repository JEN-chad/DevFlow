import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Sprint from '../models/Sprint.js';
import Activity from '../models/Activity.js';
import Project from '../models/Project.js';
import { User } from '../models/User.js';

/**
 * Get unified dashboard analytics
 */
export const getDashboardAnalyticsData = async (projectIds) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 1. Overview counts & metrics
  const [
    activeProjectsCount,
    activeSprintsCount,
    openTasksCount,
    completedTasksCount,
    taskMetrics,
    throughput
  ] = await Promise.all([
    Project.countDocuments({ _id: { $in: projectIds }, status: 'ACTIVE' }),
    Sprint.countDocuments({ projectId: { $in: projectIds }, status: 'ACTIVE' }),
    Task.countDocuments({ projectId: { $in: projectIds }, status: { $ne: 'DONE' } }),
    Task.countDocuments({ projectId: { $in: projectIds }, status: 'DONE' }),
    Task.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: { $sum: { $cond: [{ $eq: ["$status", "DONE"] }, 1, 0] } },
          totalStoryPoints: { $sum: "$storyPoints" },
          completedStoryPoints: { $sum: { $cond: [{ $eq: ["$status", "DONE"] }, "$storyPoints", 0] } },
          leadTimeSum: {
            $sum: {
              $cond: [
                { $eq: ["$status", "DONE"] },
                { $subtract: ["$updatedAt", "$createdAt"] },
                0
              ]
            }
          }
        }
      }
    ]),
    Task.countDocuments({
      projectId: { $in: projectIds },
      status: 'DONE',
      updatedAt: { $gte: sevenDaysAgo }
    })
  ]);

  const metrics = taskMetrics[0] || {
    totalTasks: 0,
    completedTasks: 0,
    totalStoryPoints: 0,
    completedStoryPoints: 0,
    leadTimeSum: 0
  };

  const avgLeadTimeHours = metrics.completedTasks > 0
    ? Math.round((metrics.leadTimeSum / metrics.completedTasks / (1000 * 60 * 60)) * 10) / 10
    : 0;

  // Estimate Cycle Time as roughly 80% of Lead Time or fallback if no in-progress transitions logged
  const avgCycleTimeHours = Math.round(avgLeadTimeHours * 0.8 * 10) / 10;

  // Sprint Completion Rate
  const completedSprints = await Sprint.find({ projectId: { $in: projectIds }, status: 'COMPLETED' });
  const completedSprintIds = completedSprints.map(s => s._id);

  let sprintCompletionRate = 0;
  if (completedSprintIds.length > 0) {
    const sprintTasks = await Task.aggregate([
      { $match: { sprintId: { $in: completedSprintIds } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "DONE"] }, 1, 0] } }
        }
      }
    ]);
    if (sprintTasks.length > 0 && sprintTasks[0].total > 0) {
      sprintCompletionRate = Math.round((sprintTasks[0].completed / sprintTasks[0].total) * 100);
    }
  }

  const overview = {
    activeProjects: activeProjectsCount,
    activeSprints: activeSprintsCount,
    openTasks: openTasksCount,
    completedTasks: completedTasksCount,
    leadTimeHours: avgLeadTimeHours,
    cycleTimeHours: avgCycleTimeHours,
    sprintCompletionRate,
    weeklyThroughput: throughput,
    totalStoryPoints: metrics.totalStoryPoints,
    completedStoryPoints: metrics.completedStoryPoints
  };

  // 2. Task Status Distribution
  const statusCounts = await Task.aggregate([
    { $match: { projectId: { $in: projectIds } } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        storyPoints: { $sum: { $ifNull: ["$storyPoints", 0] } }
      }
    }
  ]);

  const allStatuses = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
  const taskDistribution = allStatuses.map(status => {
    const found = statusCounts.find(s => s._id === status);
    return {
      status,
      count: found ? found.count : 0,
      storyPoints: found ? found.storyPoints : 0
    };
  });

  // 3. Team Productivity & Leaderboard
  const [taskAssigneeStats, activityStats] = await Promise.all([
    Task.aggregate([
      { $match: { projectId: { $in: projectIds }, assignee: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$assignee",
          completedTasks: { $sum: { $cond: [{ $eq: ["$status", "DONE"] }, 1, 0] } },
          storyPointsDelivered: { $sum: { $cond: [{ $eq: ["$status", "DONE"] }, "$storyPoints", 0] } },
          totalTasks: { $sum: 1 }
        }
      }
    ]),
    Activity.aggregate([
      { $match: { project: { $in: projectIds }, user: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$user",
          commitsContributed: {
            $sum: {
              $cond: [
                { $regexMatch: { input: "$action", regex: /push/i } },
                { $ifNull: ["$metadata.commitsCount", 1] },
                0
              ]
            }
          },
          prsMerged: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $regexMatch: { input: "$action", regex: /PR/i } },
                    { $eq: ["$metadata.prAction", "closed"] },
                    { $eq: ["$metadata.merged", true] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ])
  ]);

  // Combine and populate users for productivity leaderboard
  const teamMap = new Map();
  taskAssigneeStats.forEach(stat => {
    teamMap.set(String(stat._id), {
      userId: stat._id,
      completedTasks: stat.completedTasks,
      storyPointsDelivered: stat.storyPointsDelivered,
      commitsContributed: 0,
      prsMerged: 0
    });
  });

  activityStats.forEach(stat => {
    const key = String(stat._id);
    if (teamMap.has(key)) {
      const existing = teamMap.get(key);
      existing.commitsContributed = stat.commitsContributed;
      existing.prsMerged = stat.prsMerged;
    } else {
      teamMap.set(key, {
        userId: stat._id,
        completedTasks: 0,
        storyPointsDelivered: 0,
        commitsContributed: stat.commitsContributed,
        prsMerged: stat.prsMerged
      });
    }
  });

  const rawTeamList = Array.from(teamMap.values());
  const populatedTeamList = await User.populate(rawTeamList, {
    path: 'userId',
    select: 'username avatar email'
  });

  const teamProductivity = populatedTeamList
    .filter(t => t.userId) // filter out deleted users if any
    .map(t => ({
      username: t.userId.username,
      avatar: t.userId.avatar,
      email: t.userId.email,
      completedTasks: t.completedTasks,
      storyPointsDelivered: t.storyPointsDelivered,
      commitsContributed: t.commitsContributed,
      prsMerged: t.prsMerged,
      score: (t.completedTasks * 10) + (t.storyPointsDelivered * 5) + (t.commitsContributed * 2) + (t.prsMerged * 15)
    }))
    .sort((a, b) => b.score - a.score);

  // 4. Commit Activity Trend (Past 7 Days)
  const commitActivityTrend = await Activity.aggregate([
    {
      $match: {
        project: { $in: projectIds },
        action: { $regex: /push/i },
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        commits: { $sum: { $ifNull: ["$metadata.commitsCount", 1] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Interpolate past 7 days to avoid empty values
  const commitActivity = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const found = commitActivityTrend.find(c => c._id === dateStr);
    commitActivity.push({
      date: dateStr,
      commits: found ? found.commits : 0
    });
  }

  // 5. Pull Request Trends (Past 7 Days)
  const prActivityTrend = await Activity.aggregate([
    {
      $match: {
        project: { $in: projectIds },
        action: { $regex: /PR/i },
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          action: "$metadata.prAction"
        },
        count: { $sum: 1 }
      }
    }
  ]);

  const pullRequestTrends = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const opened = prActivityTrend.find(p => p._id.date === dateStr && p._id.action === 'opened')?.count || 0;
    const closed = prActivityTrend.find(p => p._id.date === dateStr && (p._id.action === 'closed' || p._id.action === 'merged'))?.count || 0;

    pullRequestTrends.push({
      date: dateStr,
      opened,
      closed
    });
  }

  // 6. Sprint Velocity Trend (Past Sprints)
  const sprints = await Sprint.find({ projectId: { $in: projectIds } })
    .sort({ endDate: 1 })
    .limit(5);

  const sprintVelocity = [];
  for (const s of sprints) {
    const tasks = await Task.find({ sprintId: s._id });
    const plannedPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedPoints = tasks.reduce((sum, t) => sum + (t.status === 'DONE' ? (t.storyPoints || 0) : 0), 0);
    const velocityPct = plannedPoints > 0 ? Math.round((completedPoints / plannedPoints) * 100) : 0;
    sprintVelocity.push({
      sprintName: s.name,
      plannedPoints,
      completedPoints,
      velocityPct
    });
  }

  return {
    overview,
    taskDistribution,
    teamProductivity,
    commitActivity,
    pullRequestTrends,
    sprintVelocity
  };
};

/**
 * Get sprint specific burndown data
 */
export const getSprintBurndownData = async (sprintId) => {
  const sprint = await Sprint.findById(sprintId);
  if (!sprint) {
    throw new Error('Sprint not found');
  }

  const tasks = await Task.find({ sprintId });
  const totalStoryPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  // Generate day-by-day dates for the sprint
  const start = new Date(sprint.startDate);
  const end = new Date(sprint.endDate);
  const days = [];
  let curr = new Date(start);

  while (curr <= end) {
    days.push(new Date(curr));
    curr.setDate(curr.getDate() + 1);
  }

  // If the sprint is just one day or start > end, handle edge case
  if (days.length === 0) {
    days.push(start);
  }

  const totalDays = days.length - 1 || 1;
  const today = new Date();
  let daysRemaining = Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)));

  // Calculate actual burndown day by day
  let runningPoints = totalStoryPoints;
  const chartData = days.map((day, index) => {
    const dayStr = day.toISOString().split('T')[0];
    const idealRemaining = Math.max(0, Math.round((totalStoryPoints - (totalStoryPoints * (index / totalDays))) * 10) / 10);

    // Subtract points of tasks completed on or before this day
    const completedOnDayPoints = tasks
      .filter(t => t.status === 'DONE' && t.updatedAt && new Date(t.updatedAt).toISOString().split('T')[0] === dayStr)
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    runningPoints -= completedOnDayPoints;

    // Actual remaining line should only plot up to today's date if sprint is currently active
    const isPastOrToday = day <= today || sprint.status === 'COMPLETED';

    return {
      day: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ideal: idealRemaining,
      actual: isPastOrToday ? Math.max(0, runningPoints) : null
    };
  });

  const completedPoints = tasks.reduce((sum, t) => sum + (t.status === 'DONE' ? (t.storyPoints || 0) : 0), 0);
  const completionPercentage = totalStoryPoints > 0 ? Math.round((completedPoints / totalStoryPoints) * 100) : 0;

  // Determine Sprint Health
  let health = 'On Track';
  if (sprint.status === 'ACTIVE') {
    const todayIndex = days.findIndex(d => d.toISOString().split('T')[0] === today.toISOString().split('T')[0]);
    if (todayIndex !== -1) {
      const idealPointsToday = totalStoryPoints - (totalStoryPoints * (todayIndex / totalDays));
      const actualPointsToday = runningPoints; // at end of aggregation it will be current remaining points
      
      const slippage = actualPointsToday - idealPointsToday;
      if (slippage > totalStoryPoints * 0.25) {
        health = 'Delayed';
      } else if (slippage > totalStoryPoints * 0.1) {
        health = 'At Risk';
      }
    }
  } else if (sprint.status === 'COMPLETED') {
    health = completionPercentage >= 100 ? 'On Track' : 'Delayed';
  }

  return {
    sprintName: sprint.name,
    totalStoryPoints,
    completedStoryPoints: completedPoints,
    completionPercentage,
    daysRemaining,
    health,
    chartData
  };
};
