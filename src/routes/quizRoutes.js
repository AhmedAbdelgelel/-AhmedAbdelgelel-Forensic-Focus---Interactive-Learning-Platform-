const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getAvailableQuizzes,
    getQuestions,
    submitAnswers,
    getUserProgress
} = require('../controllers/quizController');

// Protected routes
router.use(protect);

// Get all available quizzes
router.get('/', getAvailableQuizzes);

// Get questions for a specific case
router.get('/:caseId/questions', getQuestions);

// Submit answers for a case
router.post('/:caseId/submit', submitAnswers);

// Get user progress
router.get('/progress', getUserProgress);

module.exports = router;
