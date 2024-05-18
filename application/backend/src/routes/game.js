import {Router} from 'express';
import * as gameController from '@/controllers/game';

const router = Router();

router.get('/list/:roomId', gameController.getPlayerList);

export default router;