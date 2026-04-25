import { Router } from 'express';
import { ping } from './ping.controller.js';

const router = Router();

router.get('/', ping);

export default router;

