/**
 * Validation middleware for creating a sprint
 */
export const validateCreateSprint = (req, res, next) => {
  const { projectId, name, startDate, endDate, goal } = req.body;
  const errors = {};

  if (!projectId || projectId.trim() === '') {
    errors.projectId = 'Project ID is required';
  }

  if (!name || name.trim() === '') {
    errors.name = 'Sprint name is required';
  } else if (name.trim().length < 3) {
    errors.name = 'Sprint name must be at least 3 characters';
  } else if (name.trim().length > 50) {
    errors.name = 'Sprint name must be less than 50 characters';
  }

  if (!startDate) {
    errors.startDate = 'Start date is required';
  } else if (isNaN(Date.parse(startDate))) {
    errors.startDate = 'Start date is invalid';
  }

  if (!endDate) {
    errors.endDate = 'End date is required';
  } else if (isNaN(Date.parse(endDate))) {
    errors.endDate = 'End date is invalid';
  }

  if (startDate && endDate && !isNaN(Date.parse(startDate)) && !isNaN(Date.parse(endDate))) {
    if (new Date(startDate) >= new Date(endDate)) {
      errors.endDate = 'End date must be after the start date';
    }
  }

  if (goal && goal.length > 500) {
    errors.goal = 'Goal description must be less than 500 characters';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

/**
 * Validation middleware for updating a sprint
 */
export const validateUpdateSprint = (req, res, next) => {
  const { name, startDate, endDate, goal, status } = req.body;
  const errors = {};

  if (name !== undefined) {
    if (!name || name.trim() === '') {
      errors.name = 'Sprint name cannot be empty';
    } else if (name.trim().length < 3) {
      errors.name = 'Sprint name must be at least 3 characters';
    } else if (name.trim().length > 50) {
      errors.name = 'Sprint name must be less than 50 characters';
    }
  }

  if (startDate !== undefined) {
    if (!startDate) {
      errors.startDate = 'Start date cannot be empty';
    } else if (isNaN(Date.parse(startDate))) {
      errors.startDate = 'Start date is invalid';
    }
  }

  if (endDate !== undefined) {
    if (!endDate) {
      errors.endDate = 'End date cannot be empty';
    } else if (isNaN(Date.parse(endDate))) {
      errors.endDate = 'End date is invalid';
    }
  }

  if (startDate && endDate && !isNaN(Date.parse(startDate)) && !isNaN(Date.parse(endDate))) {
    if (new Date(startDate) >= new Date(endDate)) {
      errors.endDate = 'End date must be after the start date';
    }
  }

  if (goal !== undefined && goal.length > 500) {
    errors.goal = 'Goal description must be less than 500 characters';
  }

  if (status !== undefined) {
    const validStatuses = ['PLANNED', 'ACTIVE', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      errors.status = `Status must be one of: ${validStatuses.join(', ')}`;
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};
