const fs = require('fs').promises;
const path = require('path');
const User = require('../models/User');
const Case = require('../models/Case');
const Progress = require('../models/Progress');
const AppError = require('../utils/AppError');
const { calculateSectionScore } = require('../utils/scoreCalculator');

// Get all cases
exports.getAllCases = async (req, res) => {
    try {
        const cases = await Case.find().select('title description difficulty');
        res.json(cases);
    } catch (error) {
        console.error('Error in getAllCases:', error);
        res.status(500).json({ message: 'Error fetching cases' });
    }
};

// Get case details
exports.getCaseDetails = async (req, res) => {
    try {
        const caseItem = await Case.findById(req.params.caseId);
        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }
        res.json(caseItem);
    } catch (error) {
        console.error('Error in getCaseDetails:', error);
        res.status(500).json({ message: 'Error fetching case details' });
    }
};

// Get case evidence
exports.getCaseEvidence = async (req, res) => {
    try {
        const caseItem = await Case.findById(req.params.caseId).select('evidence');
        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }
        res.json(caseItem.evidence);
    } catch (error) {
        console.error('Error in getCaseEvidence:', error);
        res.status(500).json({ message: 'Error fetching evidence' });
    }
};

// Submit evidence analysis answers
exports.submitEvidenceAnalysis = async (req, res) => {
    try {
        const { answers } = req.body;
        const caseItem = await Case.findById(req.params.caseId);
        
        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }

        // Calculate score
        let score = 0;
        let feedback = [];
        
        answers.forEach((answer, index) => {
            const question = caseItem.evidenceAnalysisQuestions[index];
            if (!question) return;
            
            const correctOption = question.options.find(opt => opt.isCorrect);
            const isCorrect = answer === correctOption.text;
            
            if (isCorrect) score++;
            
            feedback.push({
                question: question.question,
                yourAnswer: answer,
                correct: isCorrect,
                explanation: correctOption.explanation
            });
        });

        const totalScore = (score / caseItem.evidenceAnalysisQuestions.length) * 100;

        res.json({
            score: totalScore,
            feedback
        });
    } catch (error) {
        console.error('Error in submitEvidenceAnalysis:', error);
        res.status(500).json({ message: 'Error submitting evidence analysis' });
    }
};

// Submit critical thinking answers
exports.submitCriticalThinking = async (req, res) => {
    try {
        const { answers } = req.body;
        const caseItem = await Case.findById(req.params.caseId);
        
        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }

        // Calculate score based on rubric
        let feedback = answers.map((answer, index) => {
            const question = caseItem.criticalThinkingQuestions[index];
            if (!question) return null;
            
            // Simple scoring based on word count and key terms
            const wordCount = answer.split(/\s+/).length;
            const score = Math.min(
                question.maxScore,
                Math.ceil(wordCount / 50) // 1 point per 50 words, up to maxScore
            );
            
            return {
                question: question.question,
                score,
                maxScore: question.maxScore,
                feedback: `Your answer scored ${score} out of ${question.maxScore} points based on length and content.`
            };
        }).filter(Boolean);

        const totalScore = feedback.reduce((sum, item) => sum + item.score, 0);
        const maxPossibleScore = feedback.reduce((sum, item) => sum + item.maxScore, 0);
        const percentageScore = (totalScore / maxPossibleScore) * 100;

        res.json({
            score: percentageScore,
            feedback
        });
    } catch (error) {
        console.error('Error in submitCriticalThinking:', error);
        res.status(500).json({ message: 'Error submitting critical thinking answers' });
    }
};

// Get case progress
exports.getCaseProgress = async (req, res) => {
    try {
        const cases = await Case.find().select('title difficulty');
        res.json(cases.map(c => ({
            id: c._id,
            title: c.title,
            difficulty: c.difficulty,
            completed: false // TODO: Implement progress tracking
        })));
    } catch (error) {
        console.error('Error in getCaseProgress:', error);
        res.status(500).json({ message: 'Error fetching progress' });
    }
};

// Get case details with all sections
exports.getCaseDetailsWithSections = async (req, res, next) => {
    try {
        const caseId = req.params.caseId;
        const forensicCase = await Case.findById(caseId);
        
        if (!forensicCase) {
            return next(new AppError('Case not found', 404));
        }

        // Get user's progress for this case
        const progress = await Progress.findOne({
            userId: req.user._id,
            caseId: caseId
        });

        res.status(200).json({
            status: 'success',
            data: {
                case: forensicCase,
                progress: progress || null
            }
        });
    } catch (error) {
        next(error);
    }
};

