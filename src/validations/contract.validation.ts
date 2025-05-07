import { body } from 'express-validator';

export const contractValidation = {
  create: [
    body('apartment')
      .notEmpty().withMessage('Apartment ID is required')
      .isMongoId().withMessage('Invalid apartment ID format'),
    body('tenant.name')
      .notEmpty().withMessage('Tenant name is required')
      .isString().withMessage('Tenant name must be a string'),
    body('tenant.phone')
      .notEmpty().withMessage('Tenant phone is required')
      .isString().withMessage('Tenant phone must be a string'),
    body('tenant.idImagePath')
      .optional()
      .isString().withMessage('Tenant ID image path must be a string'),
    body('contractFile')
      .optional()
      .isString().withMessage('Contract file path must be a string'),
    body('duration')
      .notEmpty().withMessage('Contract duration is required')
      .isNumeric().withMessage('Duration must be a number'),
    body('paymentFrequency')
      .notEmpty().withMessage('Payment frequency is required')
      .isIn(['yearly', 'bi-annually', 'quarterly', 'monthly']).withMessage('Invalid payment frequency'),
    body('startDate')
      .notEmpty().withMessage('Start date is required')
      .isISO8601().withMessage('Start date must be a valid date'),
    body('amount')
      .notEmpty().withMessage('Contract amount is required')
      .isNumeric().withMessage('Amount must be a number')
      .custom(value => value > 0).withMessage('Amount must be greater than 0')
  ],
  update: [
    body('tenant.name')
      .optional()
      .isString().withMessage('Tenant name must be a string'),
    body('tenant.phone')
      .optional()
      .isString().withMessage('Tenant phone must be a string'),
    body('tenant.idImagePath')
      .optional()
      .isString().withMessage('Tenant ID image path must be a string'),
    body('contractFile')
      .optional()
      .isString().withMessage('Contract file path must be a string'),
    body('paymentFrequency')
      .optional()
      .isIn(['yearly', 'bi-annually', 'quarterly', 'monthly']).withMessage('Invalid payment frequency'),
    body('isActive')
      .optional()
      .isBoolean().withMessage('isActive must be a boolean')
  ]
}; 