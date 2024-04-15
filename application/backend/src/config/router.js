import userRouter from '@/routes/user';
import indexRouter from '@/routes/index';

export default function (app) {
  app.use('/api', indexRouter);
  app.use('/api/user', userRouter);
}