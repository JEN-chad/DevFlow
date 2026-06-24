import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTask } from '../controllers/taskController.js';
import { Project } from '../models/Project.js';
import { Sprint } from '../models/Sprint.js';
import { Task } from '../models/Task.js';

// Mock mongoose models
vi.mock('../models/Project.js', () => ({
  Project: {
    findById: vi.fn(),
  },
}));

vi.mock('../models/Sprint.js', () => ({
  Sprint: {
    findById: vi.fn(),
  },
}));

vi.mock('../models/Task.js', () => {
  const mockTaskInstance = {
    save: vi.fn().mockResolvedValue({}),
    _id: 'mockTaskId123',
    title: 'Test Task',
  };
  const TaskMock = vi.fn().mockImplementation(() => mockTaskInstance);
  TaskMock.findById = vi.fn().mockReturnValue({
    populate: vi.fn().mockResolvedValue({
      _id: 'mockTaskId123',
      title: 'Test Task',
      assignee: null,
    }),
  });
  return { Task: TaskMock };
});

vi.mock('../models/Activity.js', () => ({
  Activity: vi.fn().mockImplementation(() => ({
    save: vi.fn().mockResolvedValue({}),
  })),
}));

vi.mock('../config/socket.js', () => ({
  emitProjectEvent: vi.fn(),
}));

vi.mock('../services/notificationService.js', () => ({
  createNotification: vi.fn().mockResolvedValue({}),
}));

describe('taskController - createTask', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      params: { projectId: '667850000000000000000001' },
      body: {
        title: 'Task Title',
        description: 'Task description text',
        status: 'TODO',
        priority: 'MEDIUM',
        estimatedHours: 4,
        storyPoints: 3,
      },
      user: {
        _id: '667850000000000000000002',
        username: 'john_doe',
        role: 'DEVELOPER',
      },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should return 400 when task title is missing', async () => {
    req.body.title = '';

    await createTask(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Task title is required',
      })
    );
  });

  it('should return 400 when task title is less than 3 characters', async () => {
    req.body.title = 'ab';

    await createTask(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Task title must be at least 3 characters',
      })
    );
  });

  it('should return 400 when estimatedHours is negative', async () => {
    req.body.estimatedHours = -5;

    await createTask(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Estimated hours must be a non-negative number',
      })
    );
  });

  it('should return 404 when project is not found', async () => {
    Project.findById.mockResolvedValue(null);

    await createTask(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Project not found',
      })
    );
  });

  it('should return 401 when user is not a project member or owner', async () => {
    const mockProject = {
      _id: '667850000000000000000001',
      owner: '667850000000000000000003', // different owner
      members: [], // no members
    };
    Project.findById.mockResolvedValue(mockProject);

    await createTask(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Unauthorized'),
      })
    );
  });

  it('should return 404 when sprint is provided but not found', async () => {
    const mockProject = {
      _id: '667850000000000000000001',
      owner: req.user._id,
      members: [],
    };
    Project.findById.mockResolvedValue(mockProject);
    req.body.sprintId = '667850000000000000000004';
    Sprint.findById.mockResolvedValue(null); // sprint not found

    await createTask(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Sprint not found',
      })
    );
  });
});
