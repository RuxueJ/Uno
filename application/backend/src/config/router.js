import userRouter from '@/routes/user';
import indexRouter from '@/routes/index';
import roomRoute from '@/routes/room';
import gameRouter from '@/routes/game';

export default function (app) {
  app.use('/api', indexRouter);
  app.use('/api/user', userRouter);
  app.use('/api/room', roomRoute);
  app.use('/api/game', gameRouter)
}