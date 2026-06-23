import { describe, it, expect, vi } from 'vitest';
import { validateCreateSprint } from '../validators/sprintValidator.js';

describe('Sprint Validator - validateCreateSprint', () => {
  it('should pass validation when all fields are correct and projectId is in req.params', () => {
    const req = {
      params: { projectId: 'project123' },
      body: {
        name: 'Sprint 1',
        startDate: '2026-06-20',
        endDate: '2026-07-04',
        goal: 'Complete core MVP features'
      }
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    validateCreateSprint(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should pass validation when all fields are correct and projectId is in req.body', () => {
    const req = {
      params: {},
      body: {
        projectId: 'project123',
        name: 'Sprint 1',
        startDate: '2026-06-20',
        endDate: '2026-07-04',
        goal: 'Complete core MVP features'
      }
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    validateCreateSprint(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should fail validation when projectId is missing', () => {
    const req = {
      params: {},
      body: {
        name: 'Sprint 1',
        startDate: '2026-06-20',
        endDate: '2026-07-04'
      }
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    validateCreateSprint(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Validation failed',
        errors: expect.objectContaining({
          projectId: 'Project ID is required'
        })
      })
    );
  });

  it('should fail validation when endDate is before startDate', () => {
    const req = {
      params: { projectId: 'project123' },
      body: {
        name: 'Sprint 1',
        startDate: '2026-06-20',
        endDate: '2026-06-19'
      }
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    validateCreateSprint(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Validation failed',
        errors: expect.objectContaining({
          endDate: 'End date must be after the start date'
        })
      })
    );
  });
});
