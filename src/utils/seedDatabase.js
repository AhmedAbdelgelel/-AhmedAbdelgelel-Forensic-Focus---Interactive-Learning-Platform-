require('dotenv').config();
const mongoose = require('mongoose');
const Case = require('../models/Case');
const casesData = require('../data/cases.json');

const transformCaseData = (caseData) => {
    return {
        title: caseData.title || caseData.overview.split('.')[0],
        description: caseData.description || caseData.overview,
        difficulty: caseData.difficulty || 'Medium',
        image_url: caseData.image_url || '',
        evidence: caseData.available_evidence.map(e => ({
            evidence_type: e.evidence_type,
            description: e.description
        })),
        
        // Transform multiple choice questions to evidence analysis
        evidenceAnalysisQuestions: (caseData.questions?.multiple_choice || []).map(q => ({
            question: q.question,
            options: q.options.map((opt, index) => ({
                text: opt,
                isCorrect: index === q.correct_answer,
                explanation: q.explanation || `Option ${opt} is ${index === q.correct_answer ? 'correct' : 'incorrect'}`
            }))
        })),
        
        // Transform investigation steps to critical thinking
        criticalThinkingQuestions: (caseData.investigation_steps || []).map(step => ({
            question: step,
            maxScore: 5,
            rubric: [
                "Understanding of evidence",
                "Logical reasoning",
                "Investigative approach",
                "Technical knowledge",
                "Conclusion validity"
            ]
        }))
    };
};

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Clear existing cases
        await Case.deleteMany({});
        console.log('Cleared existing cases');

        // Transform and insert new cases
        const transformedCases = casesData.cases.map(transformCaseData);
        await Case.insertMany(transformedCases);
        console.log('Inserted new cases');

        console.log('Database seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
