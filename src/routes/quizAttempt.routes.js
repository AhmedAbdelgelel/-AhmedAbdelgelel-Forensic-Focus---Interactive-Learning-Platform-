const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const quizAttemptController = require('../controllers/quizAttempt.controller');
const auth = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

// Validation schemas
const answerValidation = [
    body('questionId').isMongoId().withMessage('Invalid question ID'),
    body('answer').notEmpty().withMessage('Answer is required')
];

// Routes
router.post('/quiz/:quizId/start', auth, quizAttemptController.startQuiz);
router.post('/attempt/:attemptId/submit', auth, answerValidation, validate, quizAttemptController.submitAnswer);
router.get('/attempt/:attemptId', auth, quizAttemptController.getAttemptResults);
router.get('/history', auth, quizAttemptController.getUserAttempts);

module.exports = router;
