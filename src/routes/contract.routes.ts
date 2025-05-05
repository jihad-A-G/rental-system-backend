import express from 'express';
import {
  getContracts,
  getContract,
  createContract,
  updateContract,
  deleteContract,
  uploadContractFile
} from '../controllers/contract.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { contractValidation } from '../validations/contract.validation';

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
  .get(getContracts)
  .post(adminOnly, validate(contractValidation.create), createContract);

router.route('/:id')
  .get(getContract)
  .put(adminOnly, validate(contractValidation.update), updateContract)
  .delete(adminOnly, deleteContract);

router.route('/:id/upload')
  .put(adminOnly, uploadContractFile);

export default router; 