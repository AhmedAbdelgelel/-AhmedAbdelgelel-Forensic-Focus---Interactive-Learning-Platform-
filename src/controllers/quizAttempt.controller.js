const QuizAttempt = require('../models/quizAttempt.model');
const Quiz = require('../models/quiz.model');

// Start a quiz attempt
exports.startQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        
        // Find the quiz first using the id field
        const quiz = await Quiz.findOne({ id: quizId });
        console.log('Looking for quiz with id:', quizId);
        
        if (!quiz) {
            console.log('Quiz not found with id:', quizId);
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }
        
        console.log('Found quiz:', quiz.title);
        
        // Check for existing incomplete attempt
        const existingAttempt = await QuizAttempt.findOne({
            userId: req.user.id,
            quizId: quiz._id,
            completed: false
        });

        if (existingAttempt) {
            console.log('Found existing attempt:', existingAttempt._id);
            return res.status(200).json({
                success: true,
                message: "Continuing existing attempt",
                data: existingAttempt
            });
        }

        // Create new attempt
        const attempt = await QuizAttempt.create({
            userId: req.user.id,
            quizId: quiz._id,
            score: 0,
            completed: false,
            startedAt: new Date(),
            answers: []
        });

        console.log('Created new attempt:', attempt._id);

        res.status(201).json({
            success: true,
            message: "Quiz started successfully",
            data: attempt
        });
    } catch (error) {
        console.error('Error starting quiz:', error);
        res.status(500).json({
            success: false,
            message: 'Error starting quiz',
            error: error.message
        });
    }
};

// Submit answer for a question
exports.submitAnswer = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { questionId, answer } = req.body;

        // Find the latest incomplete attempt for this quiz
        const attempt = await QuizAttempt.findOne({
            userId: req.user.id,
            quizId: quizId,
            completed: false
        }).sort({ startedAt: -1 });

        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: 'No active quiz attempt found'
            });
        }

        // Check if question already answered
        if (attempt.answers.some(a => a.questionId === questionId)) {
            return res.status(400).json({
                success: false,
                message: 'Question already answered'
            });
        }

        // Get quiz from database
        const quiz = await Quiz.findById(attempt.quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        // Find the question in multiple choice questions
        const question = quiz.sections.questions.multiple_choice.questions.find(q => q.id === questionId);
        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        // Find the selected option and check if it's correct
        const selectedOption = question.options.find(opt => opt.id === answer);
        const isCorrect = selectedOption ? selectedOption.isCorrect : false;

        // Add answer to attempt
        attempt.answers.push({
            questionId,
            selectedAnswer: answer,
            isCorrect
        });

        // Update score
        attempt.score = attempt.answers.filter(a => a.isCorrect).length;

        // Check if all questions are answered
        const totalQuestions = quiz.sections.questions.multiple_choice.questions.length;
        if (attempt.answers.length === totalQuestions) {
            attempt.completed = true;
            attempt.completedAt = new Date();
            // Calculate percentage
            attempt.percentage = (attempt.score / totalQuestions) * 100;
        }

        await attempt.save();

        res.status(200).json({
            success: true,
            message: isCorrect ? 'Correct answer!' : 'Incorrect answer',
            data: {
                isCorrect,
                score: attempt.score,
                completed: attempt.completed,
                percentage: attempt.percentage
            }
        });
    } catch (error) {
        console.error('Error submitting answer:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting answer',
            error: error.message
        });
    }
};

// Get quiz attempt results
exports.getAttemptResults = async (req, res) => {
    try {
        const { quizId } = req.params;
        
        const attempt = await QuizAttempt.findOne({
            userId: req.user.id,
            quizId: quizId
        }).sort({ startedAt: -1 });

        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: 'Quiz attempt not found'
            });
        }

        res.json({
            success: true,
            data: attempt
        });
    } catch (error) {
        console.error('Error in getAttemptResults:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching attempt results'
        });
    }
};

// Get user's quiz history
exports.getUserAttempts = async (req, res) => {
    try {
        const attempts = await QuizAttempt.find({ 
            userId: req.user.id,
            completed: true
        })
        .lean()
        .sort('-completedAt');

        // Load quiz data from JSON file
        const quizData = require('../data/quiz-data.json');
        const quizMap = quizData.cases.reduce((map, quiz) => {
            map[quiz.id] = quiz;
            return map;
        }, {});

        const formattedAttempts = attempts.map(attempt => {
            const quiz = quizMap[attempt.quizId] || {};
            return {
                attemptId: attempt._id,
                quiz: {
                    id: attempt.quizId,
                    title: quiz.title || 'Unknown Quiz',
                    description: quiz.sections?.overview?.content || 'No description available'
                },
                score: attempt.score,
                percentage: attempt.percentage || Math.round((attempt.score / attempt.answers.length) * 100),
                totalQuestions: attempt.answers.length,
                correctAnswers: attempt.answers.filter(a => a.isCorrect).length,
                completedAt: attempt.completedAt,
                answers: attempt.answers.map(answer => ({
                    questionId: answer.questionId,
                    selectedAnswer: answer.selectedAnswer,
                    isCorrect: answer.isCorrect
                }))
            };
        });

        res.json({
            success: true,
            count: formattedAttempts.length,
            data: formattedAttempts
        });
    } catch (error) {
        console.error('Error in getUserAttempts:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching quiz attempts',
            error: error.message
        });
    }
};
