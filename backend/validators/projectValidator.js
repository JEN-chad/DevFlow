/**
 * Validation middleware for creating a project
 */
export const validateCreateProject = (req, res, next) => {
  const { name, description } = req.body;
  const errors = {};

  if (!name || name.trim() === '') {
    errors.name = 'Project name is required';
  } else if (name.trim().length < 3) {
    errors.name = 'Project name must be at least 3 characters';
  } else if (name.trim().length > 50) {
    errors.name = 'Project name must be less than 50 characters';
  }

  if (description && description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
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
 * Validation middleware for updating a project
 */
export const validateUpdateProject = (req, res, next) => {
  const { name, description } = req.body;
  const errors = {};

  if (name !== undefined) {
    if (!name || name.trim() === '') {
      errors.name = 'Project name cannot be empty';
    } else if (name.trim().length < 3) {
      errors.name = 'Project name must be at least 3 characters';
    } else if (name.trim().length > 50) {
      errors.name = 'Project name must be less than 50 characters';
    }
  }

  if (description && description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
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
 * Validation middleware for inviting/adding a member
 */
export const validateInviteMember = (req, res, next) => {
  const { username, email, role } = req.body;
  const errors = {};

  if (!username && !email) {
    errors.identifier = 'Either username or email is required to invite a member';
  }

  const validRoles = ['OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'VIEWER'];
  if (!role) {
    errors.role = 'Project role is required';
  } else if (!validRoles.includes(role)) {
    errors.role = `Role must be one of: ${validRoles.join(', ')}`;
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
 * Validation middleware for updating a member's role
 */
export const validateUpdateMemberRole = (req, res, next) => {
  const { role } = req.body;
  const errors = {};

  const validRoles = ['OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'VIEWER'];
  if (!role) {
    errors.role = 'Role is required';
  } else if (!validRoles.includes(role)) {
    errors.role = `Role must be one of: ${validRoles.join(', ')}`;
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
