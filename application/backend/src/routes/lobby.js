import {Router} from 'express';

import * as lobbyControllor from '@/controllers/lobby';

const router = Router();

router.get('/list', lobbyControllor.getLobbiesData);
router.post('/create', lobbyControllor.createLobby);
router.post('/join', lobbyControllor.joinLobby);


export default router;