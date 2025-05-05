import { Request, Response, NextFunction } from 'express';
import Expense from '../models/expense.model';
import ErrorResponse from '../utils/errorResponse';
import upload from '../middleware/upload.middleware';

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req: Request, res: Response, next: NextFunction) => {
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
    let query = Expense.find(JSON.parse(queryStr))
      .populate({
        path: 'apartment',
        select: 'number location level'
      });

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
      query = query.sort('-date');
    }

    // Pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Expense.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const expenses = await query;

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
      count: expenses.length,
      pagination,
      data: expenses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
export const getExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate({
        path: 'apartment',
        select: 'number location level'
      });

    if (!expense) {
      return next(new ErrorResponse(`Expense not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expense = await Expense.create(req.body);

    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!expense) {
      return next(new ErrorResponse(`Expense not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return next(new ErrorResponse(`Expense not found with id of ${req.params.id}`, 404));
    }

    await expense.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload expense invoice file
// @route   PUT /api/expenses/:id/upload
// @access  Private
export const uploadExpenseInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return next(new ErrorResponse(`Expense not found with id of ${req.params.id}`, 404));
    }

    // Set upload type for middleware to use
    req.body.uploadType = 'invoices';

    // Handle file upload
    upload.single('file')(req, res, async (err) => {
      if (err) {
        return next(new ErrorResponse(`Problem with file upload: ${err.message}`, 400));
      }

      if (!req.file) {
        return next(new ErrorResponse('Please upload a file', 400));
      }

      await Expense.findByIdAndUpdate(req.params.id, {
        invoiceFile: req.file.path
      });

      res.status(200).json({
        success: true,
        data: req.file.path
      });
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expenses by category
// @route   GET /api/expenses/category/:category
// @access  Private
export const getExpensesByCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expenses = await Expense.find({ category: req.params.category })
      .sort('-date');

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expenses by apartment
// @route   GET /api/expenses/apartment/:apartmentId
// @access  Private
export const getExpensesByApartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expenses = await Expense.find({ apartment: req.params.apartmentId })
      .sort('-date');

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    next(error);
  }
}; 