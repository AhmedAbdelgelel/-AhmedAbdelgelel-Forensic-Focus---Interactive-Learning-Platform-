const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const quizController = require('../controllers/quizController');

// Get all available quizzes
router.get('/available', protect, quizController.getAvailableQuizzes);

// Get quiz questions for a case
router.get('/:caseId/questions', protect, quizController.getQuestions);

// Submit quiz answers
router.post('/:caseId/submit', protect, quizController.submitAnswers);

// Get user progress
router.get('/progress', protect, quizController.getUserProgress);

module.exports = router;
