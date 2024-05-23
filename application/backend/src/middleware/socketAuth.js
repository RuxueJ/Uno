import db from '@/database';
import { tokenUtil } from '@/utils';

const socketAuth = async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  let tokenData;
  try {
    tokenData = tokenUtil.verifyToken(token);
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }

  const user = await db.models.user.findByPk(tokenData.id).catch(() => null);

  if (!user) {
    return next(new Error('Authentication error: User not found'));
  }
  socket.user = user;
  next();
};

export default socketAuth;
