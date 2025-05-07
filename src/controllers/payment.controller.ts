import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Payment from '../models/payment.model';
import Invoice from '../models/invoice.model';
import ErrorResponse from '../utils/errorResponse';

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
export const getPayments = async (req: Request, res: Response, next: NextFunction) => {
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
    let query = Payment.find(JSON.parse(queryStr))
      .populate({
        path: 'invoice',
        select: 'invoiceNumber amount dueDate status tenantName apartmentId',
        populate: {
          path: 'apartmentId',
          select: 'number location'
        }
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
      query = query.sort('-paymentDate');
    }

    // Pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Payment.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const payments = await query;

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
      count: payments.length,
      pagination,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
export const getPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'invoice',
        select: 'invoiceNumber amount dueDate status description tenantName tenantPhone apartmentId',
        populate: {
          path: 'apartmentId',
          select: 'number location level'
        }
      });

    if (!payment) {
      return next(new ErrorResponse(`Payment not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new payment
// @route   POST /api/payments
// @access  Private
export const createPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoice: invoiceId, amount } = req.body;

    // Check if invoice exists
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return next(new ErrorResponse(`Invoice not found with id of ${invoiceId}`, 404));
    }

    // Check if amount is valid
    if (amount <= 0) {
      return next(new ErrorResponse('Payment amount must be greater than 0', 400));
    }

    // Check if payment amount is more than remaining invoice amount
    const remainingAmount = invoice.amount - invoice.paidAmount;
    if (amount > remainingAmount) {
      return next(new ErrorResponse(`Payment amount cannot exceed remaining amount of ${remainingAmount}`, 400));
    }

    // Generate receipt number
    req.body.receiptNumber = `RCPT-${Date.now()}`;

    // Use transaction to ensure data consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create payment
      const payment = await Payment.create([req.body], { session });
      
      // Update invoice status and paid amount
      const newPaidAmount = invoice.paidAmount + amount;
      let newStatus = invoice.status;
      
      if (newPaidAmount >= invoice.amount) {
        newStatus = 'Paid';
      } else if (newPaidAmount > 0) {
        newStatus = 'Partially Paid';
      }
      
      await Invoice.findByIdAndUpdate(
        invoiceId,
        {
          status: newStatus,
          paidAmount: newPaidAmount
        },
        { session }
      );
      
      await session.commitTransaction();
      session.endSession();
      
      res.status(201).json({
        success: true,
        data: payment[0]
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

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
export const updatePayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Don't allow updating invoice or amount after creation
    if (req.body.invoice || req.body.amount) {
      return next(new ErrorResponse('Cannot change invoice or amount for an existing payment', 400));
    }

    // Don't allow updating receipt number
    if (req.body.receiptNumber) {
      return next(new ErrorResponse('Cannot change receipt number', 400));
    }

    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!payment) {
      return next(new ErrorResponse(`Payment not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private
export const deletePayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return next(new ErrorResponse(`Payment not found with id of ${req.params.id}`, 404));
    }

    // Use transaction to ensure data consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get invoice
      const invoice = await Invoice.findById(payment.invoice);
      
      if (!invoice) {
        return next(new ErrorResponse(`Invoice not found for this payment`, 404));
      }
      
      // Update invoice status and paid amount
      const newPaidAmount = invoice.paidAmount - payment.amount;
      let newStatus = invoice.status;
      
      if (newPaidAmount <= 0) {
        newStatus = 'Unpaid';
      } else if (newPaidAmount < invoice.amount) {
        newStatus = 'Partially Paid';
      }
      
      await Invoice.findByIdAndUpdate(
        payment.invoice,
        {
          status: newStatus,
          paidAmount: newPaidAmount
        },
        { session }
      );
      
      // Delete payment
      await payment.deleteOne({ session });
      
      await session.commitTransaction();
      session.endSession();
      
      res.status(200).json({
        success: true,
        data: {}
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

// @desc    Get payments by invoice
// @route   GET /api/payments/invoice/:invoiceId
// @access  Private
export const getPaymentsByInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payments = await Payment.find({ invoice: req.params.invoiceId })
      .sort('-paymentDate');

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    next(error);
  }
}; 