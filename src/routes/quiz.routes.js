const express = require('express');
const router = express.Router();
const {
    getQuizzes,
    getQuiz,
    getCase,
    startQuiz,
    submitAnswer,
    completeQuiz,
    getQuizHistory
} = require('../controllers/quiz.controller');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getQuizzes);
router.get('/case/:id', getCase);

// Protected routes
router.get('/history', protect, getQuizHistory);
router.post('/:quizId/start', protect, startQuiz);
router.post('/:quizId/submit', protect, submitAnswer);
router.post('/:quizId/complete', protect, completeQuiz);

// This should be last to avoid conflicts
router.get('/:id', getQuiz);

module.exports = router;
