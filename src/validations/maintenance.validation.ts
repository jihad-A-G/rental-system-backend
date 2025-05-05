import { body } from 'express-validator';

export const maintenanceValidation = {
  create: [
    body('apartment')
      .notEmpty().withMessage('Apartment ID is required')
      .isMongoId().withMessage('Invalid apartment ID format'),
    body('serviceProvider.name')
      .notEmpty().withMessage('Service provider name is required')
      .isString().withMessage('Service provider name must be a string'),
    body('serviceProvider.contact')
      .notEmpty().withMessage('Service provider contact is required')
      .isString().withMessage('Service provider contact must be a string'),
    body('serviceProvider.company')
      .optional()
      .isString().withMessage('Service provider company must be a string'),
    body('description')
      .notEmpty().withMessage('Description is required')
      .isString().withMessage('Description must be a string'),
    body('cost')
      .notEmpty().withMessage('Cost is required')
      .isNumeric().withMessage('Cost must be a number')
      .custom(value => value > 0).withMessage('Cost must be greater than 0'),
    body('maintenanceDate')
      .notEmpty().withMessage('Maintenance date is required')
      .isISO8601().withMessage('Maintenance date must be a valid date'),
    body('billToTenant')
      .optional()
      .isBoolean().withMessage('billToTenant must be a boolean'),
    body('completionDate')
      .optional()
      .isISO8601().withMessage('Completion date must be a valid date')
  ],
  update: [
    body('serviceProvider.name')
      .optional()
      .isString().withMessage('Service provider name must be a string'),
    body('serviceProvider.contact')
      .optional()
      .isString().withMessage('Service provider contact must be a string'),
    body('serviceProvider.company')
      .optional()
      .isString().withMessage('Service provider company must be a string'),
    body('description')
      .optional()
      .isString().withMessage('Description must be a string'),
    body('cost')
      .optional()
      .isNumeric().withMessage('Cost must be a number')
      .custom(value => value > 0).withMessage('Cost must be greater than 0'),
    body('status')
      .optional()
      .isIn(['Pending', 'Paid by Owner']).withMessage('Invalid status value'),
    body('billToTenant')
      .optional()
      .isBoolean().withMessage('billToTenant must be a boolean'),
    body('maintenanceDate')
      .optional()
      .isISO8601().withMessage('Maintenance date must be a valid date'),
    body('completionDate')
      .optional()
      .isISO8601().withMessage('Completion date must be a valid date')
  ]
}; 