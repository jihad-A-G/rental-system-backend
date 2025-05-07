import express from 'express';
import {
  getContracts,
  getContract,
  createContract,
  updateContract,
  deleteContract,
  uploadContractFile,
  uploadTenantIdImage
} from '../controllers/contract.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { contractValidation } from '../validations/contract.validation';
import { handleContractUploads } from '../middleware/upload.middleware';

const router = express.Router();

// Protect all routes
router.use(protect);

// Use the contract upload middleware before createContract
router.route('/')
  .get(getContracts)
  .post(adminOnly, handleContractUploads, createContract);

// The main update endpoint now handles file uploads as well
// You can include contractFile and tenant[idImagePath] in the form data
router.route('/:id')
  .get(getContract)
  .put(adminOnly, handleContractUploads, validate(contractValidation.update), updateContract)
  .delete(adminOnly, deleteContract);

// Legacy endpoints - keep for backward compatibility
// New code should use the main /:id endpoint with file uploads
router.route('/:id/upload')
  .put(adminOnly, handleContractUploads, uploadContractFile);

router.route('/:id/upload-tenant-id')
  .put(adminOnly, handleContractUploads, uploadTenantIdImage);

export default router; 