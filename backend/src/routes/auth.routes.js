import { Router } from 'express';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerDoctor,
  registerPatient,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authSchemas, validate } from '../validators/index.js';

const router = Router();

router.post('/register', validate(authSchemas.register), registerPatient);
router.post('/register-doctor', validate(authSchemas.doctorRegister), registerDoctor);
router.post('/login', validate(authSchemas.login), loginUser);
router.get('/me', protect, getCurrentUser);
router.post('/logout', protect, logoutUser);

export default router;
