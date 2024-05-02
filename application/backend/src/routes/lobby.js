import {Router} from 'express';

import * as lobbyControllor from '@/controllers/lobby';

const router = Router();

router.get('/list', lobbyControllor.getLobbiesData);
router.post('/create', lobbyControllor.createLobby);


export default router;