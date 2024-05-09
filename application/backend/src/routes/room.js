import {Router} from 'express';

import * as roomControllor from '@/controllers/room';

const router = Router();

router.get('/list', roomControllor.getRoomsData);
router.post('/create', roomControllor.createRoom);


export default router;