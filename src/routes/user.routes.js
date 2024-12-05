const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    register,
    login,
    logout,
    getQuizzes,
    startQuiz,
    submitQuiz,
    getGrades
} = require('../controllers/user.controller');
const { getUserAttempts } = require('../controllers/quizAttempt.controller');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Create protected router
const protectedRouter = express.Router();
protectedRouter.use(protect);

// Quiz routes
protectedRouter.get('/quizzes', getQuizzes);
protectedRouter.post('/quizzes/:id/start', startQuiz);
protectedRouter.post('/quizzes/:id/submit', submitQuiz);

// Grade routes
protectedRouter.get('/grades', getGrades);
protectedRouter.get('/attempts', getUserAttempts);

// Use protected routes
router.use('/', protectedRouter);

module.exports = router;
