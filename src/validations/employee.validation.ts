import { body } from 'express-validator';

export const employeeValidation = {
  create: [
    body('name')
      .notEmpty().withMessage('Name is required')
      .isString().withMessage('Name must be a string'),
    body('role')
      .notEmpty().withMessage('Role is required')
      .isIn(['Security', 'Gate Keeper', 'Cleaner', 'Manager', 'Other']).withMessage('Invalid role'),
    body('phone')
      .notEmpty().withMessage('Phone is required')
      .isString().withMessage('Phone must be a string'),
    body('email')
      .optional()
      .isEmail().withMessage('Email must be valid'),
    body('address')
      .optional()
      .isString().withMessage('Address must be a string'),
    body('salary')
      .notEmpty().withMessage('Salary is required')
      .isNumeric().withMessage('Salary must be a number')
      .custom(value => value > 0).withMessage('Salary must be greater than 0'),
    body('joiningDate')
      .optional()
      .isISO8601().withMessage('Joining date must be a valid date'),
    body('isActive')
      .optional()
      .isBoolean().withMessage('isActive must be a boolean'),
    body('emergencyContact')
      .optional()
      .isString().withMessage('Emergency contact must be a string')
  ],
  update: [
    body('name')
      .optional()
      .isString().withMessage('Name must be a string'),
    body('role')
      .optional()
      .isIn(['Security', 'Gate Keeper', 'Cleaner', 'Manager', 'Other']).withMessage('Invalid role'),
    body('phone')
      .optional()
      .isString().withMessage('Phone must be a string'),
    body('email')
      .optional()
      .isEmail().withMessage('Email must be valid'),
    body('address')
      .optional()
      .isString().withMessage('Address must be a string'),
    body('salary')
      .optional()
      .isNumeric().withMessage('Salary must be a number')
      .custom(value => value > 0).withMessage('Salary must be greater than 0'),
    body('joiningDate')
      .optional()
      .isISO8601().withMessage('Joining date must be a valid date'),
    body('isActive')
      .optional()
      .isBoolean().withMessage('isActive must be a boolean'),
    body('emergencyContact')
      .optional()
      .isString().withMessage('Emergency contact must be a string')
  ]
};

export const salaryValidation = {
  create: [
    body('amount')
      .optional()
      .isNumeric().withMessage('Amount must be a number')
      .custom(value => value > 0).withMessage('Amount must be greater than 0'),
    body('month')
      .notEmpty().withMessage('Month is required')
      .isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
    body('year')
      .notEmpty().withMessage('Year is required')
      .isInt({ min: 2000, max: 2100 }).withMessage('Year must be a valid year'),
    body('isPaid')
      .optional()
      .isBoolean().withMessage('isPaid must be a boolean'),
    body('paymentDate')
      .optional()
      .isISO8601().withMessage('Payment date must be a valid date'),
    body('paymentMethod')
      .optional()
      .isIn(['Cash', 'Bank Transfer', 'Check', 'Other']).withMessage('Invalid payment method'),
    body('description')
      .optional()
      .isString().withMessage('Description must be a string')
  ],
  update: [
    body('amount')
      .optional()
      .isNumeric().withMessage('Amount must be a number')
      .custom(value => value > 0).withMessage('Amount must be greater than 0'),
    body('isPaid')
      .optional()
      .isBoolean().withMessage('isPaid must be a boolean'),
    body('paymentDate')
      .optional()
      .isISO8601().withMessage('Payment date must be a valid date'),
    body('paymentMethod')
      .optional()
      .isIn(['Cash', 'Bank Transfer', 'Check', 'Other']).withMessage('Invalid payment method'),
    body('description')
      .optional()
      .isString().withMessage('Description must be a string')
  ]
}; 