import { body } from 'express-validator';

export const paymentValidation = {
  create: [
    body('invoice')
      .notEmpty().withMessage('Invoice ID is required')
      .isMongoId().withMessage('Invalid invoice ID format'),
    body('amount')
      .notEmpty().withMessage('Payment amount is required')
      .isNumeric().withMessage('Amount must be a number')
      .custom(value => value > 0).withMessage('Amount must be greater than 0'),
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