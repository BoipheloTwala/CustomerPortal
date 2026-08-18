//CODE ATTRIBUTION
//01
//OWASP Input Validation Best Practices
//Adapted from: OWASP. (2025). Input Validation Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//MongoDB Query Operators and Security
//Adapted from: MongoDB, Inc. (2025). Query and Projection Operators. [online] MongoDB Documentation.
//Available at: https://www.mongodb.com/docs/manual/reference/operator/query/
//Date Accessed: 10 October 2025

import { sanitizeMongoQuery, validateObjectId } from './nosql-injection.js';

/**
 * MongoDB Query Validation Middleware
 * Provides additional protection for MongoDB queries and operations
 */

/**
 * Validate and sanitize MongoDB find queries
 */
export const validateFindQuery = (req, res, next) => {
  try {
    // If query parameters exist, sanitize them
    if (req.query && Object.keys(req.query).length > 0) {
      req.query = sanitizeMongoQuery(req.query);
    }
    
    next();
  } catch (error) {
    console.error('Query validation error:', error);
    res.status(400).json({ 
      error: 'Invalid query parameters',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Validate MongoDB ObjectId in URL parameters
 */
export const validateObjectIdParam = (paramName = 'id') => {
  return (req, res, next) => {
    try {
      const id = req.params[paramName];
      
      if (id) {
        const validatedId = validateObjectId(id);
        if (!validatedId) {
          return res.status(400).json({ 
            error: `Invalid ${paramName} format`,
            timestamp: new Date().toISOString()
          });
        }
        
        // Update the parameter with the validated ID
        req.params[paramName] = validatedId;
      }
      
      next();
    } catch (error) {
      console.error('ObjectId validation error:', error);
      res.status(400).json({ 
        error: `Invalid ${paramName} format`,
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Validate MongoDB update operations
 */
export const validateUpdateQuery = (req, res, next) => {
  try {
    if (req.body && typeof req.body === 'object') {
      // Sanitize the update data
      req.body = sanitizeMongoQuery(req.body);
      
      // Check for dangerous update operators
      const dangerousOperators = ['$where', '$regex', '$text', '$search'];
      const bodyKeys = Object.keys(req.body);
      
      for (const key of bodyKeys) {
        if (dangerousOperators.includes(key)) {
          console.warn(`[SECURITY] Dangerous update operator filtered: ${key}`);
          delete req.body[key];
        }
        
        // If the value is an object, check its keys too
        if (typeof req.body[key] === 'object' && req.body[key] !== null) {
          const valueKeys = Object.keys(req.body[key]);
          for (const valueKey of valueKeys) {
            if (dangerousOperators.includes(valueKey)) {
              console.warn(`[SECURITY] Dangerous nested operator filtered: ${key}.${valueKey}`);
              delete req.body[key][valueKey];
            }
          }
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Update query validation error:', error);
    res.status(400).json({ 
      error: 'Invalid update data',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Validate MongoDB sort parameters
 */
export const validateSortQuery = (req, res, next) => {
  try {
    if (req.query.sort) {
      const sortParam = req.query.sort;
      
      // Validate sort parameter format
      if (typeof sortParam === 'string') {
        // Allow only alphanumeric characters, underscores, and basic sort indicators
        if (!/^[a-zA-Z0-9_]+$/.test(sortParam.replace(/^-/, ''))) {
          return res.status(400).json({ 
            error: 'Invalid sort parameter',
            timestamp: new Date().toISOString()
          });
        }
      } else if (typeof sortParam === 'object') {
        // For complex sort objects, validate each key
        const sortKeys = Object.keys(sortParam);
        for (const key of sortKeys) {
          if (!/^[a-zA-Z0-9_]+$/.test(key)) {
            return res.status(400).json({ 
              error: 'Invalid sort field name',
              timestamp: new Date().toISOString()
            });
          }
          
          // Validate sort values (should be 1, -1, or string)
          const value = sortParam[key];
          if (typeof value === 'number' && value !== 1 && value !== -1) {
            return res.status(400).json({ 
              error: 'Invalid sort direction',
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Sort query validation error:', error);
    res.status(400).json({ 
      error: 'Invalid sort parameters',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Validate pagination parameters
 */
export const validatePaginationQuery = (req, res, next) => {
  try {
    if (req.query.limit) {
      const limit = parseInt(req.query.limit);
      if (isNaN(limit) || limit < 1 || limit > 1000) {
        return res.status(400).json({ 
          error: 'Invalid limit parameter (must be between 1 and 1000)',
          timestamp: new Date().toISOString()
        });
      }
      req.query.limit = limit;
    }
    
    if (req.query.skip) {
      const skip = parseInt(req.query.skip);
      if (isNaN(skip) || skip < 0) {
        return res.status(400).json({ 
          error: 'Invalid skip parameter (must be >= 0)',
          timestamp: new Date().toISOString()
        });
      }
      req.query.skip = skip;
    }
    
    if (req.query.page) {
      const page = parseInt(req.query.page);
      if (isNaN(page) || page < 1) {
        return res.status(400).json({ 
          error: 'Invalid page parameter (must be >= 1)',
          timestamp: new Date().toISOString()
        });
      }
      req.query.page = page;
    }
    
    next();
  } catch (error) {
    console.error('Pagination validation error:', error);
    res.status(400).json({ 
      error: 'Invalid pagination parameters',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Validate field selection parameters
 */
export const validateFieldSelection = (req, res, next) => {
  try {
    if (req.query.fields) {
      const fields = req.query.fields;
      
      if (typeof fields === 'string') {
        // Split by comma and validate each field
        const fieldArray = fields.split(',').map(field => field.trim());
        
        for (const field of fieldArray) {
          // Allow only alphanumeric characters and underscores
          if (!/^[a-zA-Z0-9_]+$/.test(field)) {
            return res.status(400).json({ 
              error: `Invalid field name: ${field}`,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        req.query.fields = fieldArray;
      }
    }
    
    if (req.query.select) {
      const select = req.query.select;
      
      if (typeof select === 'string') {
        // Split by space and validate each field
        const selectArray = select.split(' ').map(field => field.trim()).filter(field => field);
        
        for (const field of selectArray) {
          // Allow field names with + or - prefix
          const cleanField = field.replace(/^[+-]/, '');
          if (!/^[a-zA-Z0-9_]+$/.test(cleanField)) {
            return res.status(400).json({ 
              error: `Invalid select field: ${field}`,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        req.query.select = selectArray;
      }
    }
    
    next();
  } catch (error) {
    console.error('Field selection validation error:', error);
    res.status(400).json({ 
      error: 'Invalid field selection parameters',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Comprehensive query validation middleware
 * Combines all query validation checks
 */
export const validateMongoQuery = [
  validateFindQuery,
  validateSortQuery,
  validatePaginationQuery,
  validateFieldSelection,
  validateUpdateQuery
];

export default {
  validateFindQuery,
  validateObjectIdParam,
  validateUpdateQuery,
  validateSortQuery,
  validatePaginationQuery,
  validateFieldSelection,
  validateMongoQuery
};
