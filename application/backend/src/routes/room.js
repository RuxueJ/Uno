import {Router} from 'express';
import * as roomControllor from '@/controllers/room';
import {authenticationMiddleware} from '@/middleware';

const router = Router();

router.get('/list', authenticationMiddleware, roomControllor.getRoomsData);
router.post('/create', authenticationMiddleware, roomControllor.createRoom);


export default router;