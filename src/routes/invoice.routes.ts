import express from 'express';
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoicesByApartment
} from '../controllers/invoice.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { invoiceValidation } from '../validations/invoice.validation';

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
  .get(getInvoices)
  .post(adminOnly, validate(invoiceValidation.create), createInvoice);

router.route('/:id')
  .get(getInvoice)
  .put(adminOnly, validate(invoiceValidation.update), updateInvoice)
  .delete(adminOnly, deleteInvoice);

router.route('/apartment/:apartmentId')
  .get(getInvoicesByApartment);

export default router; 