import { Request, Response, NextFunction } from 'express';
import Invoice from '../models/invoice.model';
import Contract from '../models/contract.model';
import ErrorResponse from '../utils/errorResponse';

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req: Request, res: Response, next: NextFunction) => {
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
    let query = Invoice.find(JSON.parse(queryStr))
      .populate({
        path: 'contract',
        select: 'startDate endDate'
      })
      .populate({
        path: 'apartmentId',
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
      query = query.sort('-dueDate');
    }

    // Pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Invoice.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const invoices = await query;

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
      count: invoices.length,
      pagination,
      data: invoices
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate({
        path: 'contract',
        select: 'startDate endDate'
      })
      .populate({
        path: 'apartmentId',
        select: 'number location level'
      })
      .populate('payments');

    if (!invoice) {
      return next(new ErrorResponse(`Invoice not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
export const createInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contract: contractId } = req.body;

    // Check if contract exists
    const contract = await Contract.findById(contractId).populate('apartment');

    if (!contract) {
      return next(new ErrorResponse(`Contract not found with id of ${contractId}`, 404));
    }

    // Generate invoice number
    req.body.invoiceNumber = `INV-${Date.now()}`;
    
    // Add tenant and apartment info
    req.body.tenantName = contract.tenant.name;
    req.body.tenantPhone = contract.tenant.phone;
    req.body.apartmentId = contract.apartment._id;

    const invoice = await Invoice.create(req.body);

    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
export const updateInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Don't allow updating invoice number
    if (req.body.invoiceNumber) {
      return next(new ErrorResponse('Cannot change invoice number', 400));
    }

    // Fetch the current invoice to get the amount
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return next(new ErrorResponse(`Invoice not found with id of ${req.params.id}`, 404));
    }

    // If paidAmount is being updated, recalculate status
    let updateData = { ...req.body };
    if (typeof req.body.paidAmount === 'number') {
      const paidAmount = req.body.paidAmount;
      const amount = typeof req.body.amount === 'number' ? req.body.amount : invoice.amount;
      let status = invoice.status;
      if (paidAmount <= 0) {
        status = 'Unpaid';
      } else if (paidAmount >= amount) {
        status = 'Paid';
      } else {
        status = 'Partially Paid';
      }
      updateData.status = status;
    }

    // Update the invoice
    const updatedInvoice = await Invoice.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!updatedInvoice) {
      return next(new ErrorResponse(`Invoice not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: updatedInvoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
export const deleteInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return next(new ErrorResponse(`Invoice not found with id of ${req.params.id}`, 404));
    }

    // Check if invoice has been paid
    if (invoice.status !== 'Unpaid') {
      return next(new ErrorResponse('Cannot delete an invoice that has been paid', 400));
    }

    await invoice.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get invoices by apartment
// @route   GET /api/invoices/apartment/:apartmentId
// @access  Private
export const getInvoicesByApartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoices = await Invoice.find({ apartmentId: req.params.apartmentId })
      .populate({
        path: 'contract',
        select: 'startDate endDate'
      })
      .populate({
        path: 'apartmentId',
        select: 'number location level'
      })
      .sort('-dueDate');

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Pay an invoice (create payment and update invoice)
// @route   POST /api/invoices/:id/pay
// @access  Private
export const payInvoice = async (req: Request, res: Response, next: NextFunction) => {
  const session = await Invoice.startSession();
  session.startTransaction();
  try {
    const invoiceId = req.params.id;
    const { amount, paymentMethod = 'Cash', description = 'Rent Payment', paymentDate } = req.body;

    // Validate invoice
    const invoice = await Invoice.findById(invoiceId).session(session);
    if (!invoice) {
      await session.abortTransaction();
      session.endSession();
      return next(new ErrorResponse(`Invoice not found with id of ${invoiceId}`, 404));
    }

    // Check if invoice is already fully paid
    if (invoice.paidAmount >= invoice.amount) {
      await session.abortTransaction();
      session.endSession();
      return next(new ErrorResponse('Invoice is already fully paid', 400));
    }

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return next(new ErrorResponse('Payment amount must be greater than 0', 400));
    }
    const remainingAmount = invoice.amount - invoice.paidAmount;
    if (amount > remainingAmount) {
      await session.abortTransaction();
      session.endSession();
      return next(new ErrorResponse(`Payment amount cannot exceed remaining amount of ${remainingAmount}`, 400));
    }

    // Create payment
    const Payment = require('../models/payment.model').default;
    const payment = await Payment.create([
      {
        invoice: invoice._id,
        amount,
        paymentMethod,
        description,
        paymentDate: paymentDate || new Date(),
        receiptNumber: `RCPT-${Date.now()}`
      }
    ], { session });

    // Update invoice
    const newPaidAmount = invoice.paidAmount + amount;
    let newStatus = invoice.status;
    if (newPaidAmount >= invoice.amount) {
      newStatus = 'Paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'Partially Paid';
    }
    invoice.paidAmount = newPaidAmount;
    invoice.status = newStatus;
    await invoice.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Populate payments for response
    const updatedInvoice = await Invoice.findById(invoiceId).populate('payments');

    res.status(201).json({
      success: true,
      data: {
        invoice: updatedInvoice,
        payment: payment[0]
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
}; 