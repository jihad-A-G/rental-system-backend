import express from 'express';
import {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentsByInvoice
} from '../controllers/payment.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { paymentValidation } from '../validations/payment.validation';

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
  .get(getPayments)
  .post(adminOnly, validate(paymentValidation.create), createPayment);

router.route('/:id')
  .get(getPayment)
  .put(adminOnly, validate(paymentValidation.update), updatePayment)
  .delete(adminOnly, deletePayment);

router.route('/invoice/:invoiceId')
  .get(getPaymentsByInvoice);

export default router; 