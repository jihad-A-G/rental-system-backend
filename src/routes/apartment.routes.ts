import express from 'express';
import {
  getApartments,
  getApartment,
  createApartment,
  updateApartment,
  deleteApartment
} from '../controllers/apartment.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { apartmentValidation } from '../validations/apartment.validation';

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
  .get(getApartments)
  .post(adminOnly, validate(apartmentValidation.create), createApartment);

router.route('/:id')
  .get(getApartment)
  .put(adminOnly, validate(apartmentValidation.update), updateApartment)
  .delete(adminOnly, deleteApartment);

export default router; 