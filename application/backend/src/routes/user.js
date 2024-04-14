import {Router} from 'express';

import * as authController from '@/controllers/user';
import * as authValidations from '@/routes/validations/user';
import { isAuthenticated, validate } from '@/middleware';

const router = Router();

router.post('/login', validate(authValidations.loginRules), authController.login);

router.post('/register', validate(authValidations.registerRules), authController.register);

router.route('/me').get(isAuthenticated, authController.getCurrentUser)

export default router;