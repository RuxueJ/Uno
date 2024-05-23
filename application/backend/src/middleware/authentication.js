import db from '@/database';
import { tokenUtil } from '@/utils';

export default async function authenticate(req, res, next) {
  // Get authorization header from request
  const authorization = req.headers.authorization || '';

  // Firstly, set request user to null
  req.user = null;

  // Check for empty Authorization header
  if (!authorization) {
    return next();
  }

  // Make sure the token is bearer token
  if (!authorization.startsWith('Bearer ')) {
    return next();
  }

  // Extract token from header
  const token = authorization.substring(7);
  let tokenData;
  try {
    tokenData = tokenUtil.verifyToken(token);
  } catch (err) {
    return next({ status: 401, message: 'Invalid token' });
  }

  // Find user from database
  const user = await db.models.user.findByPk(tokenData.id).catch(() => null);

  // Check if user exists
  if (!user) {
    return next({ status: 401, message: 'There is no user' });
  }

  // Set request user
  req.user = user;

  // Go to next middleware
  return next();
}
