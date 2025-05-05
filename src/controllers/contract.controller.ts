import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Contract from '../models/contract.model';
import Apartment from '../models/apartment.model';
import Invoice from '../models/invoice.model';
import ErrorResponse from '../utils/errorResponse';
import moment from 'moment';
import upload from '../middleware/upload.middleware';

// @desc    Get all contracts
// @route   GET /api/contracts
// @access  Private
export const getContracts = async (req: Request, res: Response, next: NextFunction) => {
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
    let query = Contract.find(JSON.parse(queryStr)).populate({
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
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Contract.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const contracts = await query;

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
      count: contracts.length,
      pagination,
      data: contracts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single contract
// @route   GET /api/contracts/:id
// @access  Private
export const getContract = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate({
        path: 'apartment',
        select: 'number location level status'
      })
      .populate('invoices');

    if (!contract) {
      return next(new ErrorResponse(`Contract not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: contract
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new contract
// @route   POST /api/contracts
// @access  Private
export const createContract = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { apartment: apartmentId, duration, paymentFrequency, startDate, amount } = req.body;

    // Check if apartment exists and is available
    const apartment = await Apartment.findById(apartmentId);

    if (!apartment) {
      return next(new ErrorResponse(`Apartment not found with id of ${apartmentId}`, 404));
    }

    if (apartment.status !== 'Available') {
      return next(new ErrorResponse(`Apartment is not available for rent`, 400));
    }

    // Calculate end date based on duration (years)
    const endDate = moment(startDate).add(duration, 'years').toDate();
    req.body.endDate = endDate;

    // Create contract using mongoose transaction to ensure atomicity
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Create the contract
      const contract = await Contract.create([req.body], { session });
      
      // Update apartment status to Occupied
      apartment.status = 'Occupied';
      await apartment.save({ session });
      
      // Generate invoices based on payment frequency
      let invoices = [];
      let paymentInterval: number;
      let numberOfInvoices: number;
      
      switch (paymentFrequency) {
        case 'yearly':
          paymentInterval = 12;
          numberOfInvoices = duration;
          break;
        case 'bi-annually':
          paymentInterval = 6;
          numberOfInvoices = duration * 2;
          break;
        case 'quarterly':
          paymentInterval = 3;
          numberOfInvoices = duration * 4;
          break;
        case 'monthly':
          paymentInterval = 1;
          numberOfInvoices = duration * 12;
          break;
        default:
          paymentInterval = 12;
          numberOfInvoices = duration;
      }
      
      const invoiceAmount = amount / (12 / paymentInterval);
      
      for (let i = 0; i < numberOfInvoices; i++) {
        const dueDate = moment(startDate).add(i * paymentInterval, 'months').toDate();
        const invoiceNumber = `INV-${Date.now()}-${i + 1}`;
        const invoiceDescription = `Rent payment for ${apartment.number} - ${moment(dueDate).format('MMM YYYY')}`;
        
        await Invoice.create([{
          contract: contract[0]._id,
          invoiceNumber,
          amount: invoiceAmount,
          dueDate,
          status: 'Unpaid',
          description: invoiceDescription
        }], { session });
      }
      
      await session.commitTransaction();
      session.endSession();
      
      res.status(201).json({
        success: true,
        data: contract[0]
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update contract
// @route   PUT /api/contracts/:id
// @access  Private
export const updateContract = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Don't allow updating apartment or contract duration after creation
    if (req.body.apartment || req.body.duration) {
      return next(new ErrorResponse('Cannot change apartment or duration for an existing contract', 400));
    }

    const contract = await Contract.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!contract) {
      return next(new ErrorResponse(`Contract not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: contract
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete contract
// @route   DELETE /api/contracts/:id
// @access  Private
export const deleteContract = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return next(new ErrorResponse(`Contract not found with id of ${req.params.id}`, 404));
    }

    // Check if contract has unpaid invoices
    const invoices = await Invoice.find({ contract: contract._id, status: { $ne: 'Paid' } });

    if (invoices.length > 0) {
      return next(new ErrorResponse('Cannot delete contract with unpaid invoices', 400));
    }

    // Update apartment status to Available
    await Apartment.findByIdAndUpdate(contract.apartment, { status: 'Available' });

    // Delete contract
    await contract.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload contract file
// @route   PUT /api/contracts/:id/upload
// @access  Private
export const uploadContractFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return next(new ErrorResponse(`Contract not found with id of ${req.params.id}`, 404));
    }

    // Set upload type for middleware to use
    req.body.uploadType = 'contracts';

    // Handle file upload
    upload.single('file')(req, res, async (err) => {
      if (err) {
        return next(new ErrorResponse(`Problem with file upload: ${err.message}`, 400));
      }

      if (!req.file) {
        return next(new ErrorResponse('Please upload a file', 400));
      }

      await Contract.findByIdAndUpdate(req.params.id, {
        contractFile: req.file.path
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