import { Request, Response, NextFunction } from 'express';
import Apartment from '../models/apartment.model';
import ErrorResponse from '../utils/errorResponse';

// @desc    Get all apartments
// @route   GET /api/apartments
// @access  Private
export const getApartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    let query = Apartment.find(JSON.parse(queryStr));

    // Select Fields
    if (req.query.select) {
      const fields = (req.query.select as string).split(',').join(' ');
      query = query.select(fields) as any;
    }

    // Sort
    if (req.query.sort) {
      const sortBy = (req.query.sort as string).split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Apartment.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const apartments = await query;

    // Pagination result
    const pagination: any = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: apartments.length,
      pagination,
      data: apartments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single apartment
// @route   GET /api/apartments/:id
// @access  Private
export const getApartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apartment = await Apartment.findById(req.params.id).populate('contracts');

    if (!apartment) {
      return next(new ErrorResponse(`Apartment not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: apartment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new apartment
// @route   POST /api/apartments
// @access  Private
export const createApartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apartment = await Apartment.create(req.body);

    res.status(201).json({
      success: true,
      data: apartment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update apartment
// @route   PUT /api/apartments/:id
// @access  Private
export const updateApartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apartment = await Apartment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!apartment) {
      return next(new ErrorResponse(`Apartment not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: apartment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete apartment
// @route   DELETE /api/apartments/:id
// @access  Private
export const deleteApartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apartment = await Apartment.findById(req.params.id);

    if (!apartment) {
      return next(new ErrorResponse(`Apartment not found with id of ${req.params.id}`, 404));
    }

    // Make sure it's not occupied
    if (apartment.status === 'Occupied') {
      return next(new ErrorResponse(`Cannot delete an occupied apartment`, 400));
    }

    await apartment.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
}; 