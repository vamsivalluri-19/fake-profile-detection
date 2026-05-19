const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const {
  createUser,
  findUserByEmail,
  hashPassword,
  signToken,
  verifyPassword,
} = require('../utils/storage');

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password } = req.body;
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const user = await createUser({ name, email, password: hashedPassword });
    const token = signToken(user);

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id.toString ? user._id.toString() : String(user._id),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatches = await verifyPassword(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString ? user._id.toString() : String(user._id),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { registerValidation, loginValidation, register, login };
