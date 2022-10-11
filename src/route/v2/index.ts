import { Router } from 'express';

import contactUs from './contactUs';

const routes = Router();

routes.get('/', (req, res) => res.status(400).json({ message: 'Access not allowed' }));

routes.use('/contactUs', contactUs());

export default (): Router => routes;
