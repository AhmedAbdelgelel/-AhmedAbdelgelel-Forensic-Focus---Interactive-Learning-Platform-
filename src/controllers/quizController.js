const fs = require('fs').promises;
const path = require('path');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { calculateScore } = require('../utils/scoreCalculator');

// Helper function to read cases data
const readCasesData = async () => {
    try {
        const casesData = await fs.readFile(
            path.join(__dirname, '../data/cases.json'),
            'utf8'
        );
        return JSON.parse(casesData);
    } catch (error) {
        throw new AppError('Error reading cases data', 500);
    }
};

// Get available quizzes
exports.getAvailableQuizzes = async (req, res, next) => {
    try {
        const casesData = await readCasesData();

        const quizzes = casesData.cases.map(caseItem => ({
            id: caseItem.case_id,
            title: caseItem.title || caseItem.overview.split('.')[0],
            description: caseItem.description || caseItem.overview,
            totalQuestions: caseItem.questions?.multiple_choice?.length || 0
        }));

        res.json({
            status: 'success',
            data: {
                quizzes
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get questions for a specific case
exports.getQuestions = async (req, res, next) => {
    try {
        const casesData = await readCasesData();
        const caseId = parseInt(req.params.caseId);

        const caseItem = casesData.cases.find(c => c.case_id === caseId);
        
        if (!caseItem) {
            throw new AppError('Case not found', 404);
        }

        // Get questions from the case
        const questions = caseItem.questions?.multiple_choice?.map(q => ({
            id: q.id || Math.random().toString(36).substr(2, 9),
            question: q.question,
            options: q.options
        })) || [];

        res.json({
            status: 'success',
            data: {
                case_id: caseId,
                title: caseItem.title || caseItem.overview.split('.')[0],
                questions
            }
        });
    } catch (error) {
        next(error);
    }
};

// Submit answers
exports.submitAnswers = async (req, res, next) => {
    try {
        const { answers } = req.body;
        const caseId = parseInt(req.params.caseId);

        if (!answers || !Array.isArray(answers)) {
            throw new AppError('Please provide an array of answers', 400);
        }

        const casesData = await readCasesData();
        const caseItem = casesData.cases.find(c => c.case_id === caseId);

        if (!caseItem) {
            throw new AppError('Case not found', 404);
        }

        // Calculate score
        const correctAnswers = caseItem.questions.multiple_choice.map(q => q.correct_answer.charAt(0));
        const score = calculateScore(answers.map(a => a.charAt(0)), correctAnswers);

        // First, clean up any invalid progress entries
        await User.updateOne(
            { _id: req.user.userId },
            { $pull: { progress: { case_id: { $exists: false } } } }
        );

        // Get the user
        const user = await User.findById(req.user.userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Find existing progress or create new one
        const progressIndex = user.progress.findIndex(p => p.case_id === caseId);
        if (progressIndex === -1) {
            // Create new progress
            user.progress.push({
                case_id: caseId,
                quiz_score: score,
                completed: true,
                lastAttempt: new Date()
            });
        } else {
            // Update existing progress
            user.progress[progressIndex].quiz_score = score;
            user.progress[progressIndex].completed = true;
            user.progress[progressIndex].lastAttempt = new Date();
        }

        await user.save();

        res.json({
            status: 'success',
            data: {
                score,
                total_questions: correctAnswers.length,
                message: `You scored ${score} out of ${correctAnswers.length}`
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get user progress
exports.getUserProgress = async (req, res, next) => {
    try {
        // Clean up any invalid progress entries first
        await User.updateOne(
            { _id: req.user.userId },
            { $pull: { progress: { case_id: { $exists: false } } } }
        );

        const user = await User.findById(req.user.userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.json({
            status: 'success',
            data: {
                progress: user.progress
            }
        });
    } catch (error) {
        next(error);
    }
};
