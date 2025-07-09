const { body, query, validationResult } = require('express-validator');

// Validate create/update admin
exports.validateAdminProfile = [
  body('fullName')
    .notEmpty().withMessage('Full name is required')
    .isString().withMessage('Full name must be a string'),

  body('position')
    .notEmpty().withMessage('Position is required')
    .isString().withMessage('Position must be a string'),

  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .isMobilePhone().withMessage('Invalid phone number'),

  body('department')
    .notEmpty().withMessage('Department is required')
    .isString().withMessage('Department must be a string'),

  body('staffId')
    .optional()
    .isString().withMessage('Staff ID must be a string'),

  body('gender')
    .optional()
    .isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),

  body('status')
    .optional()
    .isIn(['Active', 'Suspended']).withMessage('Status must be Active or Suspended'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

// Admin Search validation
exports.validateAdminSearch = [
  query('staffId')
    .optional()
    .isString()
    .trim()
    .withMessage('Staff ID must be a string'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];