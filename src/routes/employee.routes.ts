import express from 'express';
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeSalaries,
  createSalary,
  getAllSalaries,
  updateSalary
} from '../controllers/employee.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { employeeValidation, salaryValidation } from '../validations/employee.validation';

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(adminOnly); // Only admins can access employee data

// Employee routes
router.route('/')
  .get(getEmployees)
  .post(validate(employeeValidation.create), createEmployee);

router.route('/:id')
  .get(getEmployee)
  .put(validate(employeeValidation.update), updateEmployee)
  .delete(deleteEmployee);

// Salary routes for specific employee
router.route('/:id/salaries')
  .get(getEmployeeSalaries)
  .post(validate(salaryValidation.create), createSalary);

// General salary routes
router.route('/salaries')
  .get(getAllSalaries);

router.route('/salaries/:id')
  .put(validate(salaryValidation.update), updateSalary);

export default router; 