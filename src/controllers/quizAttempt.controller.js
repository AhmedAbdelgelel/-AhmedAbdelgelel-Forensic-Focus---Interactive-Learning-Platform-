const QuizAttempt = require('../models/quizAttempt.model');
const Quiz = require('../models/quiz.model');

// Start a quiz attempt
exports.startQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        
        // Check if quiz exists
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        // Create new attempt
        const attempt = await QuizAttempt.create({
            user: req.user.id,
            quiz: quizId,
            score: 0,
            answers: []
        });

        res.status(201).json({
            success: true,
            data: attempt
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error starting quiz'
        });
    }
};

// Submit answer for a question
exports.submitAnswer = async (req, res) => {
    try {
        const { attemptId } = req.params;
        const { questionId, answer } = req.body;

        const attempt = await QuizAttempt.findById(attemptId);
        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: 'Quiz attempt not found'
            });
        }

        // Verify user owns this attempt
        if (attempt.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // Get quiz and question
        const quiz = await Quiz.findById(attempt.quiz);
        const question = quiz.questions.id(questionId);

        // Check if answer is correct
        let isCorrect = false;
        if (question.type === 'multiple-choice') {
            const correctOption = question.options.find(opt => opt.isCorrect);
            isCorrect = answer === correctOption._id.toString();
        } else {
            // For text input, you might want to implement more sophisticated matching
            isCorrect = answer.toLowerCase() === question.correctAnswer.toLowerCase();
        }

        // Add answer to attempt
        attempt.answers.push({
            questionId,
            answer,
            isCorrect
        });

        // Update score
        attempt.score = (attempt.answers.filter(a => a.isCorrect).length / quiz.questions.length) * 100;

        // Check if all questions are answered
        if (attempt.answers.length === quiz.questions.length) {
            attempt.completed = true;
            attempt.completedAt = Date.now();
        }

        await attempt.save();

        res.json({
            success: true,
            data: attempt
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error submitting answer'
        });
    }
};

// Get quiz attempt results
exports.getAttemptResults = async (req, res) => {
    try {
        const attempt = await QuizAttempt.findById(req.params.attemptId)
            .populate('quiz', 'title questions')
            .populate('user', 'username');

        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: 'Quiz attempt not found'
            });
        }

        // Verify user owns this attempt
        if (attempt.user._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        res.json({
            success: true,
            data: attempt
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching attempt results'
        });
    }
};

// Get user's quiz history
exports.getUserAttempts = async (req, res) => {
    try {
        const attempts = await QuizAttempt.find({ user: req.user.id })
            .populate('quiz', 'title')
            .select('score completed startedAt completedAt');

        res.json({
            success: true,
            data: attempts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching quiz attempts'
        });
    }
};
