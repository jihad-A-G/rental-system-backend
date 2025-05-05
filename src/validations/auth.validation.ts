import { body } from 'express-validator';

export const authValidation = {
  login: [
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email'),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ],
  register: [
    body('name')
      .notEmpty().withMessage('Name is required')
      .isString().withMessage('Name must be a string'),
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email'),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role')
      .optional()
      .isIn(['admin', 'user']).withMessage('Invalid role')
  ]
}; 