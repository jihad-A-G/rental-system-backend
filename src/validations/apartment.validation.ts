import { body } from 'express-validator';

export const apartmentValidation = {
  create: [
    body('level')
      .notEmpty().withMessage('Level is required')
      .isNumeric().withMessage('Level must be a number'),
    body('location')
      .notEmpty().withMessage('Location is required')
      .isString().withMessage('Location must be a string'),
    body('number')
      .notEmpty().withMessage('Apartment number is required')
      .isString().withMessage('Apartment number must be a string'),
    body('rooms')
      .notEmpty().withMessage('Number of rooms is required')
      .isNumeric().withMessage('Rooms must be a number'),
    body('amenities')
      .optional()
      .isArray().withMessage('Amenities must be an array of strings'),
    body('status')
      .optional()
      .isIn(['Available', 'Occupied', 'Under Maintenance']).withMessage('Invalid status value')
  ],
  update: [
    body('level')
      .optional()
      .isNumeric().withMessage('Level must be a number'),
    body('location')
      .optional()
      .isString().withMessage('Location must be a string'),
    body('number')
      .optional()
      .isString().withMessage('Apartment number must be a string'),
    body('rooms')
      .optional()
      .isNumeric().withMessage('Rooms must be a number'),
    body('amenities')
      .optional()
      .isArray().withMessage('Amenities must be an array of strings'),
    body('status')
      .optional()
      .isIn(['Available', 'Occupied', 'Under Maintenance']).withMessage('Invalid status value')
  ]
}; 