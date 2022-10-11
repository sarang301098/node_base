import { Router } from 'express';

import users from './users';
import auth from './auth';

const routes = Router();

routes.get('/', (req, res) => res.status(400).json({ message: 'Access not allowed' }));

routes.use('/users', users());
routes.use('/auth', auth());

export default (): Router => routes;
