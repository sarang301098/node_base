import { Router } from 'express';

import { handleError } from '../middleware';
import { webhook } from '../controller/webhook';

const router = Router();

const postWebhook = (): Router => router.post('/', handleError(webhook()));

export default (): Router => router.use([postWebhook()]);
