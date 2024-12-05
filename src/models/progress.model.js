const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    case: {
        type: String,
        required: true,
        ref: 'Case'
    },
    currentSection: {
        type: String,
        enum: ['overview', 'evidence', 'analysis', 'critical'],
        default: 'overview'
    },
    completedSections: [{
        type: String,
        enum: ['overview', 'evidence', 'analysis', 'critical']
    }],
    multipleChoiceAnswers: [{
        questionId: String,
        answer: String,
        isCorrect: Boolean
    }],
    criticalThinkingAnswers: [{
        questionId: String,
        answer: String,
        score: Number
    }],
    scores: {
        multipleChoice: {
            type: Number,
            default: 0
        },
        criticalThinking: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            default: 0
        }
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('Progress', ProgressSchema);
