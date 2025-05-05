import multer from 'multer';
import path from 'path';
import { Request } from 'express';

type DestinationType = 'contracts' | 'ids' | 'invoices';

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const destType: DestinationType = req.body.uploadType || 'contracts';
    cb(null, `uploads/${destType}`);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
  }
});

// Filter for file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const filetypes = /jpeg|jpg|png|pdf|doc|docx/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Invalid file format! Only JPEG, JPG, PNG, PDF, DOC, DOCX files are allowed!'));
  }
};

// Create upload object
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter
});

export default upload; 