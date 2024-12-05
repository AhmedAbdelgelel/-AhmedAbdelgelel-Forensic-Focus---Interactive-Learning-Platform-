const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
    id: String,
    text: String,
    isCorrect: Boolean
});

const questionSchema = new mongoose.Schema({
    id: String,
    question: String,
    options: [optionSchema],
    image: String
});

const multipleChoiceSchema = new mongoose.Schema({
    title: String,
    questions: [questionSchema]
});

const quizSchema = new mongoose.Schema({
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
            images: [String]
        },
        questions: {
            multiple_choice: multipleChoiceSchema
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Quiz', quizSchema);
