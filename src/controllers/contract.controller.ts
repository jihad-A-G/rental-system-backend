import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Contract from '../models/contract.model';
import Apartment from '../models/apartment.model';
import Invoice from '../models/invoice.model';
import ErrorResponse from '../utils/errorResponse';
import moment from 'moment';
import upload from '../middleware/upload.middleware';
import path from 'path';
import fs from 'fs';

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
    // Extract data from request body
    const { 
      apartment, 
      duration,
      paymentFrequency,
      startDate,
      endDate,
      amount,
      isActive 
    } = req.body;

    // Extract tenant information from nested format
    const tenantName = req.body['tenant[name]'] || (req.body.tenant && req.body.tenant.name);
    const tenantPhone = req.body['tenant[phone]'] || (req.body.tenant && req.body.tenant.phone);
    
    // Get file paths if they were processed by the upload middleware
    let tenantIdPath = req.body['tenant[idImagePath]'] || (req.body.tenant && req.body.tenant.idImagePath);
    let contractFilePath = req.body.contractFile;

    // Check for required fields
    if (!apartment) {
      return next(new ErrorResponse('Apartment ID is required', 400));
    }
    
    if (!tenantName) {
      return next(new ErrorResponse('Tenant name is required', 400));
    }
    
    if (!tenantPhone) {
      return next(new ErrorResponse('Tenant phone is required', 400));
    }
    
    if (!duration) {
      return next(new ErrorResponse('Contract duration is required', 400));
    }
    
    if (!paymentFrequency || !['yearly', 'bi-annually', 'quarterly', 'monthly'].includes(paymentFrequency)) {
      return next(new ErrorResponse('Valid payment frequency is required', 400));
    }
    
    if (!startDate) {
      return next(new ErrorResponse('Start date is required', 400));
    }
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return next(new ErrorResponse('Valid amount is required', 400));
    }

    // Check if apartment exists and is available
    const apartmentDoc = await Apartment.findById(apartment);
    if (!apartmentDoc) {
      return next(new ErrorResponse(`Apartment not found with id of ${apartment}`, 404));
    }

    if (apartmentDoc.status !== 'Available') {
      return next(new ErrorResponse(`Apartment is not available for rent`, 400));
    }

    // Use the provided end date or calculate it based on duration (years)
    const contractEndDate = endDate || moment(startDate).add(Number(duration), 'years').toDate();

    // Create tenant object
    const tenantData: Record<string, any> = {
      name: tenantName,
      phone: tenantPhone
    };

    // Add idImagePath to tenant data if provided
    if (tenantIdPath) {
      tenantData.idImagePath = tenantIdPath;
    }

    // Prepare contract data object
    const contractData: Record<string, any> = {
      apartment,
      tenant: tenantData,
      duration: Number(duration),
      paymentFrequency,
      startDate,
      endDate: contractEndDate,
      amount: Number(amount),
      isActive: isActive === 'true' || isActive === true ? true : false
    };

    // Add contract file if provided
    if (contractFilePath) {
      contractData.contractFile = contractFilePath;
    }

    // Create contract using mongoose transaction to ensure atomicity
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Create the contract
      const contract = await Contract.create([contractData], { session });
      
      // Update apartment status to Occupied
      apartmentDoc.status = 'Occupied';
      await apartmentDoc.save({ session });
      
      // Generate invoices based on payment frequency
      let paymentInterval: number;
      let numberOfInvoices: number;
      
      switch (paymentFrequency) {
        case 'yearly':
          paymentInterval = 12;
          numberOfInvoices = Number(duration);
          break;
        case 'bi-annually':
          paymentInterval = 6;
          numberOfInvoices = Number(duration) * 2;
          break;
        case 'quarterly':
          paymentInterval = 3;
          numberOfInvoices = Number(duration) * 4;
          break;
        case 'monthly':
          paymentInterval = 1;
          numberOfInvoices = Number(duration) * 12;
          break;
        default:
          paymentInterval = 12;
          numberOfInvoices = Number(duration);
      }
      
      const invoiceAmount = Number(amount) / numberOfInvoices;
      
      for (let i = 0; i < numberOfInvoices; i++) {
        const dueDate = moment(startDate).add(i * paymentInterval, 'months').toDate();
        const invoiceNumber = `INV-${Date.now()}-${i + 1}`;
        const invoiceDescription = `Rent payment for ${apartmentDoc.number} - ${moment(dueDate).format('MMM YYYY')}`;
        
        await Invoice.create([{
          contract: contract[0]._id,
          tenantName: tenantData.name,
          tenantPhone: tenantData.phone,
          apartmentId: apartment,
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
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      next(error);
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
    // Find existing contract first
    const existingContract = await Contract.findById(req.params.id);
    
    if (!existingContract) {
      return next(new ErrorResponse(`Contract not found with id of ${req.params.id}`, 404));
    }

    // Extract data from request body
    const { 
      apartment, 
      duration,
      paymentFrequency,
      startDate,
      endDate,
      amount,
      isActive 
    } = req.body;

    // Extract tenant information from nested format, similar to createContract
    const tenantName = req.body['tenant[name]'] || (req.body.tenant && req.body.tenant.name);
    const tenantPhone = req.body['tenant[phone]'] || (req.body.tenant && req.body.tenant.phone);
    
    // Get file paths if they were processed by the upload middleware
    // These will be set by the upload middleware when files are uploaded
    let tenantIdPath = req.body['tenant[idImagePath]'] || (req.body.tenant && req.body.tenant.idImagePath);
    let contractFilePath = req.body.contractFile;

    // Check if files were uploaded in this request
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Handle contract file upload
      if (files.contractFile && files.contractFile[0]) {
        contractFilePath = files.contractFile[0].path;
      }
      
      // Handle tenant ID image upload
      if (files.tenantIdImage && files.tenantIdImage[0]) {
        tenantIdPath = files.tenantIdImage[0].path;
      }
    } else if (req.file) {
      // Handle single file upload
      if (req.file.fieldname === 'contractFile') {
        contractFilePath = req.file.path;
      } else if (req.file.fieldname === 'tenantIdImage') {
        tenantIdPath = req.file.path;
      }
    }

    // Create update data object
    const updateData: Record<string, any> = {};
    
    // Handle apartment updates if specified
    let apartmentDoc = null;
    if (apartment && apartment !== existingContract.apartment.toString()) {
      // Check if new apartment exists and is available
      apartmentDoc = await Apartment.findById(apartment);
      if (!apartmentDoc) {
        return next(new ErrorResponse(`New apartment not found with id of ${apartment}`, 404));
      }

      if (apartmentDoc.status !== 'Available') {
        return next(new ErrorResponse(`New apartment is not available for rent`, 400));
      }
      
      updateData.apartment = apartment;
    }
    
    // Copy other fields from req.body to updateData
    if (duration) updateData.duration = Number(duration);
    if (paymentFrequency) updateData.paymentFrequency = paymentFrequency;
    if (startDate) updateData.startDate = startDate;
    
    // Calculate new end date if duration or start date changed
    if ((duration || startDate) && (existingContract.duration !== Number(duration) || existingContract.startDate.toString() !== new Date(startDate).toString())) {
      const newStartDate = startDate ? new Date(startDate) : existingContract.startDate;
      const newDuration = duration ? Number(duration) : existingContract.duration;
      const newEndDate = endDate || moment(newStartDate).add(newDuration, 'years').toDate();
      updateData.endDate = newEndDate;
    } else if (endDate) {
      updateData.endDate = endDate;
    }
    
    if (amount) updateData.amount = Number(amount);
    if (isActive !== undefined) {
      updateData.isActive = isActive === 'true' || isActive === true ? true : false;
    }
    
    // Handle tenant updates
    if (tenantName || tenantPhone || tenantIdPath) {
      // Create a copy of the existing tenant data
      updateData.tenant = {
        name: existingContract.tenant.name,
        phone: existingContract.tenant.phone,
        idImagePath: existingContract.tenant.idImagePath
      };
      
      if (tenantName) updateData.tenant.name = tenantName;
      if (tenantPhone) updateData.tenant.phone = tenantPhone;
      if (tenantIdPath) updateData.tenant.idImagePath = tenantIdPath;
    }
    
    // Add contract file if provided
    if (contractFilePath) {
      updateData.contractFile = contractFilePath;
    }

    // Use transaction to ensure consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update contract
      const contract = await Contract.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
        session
      });

      // Update apartments status if apartment changed
      if (apartmentDoc) {
        // Set new apartment to Occupied
        apartmentDoc.status = 'Occupied';
        await apartmentDoc.save({ session });
        
        // Set old apartment to Available
        await Apartment.findByIdAndUpdate(
          existingContract.apartment,
          { status: 'Available' },
          { session }
        );
      }

      // Handle invoice updates based on changes
      const invoiceUpdateData: Record<string, any> = {};
      
      // Always update tenant info if provided
      if (tenantName) invoiceUpdateData.tenantName = tenantName;
      if (tenantPhone) invoiceUpdateData.tenantPhone = tenantPhone;
      
      // Update apartment reference if changed
      if (apartment && apartment !== existingContract.apartment.toString()) {
        invoiceUpdateData.apartmentId = apartment;
      }
      
      // If duration, start date, or payment frequency changed, handle all invoices
      let regenerateInvoices = false;
      if (
        (duration && Number(duration) !== existingContract.duration) || 
        (startDate && new Date(startDate).getTime() !== existingContract.startDate.getTime()) ||
        (paymentFrequency && paymentFrequency !== existingContract.paymentFrequency)
      ) {
        regenerateInvoices = true;
      }
      
      // If we need to regenerate invoices (duration/startDate/frequency changed)
      if (regenerateInvoices) {
        // Delete all unpaid invoices - including past ones when frequency changes
        const deleteQuery: Record<string, any> = {
          contract: existingContract._id,
          status: 'Unpaid'
        };
        
        // Only restrict to future invoices if we're not changing payment frequency
        if (!paymentFrequency || paymentFrequency === existingContract.paymentFrequency) {
          deleteQuery['dueDate'] = { $gt: new Date() };
        }
        
        await Invoice.deleteMany(deleteQuery, { session });
        console.log(`Deleted invoices with query:`, JSON.stringify(deleteQuery));
        
        // Generate new invoices based on new contract terms
        const newPaymentFrequency = paymentFrequency || existingContract.paymentFrequency;
        const newDuration = duration ? Number(duration) : existingContract.duration;
        const newStartDate = startDate ? new Date(startDate) : existingContract.startDate;
        const newAmount = amount ? Number(amount) : existingContract.amount;
        const newApartmentId = apartment || existingContract.apartment;
        
        // Get current date and end date
        const now = new Date();
        const contractEndDate = updateData.endDate || existingContract.endDate;
        
        // Calculate number of invoices based on frequency and total contract duration
        // NOT based on remaining months
        let paymentInterval: number;
        let numberOfInvoices: number;
        
        switch (newPaymentFrequency) {
          case 'yearly':
            paymentInterval = 12;
            numberOfInvoices = newDuration; // 1 per year
            break;
          case 'bi-annually':
            paymentInterval = 6;
            numberOfInvoices = newDuration * 2; // 2 per year
            break;
          case 'quarterly':
            paymentInterval = 3;
            numberOfInvoices = newDuration * 4; // 4 per year
            break;
          case 'monthly':
            paymentInterval = 1;
            numberOfInvoices = newDuration * 12; // 12 per year
            break;
          default:
            paymentInterval = 12;
            numberOfInvoices = newDuration;
        }
        
        // Divide total contract amount evenly across all invoices
        const invoiceAmount = newAmount / numberOfInvoices;
        
        console.log(`Contract details for regeneration: 
          Frequency: ${newPaymentFrequency}
          Duration: ${newDuration} years
          Total invoices for contract: ${numberOfInvoices}
          Invoice amount each: ${invoiceAmount}
          Contract end date: ${contractEndDate}`);
        
        // When changing frequency, start from next month
        const nextMonth = moment().add(1, 'months').startOf('month');
        const invoiceStartDate = paymentFrequency && paymentFrequency !== existingContract.paymentFrequency
          ? nextMonth.toDate()
          : newStartDate;
        
        console.log(`Invoice start date: ${invoiceStartDate}`);
        
        // Count invoices created
        let createdCount = 0;
        
        // Create invoices for remaining period
        for (let i = 0; i < numberOfInvoices; i++) {
          const dueDate = moment(invoiceStartDate).add(i * paymentInterval, 'months').toDate();
          
          // Skip invoices with due dates beyond contract end date
          if (dueDate > contractEndDate) {
            continue;
          }
          
          // Skip invoices with due dates in the past
          if (dueDate <= now) {
            continue;
          }
          
          const invoiceNumber = `INV-${Date.now()}-${i + 1}`;
          const invoiceDescription = `Rent payment for ${apartmentDoc ? apartmentDoc.number : 
            (await Apartment.findById(existingContract.apartment))?.number || 'Unknown'} - ${moment(dueDate).format('MMM YYYY')}`;
          
          await Invoice.create([{
            contract: existingContract._id,
            tenantName: updateData.tenant?.name || existingContract.tenant.name,
            tenantPhone: updateData.tenant?.phone || existingContract.tenant.phone,
            apartmentId: newApartmentId,
            invoiceNumber,
            amount: invoiceAmount,
            dueDate,
            status: 'Unpaid',
            description: invoiceDescription
          }], { session });
          
          createdCount++;
        }
        
        console.log(`Successfully created ${createdCount} new invoices`);
      } 
      // Otherwise just update existing invoices with the relevant fields
      else if (amount || Object.keys(invoiceUpdateData).length > 0) {
        // Only add amount to update data if it's changed
        if (amount) {
          const activePaymentFrequency = paymentFrequency || existingContract.paymentFrequency;
          let paymentInterval;
          
          switch (activePaymentFrequency) {
            case 'yearly':
              paymentInterval = 12;
              break;
            case 'bi-annually':
              paymentInterval = 6;
              break;
            case 'quarterly':
              paymentInterval = 3;
              break;
            case 'monthly':
              paymentInterval = 1;
              break;
            default:
              paymentInterval = 12;
          }
          
          invoiceUpdateData.amount = Number(amount) / (12 / paymentInterval);
        }
        
        // Update all unpaid invoices with new data
        if (Object.keys(invoiceUpdateData).length > 0) {
          await Invoice.updateMany(
            { 
              contract: existingContract._id,
              status: 'Unpaid'
            },
            { $set: invoiceUpdateData },
            { session }
          );
        }
      }
      
      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        success: true,
        data: contract
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
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

    // Use transaction to ensure consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Delete all associated invoices regardless of status
      await Invoice.deleteMany({ contract: contract._id }, { session });

      // Update apartment status to Available
      await Apartment.findByIdAndUpdate(
        contract.apartment, 
        { status: 'Available' },
        { session }
      );

      // Delete contract
      await contract.deleteOne({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
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
    upload.single('contractFile')(req, res, async (err) => {
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

// @desc    Upload tenant ID image
// @route   PUT /api/contracts/:id/upload-tenant-id
// @access  Private
export const uploadTenantIdImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return next(new ErrorResponse(`Contract not found with id of ${req.params.id}`, 404));
    }

    // Set upload type for middleware to use
    req.body.uploadType = 'tenants';

    // Handle file upload
    upload.single('tenantIdImage')(req, res, async (err) => {
      if (err) {
        return next(new ErrorResponse(`Problem with file upload: ${err.message}`, 400));
      }

      if (!req.file) {
        return next(new ErrorResponse('Please upload a file', 400));
      }

      // Update tenant ID image path in contract
      await Contract.findByIdAndUpdate(req.params.id, {
        'tenant.idImagePath': req.file.path
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