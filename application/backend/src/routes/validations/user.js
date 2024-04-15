import { body } from 'express-validator';

export const loginRules = [
  body('email').isEmail().exists(),
  body('password').exists(),
];

export const registerRules = [
  body('userName').exists(),
  body('email').isEmail().exists(),
  body('password').isLength({ min: 6 }).exists(),
];
