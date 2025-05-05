import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import ErrorResponse from '../utils/errorResponse';

// Middleware to validate request based on provided rules
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format validation errors
    const errorMessages = errors.array().map(error => {
      // Using type assertion to access properties
      const field = (error as any).path || (error as any).param || 'unknown field';
      return `${field}: ${error.msg}`;
    });

    return next(new ErrorResponse(errorMessages.join(', '), 400));
  };
}; 