const Case = require('../models/case.model');
const Progress = require('../models/progress.model');
const QuizAttempt = require('../models/quizAttempt.model');
const fs = require('fs').promises;
const path = require('path');
const Quiz = require('../models/quiz.model');

// Function to clear cases
const clearCases = async () => {
    await Case.deleteMany({});
};

// Initialize database with cases from JSON
const initializeCases = async () => {
    await clearCases();
    
    const dataPath = path.join(__dirname, '../data/quiz-data.json');
    const rawData = await fs.readFile(dataPath, 'utf8');
    const quizData = JSON.parse(rawData);
    await Case.insertMany(quizData.cases);
};

// Call initialization
initializeCases();

// Get all available cases and quizzes
exports.getQuizzes = async (req, res) => {
    const cases = await Case.find().select('id title sections.overview');
    
    let progress = [];
    if (req.user) {
        progress = await Progress.find({ userId: req.user._id });
    }

    const formattedCases = cases.map(c => ({
        id: c.id,
        title: c.title,
        type: 'case',
        overview: c.sections.overview,
        progress: progress.find(p => p.caseId === c.id) || null
    }));

    res.json({
        success: true,
        data: formattedCases
    });
};

// Start a new quiz attempt
exports.startQuiz = async (req, res) => {
    const { quizId } = req.params;
    const userId = req.user._id;

    const existingAttempt = await QuizAttempt.findOne({
        userId: userId,
        quizId: quizId,
        completed: false
    });

    if (existingAttempt) {
        return res.json({
            success: true,
            message: 'Continuing existing attempt',
            data: existingAttempt
        });
    }

    const newAttempt = await QuizAttempt.create({
        userId: userId,
        quizId: quizId,
        answers: [],
        score: 0,
        startedAt: new Date()
    });

    res.json({
        success: true,
        message: 'Quiz started successfully',
        data: newAttempt
    });
};

// Submit answer for quiz
exports.submitAnswer = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { questionId, answer } = req.body;
        const userId = req.user._id;

        // Find the active quiz attempt
        const attempt = await QuizAttempt.findOne({
            userId: userId,
            quizId: quizId,
            completed: false
        });

        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: 'No active quiz attempt found'
            });
        }

        // Load quiz data
        const dataPath = path.join(__dirname, '../data/quiz-data.json');
        const rawData = await fs.readFile(dataPath, 'utf8');
        const quizData = JSON.parse(rawData);

        // Find the case and question
        const currentCase = quizData.cases.find(c => c.id === quizId);
        if (!currentCase) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        const question = currentCase.sections.questions.multiple_choice.questions.find(q => q.id === questionId);
        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        // Check if the answer is correct
        const correctOption = question.options.find(opt => opt.isCorrect);
        const isCorrect = answer === correctOption.id;

        // Update the attempt with the new answer
        const existingAnswerIndex = attempt.answers.findIndex(
            a => a.questionId === questionId
        );

        if (existingAnswerIndex !== -1) {
            attempt.answers[existingAnswerIndex] = {
                questionId,
                selectedAnswer: answer,
                isCorrect
            };
        } else {
            attempt.answers.push({
                questionId,
                selectedAnswer: answer,
                isCorrect
            });
        }

        // Calculate and update score
        attempt.score = attempt.answers.filter(a => a.isCorrect).length;
        await attempt.save();

        res.json({
            success: true,
            message: isCorrect ? 'Correct answer!' : 'Incorrect answer',
            data: {
                isCorrect,
                score: attempt.score,
                attempt
            }
        });
    } catch (error) {
        console.error('Error in submitAnswer:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting answer'
        });
    }
};

// Complete quiz
exports.completeQuiz = async (req, res) => {
    const { quizId } = req.params;
    const userId = req.user._id;

    const attempt = await QuizAttempt.findOne({
        userId: userId,
        quizId: quizId,
        completed: false
    });

    if (!attempt) {
        return res.status(404).json({
            success: false,
            message: 'No active quiz attempt found'
        });
    }

    const correctAnswers = attempt.answers.filter(a => a.isCorrect).length;
    const totalQuestions = attempt.answers.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    attempt.score = score;
    attempt.completed = true;
    attempt.completedAt = new Date();
    await attempt.save();

    res.json({
        success: true,
        message: 'Quiz completed successfully',
        data: {
            score,
            totalQuestions,
            correctAnswers,
            timeTaken: Math.round((attempt.completedAt - attempt.startedAt) / 1000) // in seconds
        }
    });
};

// Get quiz history
exports.getQuizHistory = async (req, res) => {
    const formattedAttempts = await Quiz.find();
    res.json({
        success: true,
        data: formattedAttempts
    });
};

// Get single quiz
exports.getQuiz = async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
        return res.status(404).json({
            success: false,
            message: 'Quiz not found'
        });
    }

    res.json({
        success: true,
        data: quiz
    });
};

// Get case
exports.getCase = async (req, res) => {
    const caseData = await Case.findOne({ id: req.params.id });
    
    if (!caseData) {
        return res.status(404).json({
            success: false,
            message: 'Case not found'
        });
    }

    let progress = null;
    if (req.user) {
        progress = await Progress.findOne({
            userId: req.user._id,
            caseId: req.params.id
        });
    }

    res.json({
        success: true,
        data: {
            case: caseData,
            progress
        }
    });
};
