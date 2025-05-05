import { body } from 'express-validator';

export const expenseValidation = {
  create: [
    body('category')
      .notEmpty().withMessage('Category is required')
      .isIn(['Utilities', 'Internet', 'Marketing', 'Taxes', 'Maintenance', 'Other']).withMessage('Invalid category'),
    body('amount')
      .notEmpty().withMessage('Amount is required')
      .isNumeric().withMessage('Amount must be a number')
      .custom(value => value > 0).withMessage('Amount must be greater than 0'),
    body('description')
      .notEmpty().withMessage('Description is required')
      .isString().withMessage('Description must be a string'),
    body('apartment')
      .optional()
      .isMongoId().withMessage('Invalid apartment ID format'),
    body('date')
      .optional()
      .isISO8601().withMessage('Date must be a valid date'),
    body('recurring')
      .optional()
      .isBoolean().withMessage('Recurring must be a boolean'),
    body('frequencyMonths')
      .optional()
      .isNumeric().withMessage('Frequency must be a number')
      .custom(value => value > 0).withMessage('Frequency must be greater than 0')
  ],
  update: [
    body('category')
      .optional()
      .isIn(['Utilities', 'Internet', 'Marketing', 'Taxes', 'Maintenance', 'Other']).withMessage('Invalid category'),
    body('amount')
      .optional()
      .isNumeric().withMessage('Amount must be a number')
      .custom(value => value > 0).withMessage('Amount must be greater than 0'),
    body('description')
      .optional()
      .isString().withMessage('Description must be a string'),
    body('apartment')
      .optional()
      .isMongoId().withMessage('Invalid apartment ID format'),
    body('date')
      .optional()
      .isISO8601().withMessage('Date must be a valid date'),
    body('recurring')
      .optional()
      .isBoolean().withMessage('Recurring must be a boolean'),
    body('frequencyMonths')
      .optional()
      .isNumeric().withMessage('Frequency must be a number')
      .custom(value => value > 0).withMessage('Frequency must be greater than 0')
  ]
}; 