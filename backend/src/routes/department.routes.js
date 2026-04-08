import { Router } from 'express';
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from '../controllers/department.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';
import { departmentSchema, validate } from '../validators/index.js';

const router = Router();

router.get('/', getDepartments);
router.post('/', protect, authorize('admin'), validate(departmentSchema), createDepartment);
router.put('/:id', protect, authorize('admin'), validate(departmentSchema), updateDepartment);
router.delete('/:id', protect, authorize('admin'), deleteDepartment);

export default router;
