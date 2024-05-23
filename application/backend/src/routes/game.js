import {Router} from 'express';
import * as gameController from '@/controllers/game';
import {authenticationMiddleware} from '@/middleware';

const router = Router();

router.get('/list/:roomId', authenticationMiddleware, gameController.getPlayerList);

export default router;