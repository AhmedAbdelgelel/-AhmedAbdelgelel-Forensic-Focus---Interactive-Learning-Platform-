const User = require('../models/user.model');
const Quiz = require('../models/quiz.model');
const QuizAttempt = require('../models/quizAttempt.model');
const jwt = require('jsonwebtoken');

// Register user
const register = async (req, res) => {
    try {
        const { username, email, password, collegeId } = req.body;

        if (!username || !email || !password || !collegeId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { collegeId }] });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email ? 'Email already exists' : 'College ID already exists'
            });
        }

        const user = await User.create({
            username,
            email,
            password,
            collegeId
        });

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            success: true,
            token,
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                collegeId: user.collegeId
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or college ID already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error registering user'
        });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(200).json({
            success: true,
            token,
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                collegeId: user.collegeId
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error logging in'
        });
    }
};

// Logout user
const logout = async (req, res) => {
    try {
        // Since we're using JWT, we just need to tell the client to remove the token
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error logging out'
        });
    }
};

// Get available quizzes
const getQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find().select('title description');
        res.status(200).json({
            success: true,
            data: quizzes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching quizzes'
        });
    }
};

// Start a quiz
const startQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        const existingAttempt = await QuizAttempt.findOne({
            userId: req.user.id,
            quizId: quiz._id,
            completed: false
        });

        if (existingAttempt) {
            return res.status(400).json({
                success: false,
                message: 'You have an incomplete attempt for this quiz'
            });
        }

        const attempt = await QuizAttempt.create({
            userId: req.user.id,
            quizId: quiz._id,
            startedAt: Date.now()
        });

        res.status(200).json({
            success: true,
            data: {
                attemptId: attempt._id,
                quiz: {
                    title: quiz.title,
                    description: quiz.description,
                    questions: quiz.questions.map(q => ({
                        id: q._id,
                        question: q.question,
                        options: q.options
                    }))
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error starting quiz'
        });
    }
};

// Submit quiz
const submitQuiz = async (req, res) => {
    try {
        const { answers } = req.body;
        const quiz = await Quiz.findById(req.params.quizId);
        
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        const attempt = await QuizAttempt.findOne({
            userId: req.user.id,
            quizId: quiz._id,
            completed: false
        });

        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: 'No active quiz attempt found'
            });
        }

        let score = 0;
        const processedAnswers = answers.map(answer => {
            const question = quiz.questions.id(answer.questionId);
            const isCorrect = question.correctAnswer === answer.selectedAnswer;
            if (isCorrect) score++;
            return {
                questionId: answer.questionId,
                selectedAnswer: answer.selectedAnswer,
                isCorrect
            };
        });

        attempt.answers = processedAnswers;
        attempt.score = score;
        attempt.percentage = (score / quiz.questions.length) * 100;
        attempt.completed = true;
        attempt.completedAt = Date.now();
        await attempt.save();

        res.status(200).json({
            success: true,
            data: {
                score,
                totalQuestions: quiz.questions.length,
                percentage: attempt.percentage,
                answers: processedAnswers
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error submitting quiz'
        });
    }
};

// Get user's grades
const getGrades = async (req, res) => {
    try {
        const attempts = await QuizAttempt.find({ 
            userId: req.user.id,
            completed: true 
        })
        .populate('quizId', 'id title sections.overview.content')
        .sort('-completedAt');

        const grades = attempts.map(attempt => ({
            quizId: attempt.quizId.id,
            quizTitle: attempt.quizId.title,
            quizDescription: attempt.quizId.sections.overview.content,
            score: attempt.score,
            percentage: attempt.percentage,
            totalQuestions: attempt.answers.length,
            correctAnswers: attempt.answers.filter(a => a.isCorrect).length,
            completedAt: attempt.completedAt,
            answers: attempt.answers.map(answer => ({
                questionId: answer.questionId,
                selectedAnswer: answer.selectedAnswer,
                isCorrect: answer.isCorrect
            }))
        }));

        res.status(200).json({
            success: true,
            data: grades
        });
    } catch (error) {
        console.error('Error in getGrades:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching grades',
            error: error.message
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    getQuizzes,
    startQuiz,
    submitQuiz,
    getGrades
};
