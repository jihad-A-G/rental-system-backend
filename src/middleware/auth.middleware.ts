import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import ErrorResponse from '../utils/errorResponse';
import User from '../models/user.model';

// Interface for JWT payload
interface JwtPayload {
  id: string;
}

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

    // Get user from database
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Set user in request
    req.user = user;
    next();
  } catch (error) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};

// Admin authorization middleware
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return next(new ErrorResponse('Not authorized as an admin', 403));
  }
}; 