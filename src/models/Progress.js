const mongoose = require('mongoose');

const sectionProgressSchema = new mongoose.Schema({
    completed: {
        type: Boolean,
        default: false
    },
    score: {
        type: Number,
        default: 0
    },
    answers: [{
        question: String,
        userAnswer: String,
        isCorrect: Boolean,
        explanation: String,
        score: Number,
        maxScore: Number,
        feedback: String
    }]
});

const progressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    caseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case',
        required: true
    },
    caseTitle: String,
    sections: {
        caseDescription: sectionProgressSchema,
        evidenceAnalysis: sectionProgressSchema,
        criticalThinking: sectionProgressSchema
    },
    score: {
        type: Number,
        default: 0
    },
    completed: {
        type: Boolean,
        default: false
    },
    lastAccessTime: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
progressSchema.index({ userId: 1, caseId: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