// Submit evidence analysis answers
exports.submitEvidenceAnalysisWithProgress = async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const { answers } = req.body;
        
        const forensicCase = await Case.findById(caseId);
        if (!forensicCase) {
            return next(new AppError('Case not found', 404));
        }

        // Validate answers
        if (!Array.isArray(answers)) {
            return next(new AppError('Answers must be provided as an array', 400));
        }

        // Calculate score
        let correctAnswers = 0;
        const detailedResults = answers.map((answer, index) => {
            const question = forensicCase.evidenceAnalysisQuestions[index];
            const isCorrect = question.options.find(opt => 
                opt.text === answer && opt.isCorrect
            );
            
            if (isCorrect) correctAnswers++;
            
            return {
                question: question.question,
                userAnswer: answer,
                isCorrect: !!isCorrect,
                explanation: question.options.find(opt => opt.isCorrect).explanation
            };
        });

        const score = (correctAnswers / forensicCase.evidenceAnalysisQuestions.length) * 100;

        // Update progress
        let progress = await Progress.findOne({ userId: req.user._id, caseId });
        if (!progress) {
            progress = new Progress({
                userId: req.user._id,
                caseId,
                caseTitle: forensicCase.title
            });
        }

        progress.sections.evidenceAnalysis = {
            completed: true,
            score,
            answers: detailedResults
        };

        // Update overall progress
        progress.score = calculateSectionScore(progress.sections);
        progress.completed = progress.score === 100;
        
        await progress.save();

        res.status(200).json({
            status: 'success',
            data: {
                score,
                totalQuestions: forensicCase.evidenceAnalysisQuestions.length,
                correctAnswers,
                detailedResults
            }
        });
    } catch (error) {
        next(error);
    }
};

// Submit critical thinking answers
exports.submitCriticalThinkingWithProgress = async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const { answers } = req.body;
        
        const forensicCase = await Case.findById(caseId);
        if (!forensicCase) {
            return next(new AppError('Case not found', 404));
        }

        // Validate answers
        if (!Array.isArray(answers)) {
            return next(new AppError('Answers must be provided as an array', 400));
        }

        // For each answer, calculate score based on rubric
        const detailedResults = answers.map((answer, index) => {
            const question = forensicCase.criticalThinkingQuestions[index];
            // Here you would implement your scoring algorithm
            // For now, we'll use a simple scoring system
            const score = Math.min(5, Math.ceil(answer.length / 50)); // Example scoring
            
            return {
                question: question.question,
                answer,
                score,
                maxScore: question.maxScore,
                feedback: `Your answer scored ${score}/${question.maxScore}`
            };
        });

        const totalScore = detailedResults.reduce((sum, result) => sum + result.score, 0);
        const maxPossibleScore = forensicCase.criticalThinkingQuestions.reduce(
            (sum, q) => sum + q.maxScore, 0
        );
        const score = (totalScore / maxPossibleScore) * 100;

        // Update progress
        let progress = await Progress.findOne({ userId: req.user._id, caseId });
        if (!progress) {
            progress = new Progress({
                userId: req.user._id,
                caseId,
                caseTitle: forensicCase.title
            });
        }

        progress.sections.criticalThinking = {
            completed: true,
            score,
            answers: detailedResults
        };

        // Update overall progress
        progress.score = calculateSectionScore(progress.sections);
        progress.completed = progress.score === 100;
        
        await progress.save();

        res.status(200).json({
            status: 'success',
            data: {
                score,
                totalScore,
                maxPossibleScore,
                detailedResults
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get case progress
exports.getCaseProgressWithUser = async (req, res, next) => {
    try {
        const progress = await Progress.find({ userId: req.user._id })
            .populate('caseId', 'title description difficulty');

        res.status(200).json({
            status: 'success',
            data: {
                progress: progress.map(p => ({
                    caseId: p.caseId._id,
                    title: p.caseId.title,
                    difficulty: p.caseId.difficulty,
                    overallProgress: p.score,
                    sections: {
                        caseDescription: p.sections.caseDescription,
                        evidenceAnalysis: p.sections.evidenceAnalysis,
                        criticalThinking: p.sections.criticalThinking
                    },
                    completed: p.completed,
                    lastAccessTime: p.lastAccessTime
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};
