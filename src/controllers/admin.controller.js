const Admin = require('../models/admin.model');
const User = require('../models/user.model');
const Quiz = require('../models/quiz.model');
const QuizAttempt = require('../models/quizAttempt.model');
const jwt = require('jsonwebtoken');

// Register admin
const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        const admin = await Admin.create({
            username,
            email,
            password
        });

        const token = jwt.sign(
            { id: admin._id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            success: true,
            token,
            data: {
                id: admin._id,
                username: admin.username,
                email: admin.email
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Admin with this email already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error registering admin'
        });
    }
};

// Login admin
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const admin = await Admin.findOne({ email }).select('+password');
        if (!admin || !(await admin.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = jwt.sign(
            { id: admin._id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(200).json({
            success: true,
            token,
            data: {
                id: admin._id,
                username: admin.username,
                email: admin.email
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error logging in'
        });
    }
};

// Logout admin
const logout = async (req, res) => {
    try {
        // Since we're using JWT, we just need to tell the client to remove the token
        res.status(200).json({
            success: true,
            message: 'Admin logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error logging out'
        });
    }
};

// Create quiz
const createQuiz = async (req, res) => {
    try {
        const { title, description, questions } = req.body;

        if (!title || !description || !questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields in the correct format'
            });
        }

        const quiz = await Quiz.create({
            title,
            description,
            questions,
            createdBy: req.admin.id
        });

        res.status(201).json({
            success: true,
            data: quiz
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating quiz'
        });
    }
};

// Update quiz
const updateQuiz = async (req, res) => {
    try {
        const { title, description, questions } = req.body;
        const quiz = await Quiz.findById(req.params.quizId);

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        if (quiz.createdBy.toString() !== req.admin.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this quiz'
            });
        }

        const updatedQuiz = await Quiz.findByIdAndUpdate(
            req.params.quizId,
            { title, description, questions },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedQuiz
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating quiz'
        });
    }
};

// Delete quiz
const deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.quizId);

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        if (quiz.createdBy.toString() !== req.admin.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this quiz'
            });
        }

        await Quiz.deleteOne({ _id: req.params.quizId });
        await QuizAttempt.deleteMany({ quizId: req.params.quizId });

        res.status(200).json({
            success: true,
            message: 'Quiz deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting quiz'
        });
    }
};

// Get all quiz attempts
const getAllQuizAttempts = async (req, res) => {
    try {
        const attempts = await QuizAttempt.find({ completed: true })
            .populate('userId', 'username email collegeId')
            .populate('quizId', 'title description')
            .select('userId quizId score percentage completedAt')
            .sort('-completedAt');

        const formattedAttempts = attempts.map(attempt => ({
            username: attempt.userId.username,
            email: attempt.userId.email,
            collegeId: attempt.userId.collegeId,
            quizTitle: attempt.quizId.title,
            quizDescription: attempt.quizId.description,
            score: attempt.score,
            percentage: attempt.percentage,
            completedAt: attempt.completedAt
        }));

        res.status(200).json({
            success: true,
            data: formattedAttempts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching quiz attempts'
        });
    }
};

// Get all users' grades
const getAllUsersGrades = async (req, res) => {
    try {
        const users = await User.find().select('username email collegeId');
        const grades = await Promise.all(
            users.map(async (user) => {
                const attempts = await QuizAttempt.find({ 
                    userId: user._id,
                    completed: true 
                })
                .populate('quizId', 'title description')
                .select('quizId score percentage completedAt')
                .sort('-completedAt');

                return {
                    username: user.username,
                    email: user.email,
                    collegeId: user.collegeId,
                    attempts: attempts.map(attempt => ({
                        quizTitle: attempt.quizId.title,
                        quizDescription: attempt.quizId.description,
                        score: attempt.score,
                        percentage: attempt.percentage,
                        completedAt: attempt.completedAt
                    }))
                };
            })
        );

        res.status(200).json({
            success: true,
            data: grades
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user grades'
        });
    }
};

// Get specific user's grades
const getUserGrades = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('username email collegeId');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const attempts = await QuizAttempt.find({ 
            userId: user._id,
            completed: true 
        })
        .populate('quizId', 'title description')
        .select('quizId score percentage completedAt')
        .sort('-completedAt');

        const grades = {
            username: user.username,
            email: user.email,
            collegeId: user.collegeId,
            attempts: attempts.map(attempt => ({
                quizTitle: attempt.quizId.title,
                quizDescription: attempt.quizId.description,
                score: attempt.score,
                percentage: attempt.percentage,
                completedAt: attempt.completedAt
            }))
        };

        res.status(200).json({
            success: true,
            data: grades
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user grades'
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    getAllQuizAttempts,
    getAllUsersGrades,
    getUserGrades
};
