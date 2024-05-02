import userRouter from '@/routes/user';
import indexRouter from '@/routes/index';
import lobbyRoute from '@/routes/lobby';

export default function (app) {
  app.use('/api', indexRouter);
  app.use('/api/user', userRouter);
  app.use('/api/lobby', lobbyRoute);
}