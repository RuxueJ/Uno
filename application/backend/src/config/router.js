import userRouter from '@/routes/user';
import indexRouter from '@/routes/index';
import roomRoute from '@/routes/room';

export default function (app) {
  app.use('/api', indexRouter);
  app.use('/api/user', userRouter);
  app.use('/api/room', roomRoute);
}