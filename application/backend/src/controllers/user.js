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
    const response = {
      "message": 'Success',
      "token": token, 
      "expiresIn": "1h",
      "data": {
        "userId": user.userId,
        "userName": user.userName,
        "email": user.email
      }
    }

    return res.status(200).json({ ...response });
  } catch (err) {
    console.error(err);  
    return res.status(500).json({ "message": "Internal server error" });
  }
};

/**
 * POST /user/register
 * Register request
 */
export const register = async (req, res, next) => {
  try {
    // Check if user already exists
    const existingUser = await db.models.user.findOne({
      where: { email: req.body.email }
    });

    if (existingUser) {
      return res.status(400).json({ "message": "User already exists" });
    }
    // Create user
    const user = await db.models.user
      .create(req.body, {
        fields: ['userName', 'email', 'password'],
      });

    // Generate and return tokens
    return res.status(200).json({ "message": "Success" });
  } catch (err) {
    console.error(err);  
    return res.status(500).json({ "message": "Internal server error" });
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
