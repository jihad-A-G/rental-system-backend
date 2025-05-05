import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Employee from '../models/employee.model';
import Salary from '../models/salary.model';
import ErrorResponse from '../utils/errorResponse';

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
export const getEmployees = async (req: Request, res: Response, next: NextFunction) => {
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
    let query = Employee.find(JSON.parse(queryStr));

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
    const total = await Employee.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const employees = await query;

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
      count: employees.length,
      pagination,
      data: employees
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
export const getEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('salaries');

    if (!employee) {
      return next(new ErrorResponse(`Employee not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private
export const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await Employee.create(req.body);

    res.status(201).json({
      success: true,
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private
export const updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!employee) {
      return next(new ErrorResponse(`Employee not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private
export const deleteEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return next(new ErrorResponse(`Employee not found with id of ${req.params.id}`, 404));
    }

    // Check if employee has salary records
    const salaryRecords = await Salary.find({ employee: employee._id });

    if (salaryRecords.length > 0) {
      return next(new ErrorResponse('Cannot delete employee with salary records', 400));
    }

    await employee.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get employee salaries
// @route   GET /api/employees/:id/salaries
// @access  Private
export const getEmployeeSalaries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return next(new ErrorResponse(`Employee not found with id of ${req.params.id}`, 404));
    }

    const salaries = await Salary.find({ employee: req.params.id }).sort('-year -month');

    res.status(200).json({
      success: true,
      count: salaries.length,
      data: salaries
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create salary for employee
// @route   POST /api/employees/:id/salaries
// @access  Private
export const createSalary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return next(new ErrorResponse(`Employee not found with id of ${req.params.id}`, 404));
    }

    // Check if salary for this month and year already exists
    const { month, year } = req.body;
    const existingSalary = await Salary.findOne({
      employee: req.params.id,
      month,
      year
    });

    if (existingSalary) {
      return next(new ErrorResponse(`Salary for ${month}/${year} already exists`, 400));
    }

    // Set default amount to employee's salary if not provided
    if (!req.body.amount) {
      req.body.amount = employee.salary;
    }

    // Add employee to request body
    req.body.employee = req.params.id;

    const salary = await Salary.create(req.body);

    res.status(201).json({
      success: true,
      data: salary
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all salaries
// @route   GET /api/employees/salaries
// @access  Private
export const getAllSalaries = async (req: Request, res: Response, next: NextFunction) => {
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
    let query = Salary.find(JSON.parse(queryStr))
      .populate({
        path: 'employee',
        select: 'name role'
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
      query = query.sort('-year -month');
    }

    // Pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Salary.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const salaries = await query;

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
      count: salaries.length,
      pagination,
      data: salaries
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update salary
// @route   PUT /api/employees/salaries/:id
// @access  Private
export const updateSalary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Don't allow changing employee, month, or year
    if (req.body.employee || req.body.month || req.body.year) {
      return next(new ErrorResponse('Cannot change employee, month, or year for existing salary', 400));
    }

    const salary = await Salary.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!salary) {
      return next(new ErrorResponse(`Salary not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: salary
    });
  } catch (error) {
    next(error);
  }
}; 