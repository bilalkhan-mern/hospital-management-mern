import { Router } from 'express';
import {
  deleteReport,
  getAllReports,
  getReportsByAppointment,
  getReportsByPatient,
  streamReportFile,
  uploadReport,
} from '../controllers/report.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';
import { handleReportUpload } from '../middleware/upload.middleware.js';
import { reportUploadSchema, validate } from '../validators/index.js';

const router = Router();

router.use(protect, authorize('admin', 'doctor', 'patient'));
router.post('/upload', authorize('doctor', 'patient'), handleReportUpload, validate(reportUploadSchema), uploadReport);
router.get('/', authorize('admin'), getAllReports);
router.get('/patient/:id', getReportsByPatient);
router.get('/appointment/:id', getReportsByAppointment);
router.get('/:id/file', streamReportFile);
router.delete('/:id', authorize('admin'), deleteReport);

export default router;
