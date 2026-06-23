import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNotification } from '../services/notificationService.js';
import { Notification } from '../models/Notification.js';
import * as socketConfig from '../config/socket.js';

// Mock Notification Model
vi.mock('../models/Notification.js', () => {
  return {
    Notification: {
      create: vi.fn(),
      findById: vi.fn(),
    },
  };
});

// Mock Socket.io helpers
vi.mock('../config/socket.js', () => {
  return {
    getIO: vi.fn(() => ({
      to: vi.fn(() => ({
        emit: vi.fn(),
      })),
    })),
  };
});

describe('Notification Service - createNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully save and populate notification if sender is not recipient', async () => {
    const mockNotification = {
      _id: 'notif123',
      recipient: 'userA',
      sender: 'userB',
      project: 'proj123',
      type: 'TASK_ASSIGNED',
      title: 'Task Assigned',
      message: 'You have been assigned a task.',
      link: '/dashboard',
    };

    Notification.create.mockResolvedValue(mockNotification);

    // Mock populate chain
    const populateMock = vi.fn().mockReturnValue({
      populate: vi.fn().mockResolvedValue(mockNotification),
    });
    Notification.findById.mockReturnValue({
      populate: populateMock,
    });

    const result = await createNotification({
      recipient: 'userA',
      sender: 'userB',
      project: 'proj123',
      type: 'TASK_ASSIGNED',
      title: 'Task Assigned',
      message: 'You have been assigned a task.',
      link: '/dashboard',
    });

    expect(Notification.create).toHaveBeenCalledWith({
      recipient: 'userA',
      sender: 'userB',
      project: 'proj123',
      type: 'TASK_ASSIGNED',
      title: 'Task Assigned',
      message: 'You have been assigned a task.',
      link: '/dashboard',
    });
    expect(result).toBeDefined();
    expect(result._id).toBe('notif123');
  });

  it('should not create notification if sender is recipient', async () => {
    const result = await createNotification({
      recipient: 'userA',
      sender: 'userA',
      project: 'proj123',
      type: 'TASK_ASSIGNED',
      title: 'Task Assigned',
      message: 'Assigning to myself.',
      link: '/dashboard',
    });

    expect(Notification.create).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
