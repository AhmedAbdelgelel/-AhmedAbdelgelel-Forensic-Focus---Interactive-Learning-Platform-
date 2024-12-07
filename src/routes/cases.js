const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const caseController = require('../controllers/caseController');

// Protected routes (require authentication)
router.use(protect);

// Get all cases
router.get('/', caseController.getAllCases);

// Get case details with all sections
router.get('/:caseId', caseController.getCaseDetails);

// Get case evidence
router.get('/:caseId/evidence', caseController.getCaseEvidence);

// Submit evidence analysis answers
router.post('/:caseId/evidence-analysis', caseController.submitEvidenceAnalysis);

// Submit critical thinking answers
router.post('/:caseId/critical-thinking', caseController.submitCriticalThinking);

// Get user's progress for all cases
router.get('/progress/all', caseController.getCaseProgress);

module.exports = router;
