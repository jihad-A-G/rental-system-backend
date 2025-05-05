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
        select: 'tenant.name tenant.phone startDate endDate',
        populate: {
          path: 'apartment',
          select: 'number location level'
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
        select: 'tenant.name tenant.phone startDate endDate apartment',
        populate: {
          path: 'apartment',
          select: 'number location level'
        }
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
    const contract = await Contract.findById(contractId);

    if (!contract) {
      return next(new ErrorResponse(`Contract not found with id of ${contractId}`, 404));
    }

    // Generate invoice number
    req.body.invoiceNumber = `INV-${Date.now()}`;

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
    // Don't allow updating contract after creation
    if (req.body.contract) {
      return next(new ErrorResponse('Cannot change contract for an existing invoice', 400));
    }

    // Don't allow updating invoice number
    if (req.body.invoiceNumber) {
      return next(new ErrorResponse('Cannot change invoice number', 400));
    }

    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

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
    const contracts = await Contract.find({ apartment: req.params.apartmentId });
    
    if (contracts.length === 0) {
      return next(new ErrorResponse(`No contracts found for apartment with id of ${req.params.apartmentId}`, 404));
    }

    const contractIds = contracts.map(contract => contract._id);
    
    const invoices = await Invoice.find({ contract: { $in: contractIds } })
      .populate({
        path: 'contract',
        select: 'tenant.name tenant.phone startDate endDate',
        populate: {
          path: 'apartment',
          select: 'number location level'
        }
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