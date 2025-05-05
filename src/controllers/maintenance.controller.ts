import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Maintenance from '../models/maintenance.model';
import Apartment from '../models/apartment.model';
import Invoice from '../models/invoice.model';
import Contract from '../models/contract.model';
import ErrorResponse from '../utils/errorResponse';
import upload from '../middleware/upload.middleware';

// @desc    Get all maintenance requests
// @route   GET /api/maintenance
// @access  Private
export const getMaintenanceRequests = async (req: Request, res: Response, next: NextFunction) => {
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
    let query = Maintenance.find(JSON.parse(queryStr))
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
      query = query.sort('-maintenanceDate');
    }

    // Pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Maintenance.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const maintenanceRequests = await query;

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
      count: maintenanceRequests.length,
      pagination,
      data: maintenanceRequests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single maintenance request
// @route   GET /api/maintenance/:id
// @access  Private
export const getMaintenanceRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)
      .populate({
        path: 'apartment',
        select: 'number location level status'
      });

    if (!maintenance) {
      return next(new ErrorResponse(`Maintenance request not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: maintenance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new maintenance request
// @route   POST /api/maintenance
// @access  Private
export const createMaintenanceRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { apartment: apartmentId, billToTenant } = req.body;

    // Check if apartment exists
    const apartment = await Apartment.findById(apartmentId);

    if (!apartment) {
      return next(new ErrorResponse(`Apartment not found with id of ${apartmentId}`, 404));
    }

    // Check if apartment has active contract if billing to tenant
    if (billToTenant) {
      const contract = await Contract.findOne({ 
        apartment: apartmentId,
        isActive: true
      });

      if (!contract) {
        return next(new ErrorResponse(`Cannot bill to tenant: no active contract for this apartment`, 400));
      }
    }

    const maintenance = await Maintenance.create(req.body);

    // If billing to tenant, create invoice
    if (billToTenant) {
      // Find active contract for the apartment
      const contract = await Contract.findOne({ 
        apartment: apartmentId,
        isActive: true
      });

      if (contract) {
        // Create tenant invoice
        const invoice = await Invoice.create({
          contract: contract._id,
          invoiceNumber: `INV-M-${Date.now()}`,
          amount: req.body.cost,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Due in 14 days
          status: 'Unpaid',
          maintenanceRelated: true,
          description: `Maintenance: ${req.body.description}`
        });

        // Update maintenance with tenant invoice
        await Maintenance.findByIdAndUpdate(maintenance._id, {
          tenantInvoiceId: invoice._id
        });
      }
    }

    res.status(201).json({
      success: true,
      data: maintenance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update maintenance request
// @route   PUT /api/maintenance/:id
// @access  Private
export const updateMaintenanceRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return next(new ErrorResponse(`Maintenance request not found with id of ${req.params.id}`, 404));
    }

    // Don't allow changing billToTenant if an invoice already exists
    if (maintenance.tenantInvoiceId && req.body.billToTenant === false) {
      return next(new ErrorResponse('Cannot remove tenant billing as invoice already exists', 400));
    }

    // Update maintenance
    const updatedMaintenance = await Maintenance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Handle new tenant billing if changed
    if (!maintenance.billToTenant && req.body.billToTenant === true) {
      // Find active contract for the apartment
      const contract = await Contract.findOne({ 
        apartment: maintenance.apartment,
        isActive: true
      });

      if (!contract) {
        return next(new ErrorResponse(`Cannot bill to tenant: no active contract for this apartment`, 400));
      }

      // Create tenant invoice
      const invoice = await Invoice.create({
        contract: contract._id,
        invoiceNumber: `INV-M-${Date.now()}`,
        amount: maintenance.cost,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Due in 14 days
        status: 'Unpaid',
        maintenanceRelated: true,
        description: `Maintenance: ${maintenance.description}`
      });

      // Update maintenance with tenant invoice
      await Maintenance.findByIdAndUpdate(maintenance._id, {
        tenantInvoiceId: invoice._id
      });
    }

    res.status(200).json({
      success: true,
      data: updatedMaintenance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete maintenance request
// @route   DELETE /api/maintenance/:id
// @access  Private
export const deleteMaintenanceRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return next(new ErrorResponse(`Maintenance request not found with id of ${req.params.id}`, 404));
    }

    // Check if there's a tenant invoice
    if (maintenance.tenantInvoiceId) {
      const invoice = await Invoice.findById(maintenance.tenantInvoiceId);
      
      if (invoice && invoice.status !== 'Unpaid') {
        return next(new ErrorResponse('Cannot delete maintenance with a paid tenant invoice', 400));
      }
      
      // Delete the invoice if it exists and is unpaid
      if (invoice) {
        await invoice.deleteOne();
      }
    }

    await maintenance.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload maintenance invoice file
// @route   PUT /api/maintenance/:id/upload
// @access  Private
export const uploadMaintenanceInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return next(new ErrorResponse(`Maintenance request not found with id of ${req.params.id}`, 404));
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

      await Maintenance.findByIdAndUpdate(req.params.id, {
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

// @desc    Get maintenance requests by apartment
// @route   GET /api/maintenance/apartment/:apartmentId
// @access  Private
export const getMaintenanceByApartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const maintenance = await Maintenance.find({ apartment: req.params.apartmentId })
      .sort('-maintenanceDate');

    res.status(200).json({
      success: true,
      count: maintenance.length,
      data: maintenance
    });
  } catch (error) {
    next(error);
  }
}; 