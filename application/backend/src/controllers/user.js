import createError from 'http-errors';

import db from '@/database';

/**
 * POST /user/login
 * Login request
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email address
    const user = await db.models.user.findOne({ where: { email } });
    console.log(user);
    if (!user) {
      return next(createError(400, 'There is no user with this email address!'));
    }

    // Check user password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return next(createError(400, 'Incorrect password!'));
    }

    // Generate and return token
    const token = user.generateToken();
    const refreshToken = user.generateToken('2h');
    return res.status(200).json({ token, refreshToken });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /user/register
 * Register request
 */
export const register = async (req, res, next) => {
  try {
    // Create user
    const user = await db.models.user
      .create(req.body, {
        fields: ['userName', 'email', 'password'],
      });

    // Generate and return tokens
    const token = user.generateToken();
    const refreshToken = user.generateToken('2h');
    res.status(201).json({ token, refreshToken });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /user/me
 * Get current user
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    delete req.user.dataValues.password;
    res.json(req.user);
  } catch (err) {
    next(err);
  }
};
