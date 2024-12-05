const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    sections: {
        overview: {
            content: String,
            image: String
        },
        available_evidence: {
            content: [String],
            image: String
        },
        preliminary_analysis: {
            content: [String],
            image: String
        },
        objective: {
            content: {
                type: [String],
                required: false
            },
            image: {
                type: String,
                required: false
            }
        }
    },
    questions: {
        multiple_choice: {
            title: String,
            questions: [{
                id: String,
                question: String,
                options: [{
                    id: String,
                    text: String,
                    isCorrect: Boolean
                }]
            }]
        },
        critical_thinking: {
            title: String,
            questions: [{
                id: String,
                question: String,
                maxScore: {
                    type: Number,
                    default: 5
                }
            }]
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Case', CaseSchema);
