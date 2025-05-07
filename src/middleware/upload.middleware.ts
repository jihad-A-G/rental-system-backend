import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import ErrorResponse from '../utils/errorResponse';
import fs from 'fs';

// Define file types
export type FileCategory = 'contract' | 'id' | 'invoice' | 'maintenance' | 'receipt' | 'other';

// File category config
const categoryConfig: Record<FileCategory, { path: string, allowedTypes?: string[] }> = {
  contract: { 
    path: 'uploads/contracts',
    allowedTypes: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'] 
  },
  id: { 
    path: 'uploads/ids',
    allowedTypes: ['.jpg', '.jpeg', '.png', '.pdf'] 
  },
  invoice: { 
    path: 'uploads/invoices',
    allowedTypes: ['.pdf', '.jpg', '.jpeg', '.png'] 
  },
  maintenance: { 
    path: 'uploads/maintenance',
    allowedTypes: ['.pdf', '.jpg', '.jpeg', '.png'] 
  },
  receipt: { 
    path: 'uploads/receipts',
    allowedTypes: ['.pdf', '.jpg', '.jpeg', '.png'] 
  },
  other: { 
    path: 'uploads/other' 
  }
};

// Field to category mapping function
const mapFieldToCategory = (fieldname: string): FileCategory => {
  const fieldLower = fieldname.toLowerCase();
  
  if (fieldLower.includes('contract')) return 'contract';
  if (fieldLower.includes('tenant') && (fieldLower.includes('id') || fieldLower.includes('image'))) return 'id';
  if (fieldLower.includes('invoice')) return 'invoice';
  if (fieldLower.includes('maintenance')) return 'maintenance';
  if (fieldLower.includes('receipt')) return 'receipt';
  
  return 'other';
};

// Set up storage with automatic category detection
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // Determine category and path based on field name
    const category = mapFieldToCategory(file.fieldname);
    const destination = categoryConfig[category].path;
    
    // Create directory if it doesn't exist
    try {
      fs.mkdirSync(destination, { recursive: true });
    } catch (err) {
      console.log('Error creating directory:', err);
    }
    
    cb(null, destination);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Create a clean filename
    const fileExt = path.extname(file.originalname).toLowerCase();
    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-').replace(fileExt, '')}${fileExt}`;
    cb(null, fileName);
  }
});

// File filter function checking allowed extensions by category
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const category = mapFieldToCategory(file.fieldname);
  const allowedTypes = categoryConfig[category].allowedTypes;
  
  // If no specific types defined, allow all
  if (!allowedTypes) {
    return cb(null, true);
  }
  
  const fileExt = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(fileExt)) {
    return cb(null, true);
  } else {
    cb(new Error(`Invalid file format! Only ${allowedTypes.join(', ')} files are allowed for ${category} uploads.`));
  }
};

// Create base upload object
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max size
  fileFilter
});

/**
 * Creates a middleware for handling file uploads
 * @param fieldConfigs Optional configuration for specific fields
 * @returns Express middleware function
 */
export const handleFileUploads = (fieldConfigs?: multer.Field[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip if not multipart/form-data
    if (!req.is('multipart/form-data')) {
      return next();
    }
    
    // Use specific field configs if provided, otherwise accept any field
    const uploadHandler = fieldConfigs 
      ? upload.fields(fieldConfigs)
      : upload.any();
      
    uploadHandler(req, res, (err) => {
      if (err) {
        console.log('File upload error:', err);
        return next(new ErrorResponse(`Problem with file upload: ${err.message}`, 400));
      }
      
      // Process uploaded files
      const files = Array.isArray(req.files) 
        ? req.files 
        : req.files ? Object.values(req.files).flat() : [];
      
      if (files && files.length > 0) {
        console.log('Uploaded files:', files.map(f => ({ 
          fieldname: f.fieldname, 
          destination: f.destination,
          filename: f.filename
        })));
        
        // Handle form data with JSONish content
        if (typeof req.body.data === 'string') {
          try {
            const parsedData = JSON.parse(req.body.data);
            // Merge parsed data with req.body, keeping file paths
            Object.assign(req.body, parsedData);
          } catch (error) {
            console.log('Error parsing JSON data:', error);
            // Continue anyway, no need to fail
          }
        }
        
        // Add file paths to request body in appropriate format
        files.forEach(file => {
          const fieldPath = file.fieldname.replace(/\[/g, '.').replace(/\]/g, '');
          
          // Handle nested fields (tenant.idImagePath or tenant[idImagePath])
          if (fieldPath.includes('.')) {
            const parts = fieldPath.split('.');
            const mainField = parts[0];
            const subField = parts[1];
            
            // Create nested object if it doesn't exist
            if (!req.body[mainField] || typeof req.body[mainField] !== 'object') {
              req.body[mainField] = {};
            }
            
            // Add file path to nested field
            req.body[mainField][subField] = file.path;
            
            // Also maintain the original format if it used brackets
            if (file.fieldname.includes('[')) {
              req.body[file.fieldname] = file.path;
            }
          } else {
            // Add file path for simple fields
            req.body[fieldPath] = file.path;
          }
        });
      }
      
      // Debug logging (masking file paths)
      const debugBody = { ...req.body };
      
      // Mask any file paths for security
      Object.keys(debugBody).forEach(key => {
        if (typeof debugBody[key] === 'string' && 
            (debugBody[key].includes('uploads/') || debugBody[key].includes('/'))) {
          debugBody[key] = '[FILE PATH]';
        } else if (typeof debugBody[key] === 'object' && debugBody[key] !== null) {
          Object.keys(debugBody[key]).forEach(subKey => {
            if (typeof debugBody[key][subKey] === 'string' && 
                (debugBody[key][subKey].includes('uploads/') || debugBody[key][subKey].includes('/'))) {
              debugBody[key][subKey] = '[FILE PATH]';
            }
          });
        }
      });
      
      console.log('Processed request body:', JSON.stringify(debugBody));
      
      next();
    });
  };
};

// Specific middlewares for common use cases
export const handleContractUploads = handleFileUploads([
  { name: 'contractFile', maxCount: 1 },
  { name: 'tenant[idImagePath]', maxCount: 1 }
]);

export const handleMaintenanceUploads = handleFileUploads([
  { name: 'invoiceFile', maxCount: 1 },
  { name: 'photos', maxCount: 5 }
]);

export const handleExpenseUploads = handleFileUploads([
  { name: 'invoiceFile', maxCount: 1 }
]);

export default upload; 