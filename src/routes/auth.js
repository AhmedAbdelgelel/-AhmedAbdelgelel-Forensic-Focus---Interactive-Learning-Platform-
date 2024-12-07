const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Validation middleware
const validateRegistration = [
  body('email')
    .isEmail()
    .custom(value => {
      if (!value.endsWith('mans.edu.eg')) {
        throw new Error('Email must be from mans.edu.eg domain');
      }
      return true;
    }),
  body('collegeId')
    .isLength({ min: 10, max: 10 })
    .isNumeric()
    .withMessage('College ID must be 10 digits'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', authController.login);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;
