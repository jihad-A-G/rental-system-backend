import express from 'express';
import { login, getMe, register } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { authValidation } from '../validations/auth.validation';

const router = express.Router();

// Routes
router.post('/register', validate(authValidation.register), register);
router.post('/login', validate(authValidation.login), login);
router.get('/me', protect, getMe);

export default router; 