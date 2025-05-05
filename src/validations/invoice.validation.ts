import { body } from 'express-validator';

export const invoiceValidation = {
  create: [
    body('contract')
      .notEmpty().withMessage('Contract ID is required')
      .isMongoId().withMessage('Invalid contract ID format'),
    body('amount')
      .notEmpty().withMessage('Invoice amount is required')
      .isNumeric().withMessage('Amount must be a number')
      .custom(value => value > 0).withMessage('Amount must be greater than 0'),
    body('dueDate')
      .notEmpty().withMessage('Due date is required')
      .isISO8601().withMessage('Due date must be a valid date'),
    body('description')
      .notEmpty().withMessage('Description is required')
      .isString().withMessage('Description must be a string'),
    body('maintenanceRelated')
      .optional()
      .isBoolean().withMessage('maintenanceRelated must be a boolean'),
    body('maintenanceId')
      .optional()
      .isMongoId().withMessage('Invalid maintenance ID format')
  ],
  update: [
    body('amount')
      .optional()
      .isNumeric().withMessage('Amount must be a number')
      .custom(value => value > 0).withMessage('Amount must be greater than 0'),
    body('dueDate')
      .optional()
      .isISO8601().withMessage('Due date must be a valid date'),
    body('status')
      .optional()
      .isIn(['Paid', 'Unpaid', 'Partially Paid']).withMessage('Invalid status value'),
    body('description')
      .optional()
      .isString().withMessage('Description must be a string'),
    body('paidAmount')
      .optional()
      .isNumeric().withMessage('Paid amount must be a number')
      .custom(value => value >= 0).withMessage('Paid amount must be greater than or equal to 0')
  ]
}; 