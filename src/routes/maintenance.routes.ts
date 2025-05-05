import express from 'express';
import {
  getMaintenanceRequests,
  getMaintenanceRequest,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
  uploadMaintenanceInvoice,
  getMaintenanceByApartment
} from '../controllers/maintenance.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { maintenanceValidation } from '../validations/maintenance.validation';

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
  .get(getMaintenanceRequests)
  .post(adminOnly, validate(maintenanceValidation.create), createMaintenanceRequest);

router.route('/:id')
  .get(getMaintenanceRequest)
  .put(adminOnly, validate(maintenanceValidation.update), updateMaintenanceRequest)
  .delete(adminOnly, deleteMaintenanceRequest);

router.route('/:id/upload')
  .put(adminOnly, uploadMaintenanceInvoice);

router.route('/apartment/:apartmentId')
  .get(getMaintenanceByApartment);

export default router; 