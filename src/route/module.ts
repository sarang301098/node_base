import { Router } from 'express';

import { handleError, authenticate } from '../middleware';
import { getAll } from '../controller/Modules';

const router = Router();

const getAllModule = (): Router => router.get('/', authenticate, handleError(getAll()));

export default (): Router => router.use([getAllModule()]);
