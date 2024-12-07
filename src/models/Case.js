const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
    evidence_type: String,
    description: String
});

const optionSchema = new mongoose.Schema({
    text: String,
    isCorrect: Boolean,
    explanation: String
});

const evidenceAnalysisQuestionSchema = new mongoose.Schema({
    question: String,
    options: [optionSchema]
});

const criticalThinkingQuestionSchema = new mongoose.Schema({
    question: String,
    maxScore: {
        type: Number,
        default: 5
    },
    rubric: [String]
});

const caseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    image_url: String,
    evidence: [evidenceSchema],
    evidenceAnalysisQuestions: [evidenceAnalysisQuestionSchema],
    criticalThinkingQuestions: [criticalThinkingQuestionSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('Case', caseSchema);
