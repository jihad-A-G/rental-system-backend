import express from 'express';
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  uploadExpenseInvoice,
  getExpensesByCategory,
  getExpensesByApartment
} from '../controllers/expense.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { expenseValidation } from '../validations/expense.validation';

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
  .get(getExpenses)
  .post(adminOnly, validate(expenseValidation.create), createExpense);

router.route('/:id')
  .get(getExpense)
  .put(adminOnly, validate(expenseValidation.update), updateExpense)
  .delete(adminOnly, deleteExpense);

router.route('/:id/upload')
  .put(adminOnly, uploadExpenseInvoice);

router.route('/category/:category')
  .get(getExpensesByCategory);

router.route('/apartment/:apartmentId')
  .get(getExpensesByApartment);

export default router; 