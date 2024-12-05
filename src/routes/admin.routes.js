const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/admin');
const {
    register,
    login,
    logout,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    getAllQuizAttempts,
    getAllUsersGrades,
    getUserGrades
} = require('../controllers/admin.controller');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Create protected router
const protectedRouter = express.Router();
protectedRouter.use(protect);

// Quiz management routes
protectedRouter.post('/quizzes', createQuiz);
protectedRouter.put('/quizzes/:id', updateQuiz);
protectedRouter.delete('/quizzes/:id', deleteQuiz);

// Quiz attempts and grades routes
protectedRouter.get('/quiz-attempts', getAllQuizAttempts);
protectedRouter.get('/grades', getAllUsersGrades);
protectedRouter.get('/grades/:userId', getUserGrades);

router.use('/', protectedRouter);

module.exports = router;
