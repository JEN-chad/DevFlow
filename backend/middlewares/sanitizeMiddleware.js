/**
 * Helper to recursively sanitize objects for MongoDB Query Injection
 */
const sanitizeMongo = (input) => {
  if (input instanceof Array) {
    return input.map(item => sanitizeMongo(item));
  }
  if (input !== null && typeof input === 'object') {
    const cleanObj = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        // Strip keys starting with $ or containing dots
        if (!key.startsWith('$') && !key.includes('.')) {
          cleanObj[key] = sanitizeMongo(input[key]);
        }
      }
    }
    return cleanObj;
  }
  return input;
};

/**
 * Helper to recursively sanitize strings for XSS protection
 */
const sanitizeXSS = (input) => {
  if (input instanceof Array) {
    return input.map(item => sanitizeXSS(item));
  }
  if (input !== null && typeof input === 'object') {
    const cleanObj = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        cleanObj[key] = sanitizeXSS(input[key]);
      }
    }
    return cleanObj;
  }
  if (typeof input === 'string') {
    // Strip simple HTML tags and script elements
    return input
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }
  return input;
};

export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeMongo(req.body);
    req.body = sanitizeXSS(req.body);
  }
  if (req.query) {
    req.query = sanitizeMongo(req.query);
    req.query = sanitizeXSS(req.query);
  }
  if (req.params) {
    req.params = sanitizeMongo(req.params);
    req.params = sanitizeXSS(req.params);
  }
  next();
};
