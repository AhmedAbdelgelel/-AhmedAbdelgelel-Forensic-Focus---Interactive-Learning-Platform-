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
        // First get all quizzes to map their IDs
        const quizzes = await Quiz.find().lean();
        const quizIdMap = quizzes.reduce((map, quiz) => {
            map[quiz.id] = quiz;
            return map;
        }, {});

        const attempts = await QuizAttempt.find()
            .populate('userId', 'username email collegeId')
            .lean();

        const formattedAttempts = attempts.map(attempt => {
            const quiz = quizIdMap[attempt.quizId] || {};
            return {
                id: attempt._id,
                username: attempt.userId?.username || 'Unknown User',
                email: attempt.userId?.email || 'No Email',
                collegeId: attempt.userId?.collegeId || 'No ID',
                quizId: attempt.quizId,
                quizTitle: quiz.title || 'Unknown Quiz',
                score: attempt.score || 0,
                percentage: attempt.percentage || 0,
                completed: attempt.completed || false,
                startedAt: attempt.startedAt,
                completedAt: attempt.completedAt,
                answers: attempt.answers || []
            };
        });

        res.status(200).json({
            success: true,
            count: formattedAttempts.length,
            data: formattedAttempts
        });
    } catch (error) {
        console.error('Error in getAllQuizAttempts:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching quiz attempts',
            error: error.message
        });
    }
};

// Get all users' grades
const getAllUsersGrades = async (req, res) => {
    try {
        // First get all quizzes to map their IDs
        const quizzes = await Quiz.find().lean();
        const quizIdMap = quizzes.reduce((map, quiz) => {
            map[quiz.id] = quiz;
            return map;
        }, {});

        const users = await User.find().select('username email collegeId').lean();
        const grades = await Promise.all(
            users.map(async (user) => {
                const attempts = await QuizAttempt.find({ 
                    userId: user._id,
                    completed: true 
                }).lean();

                return {
                    username: user.username,
                    email: user.email,
                    collegeId: user.collegeId,
                    attempts: attempts.map(attempt => {
                        const quiz = quizIdMap[attempt.quizId] || {};
                        return {
                            quizId: attempt.quizId,
                            quizTitle: quiz.title || 'Unknown Quiz',
                            quizDescription: quiz.sections?.overview?.content || 'No description available',
                            score: attempt.score || 0,
                            percentage: attempt.percentage || 0,
                            completedAt: attempt.completedAt,
                            answers: attempt.answers || []
                        };
                    })
                };
            })
        );

        res.status(200).json({
            success: true,
            count: grades.length,
            data: grades
        });
    } catch (error) {
        console.error('Error in getAllUsersGrades:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user grades',
            error: error.message
        });
    }
};

// Get specific user's grades
const getUserGrades = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get quiz data from JSON file
        const quizData = require('../data/quiz-data.json');
        const quizMap = quizData.cases.reduce((map, quiz) => {
            map[quiz.id] = quiz;
            return map;
        }, {});

        // Get all attempts for this user
        const attempts = await QuizAttempt.find({
            userId: userId
        }).lean();

        const formattedAttempts = attempts.map(attempt => {
            const quiz = quizMap[attempt.quizId] || {};
            return {
                id: attempt._id,
                quizId: attempt.quizId,
                quizTitle: quiz.title || 'Unknown Quiz',
                quizDescription: quiz.sections?.overview?.content || 'No description available',
                score: attempt.score || 0,
                percentage: attempt.percentage || 0,
                completed: attempt.completed || false,
                startedAt: attempt.startedAt,
                completedAt: attempt.completedAt,
                answers: attempt.answers.map(ans => ({
                    questionId: ans.questionId,
                    selectedAnswer: ans.selectedAnswer,
                    isCorrect: ans.isCorrect
                }))
            };
        });

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    collegeId: user.collegeId
                },
                attempts: formattedAttempts
            }
        });

    } catch (error) {
        console.error('Error in getUserGrades:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user grades',
            error: error.message
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
