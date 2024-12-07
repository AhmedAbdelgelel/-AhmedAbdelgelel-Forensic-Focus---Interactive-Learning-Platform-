// Calculate overall score based on section weights and scores
exports.calculateSectionScore = (sections) => {
    const weights = {
        caseDescription: 20,
        evidenceAnalysis: 40,
        criticalThinking: 40
    };

    let totalScore = 0;
    let totalWeight = 0;

    // Only include completed sections in calculation
    Object.entries(sections).forEach(([sectionName, section]) => {
        if (section.completed) {
            totalScore += (section.score * weights[sectionName]);
            totalWeight += weights[sectionName];
        }
    });

    // If no sections completed, return 0
    if (totalWeight === 0) return 0;

    // Calculate weighted average
    return Math.round(totalScore / totalWeight);
};

/**
 * Calculate quiz score based on user answers and correct answers
 * @param {Array} userAnswers - Array of user's answers (e.g., ['A', 'B', 'C'])
 * @param {Array} correctAnswers - Array of correct answers (e.g., ['A', 'C', 'B'])
 * @returns {number} Score out of total questions
 */
exports.calculateScore = (userAnswers, correctAnswers) => {
    if (!Array.isArray(userAnswers) || !Array.isArray(correctAnswers)) {
        throw new Error('Both arguments must be arrays');
    }

    let correctCount = 0;
    for (let i = 0; i < Math.min(userAnswers.length, correctAnswers.length); i++) {
        if (userAnswers[i] === correctAnswers[i]) {
            correctCount++;
        }
    }

    return correctCount;
};

/**
 * Calculate evidence analysis score based on user answers and rubric
 * @param {Array} userAnswers - Array of user's answers
 * @param {Array} rubric - Array of rubric criteria with scores
 * @returns {number} Total score
 */
exports.calculateEvidenceAnalysisScore = (userAnswers, rubric) => {
    if (!Array.isArray(userAnswers) || !Array.isArray(rubric)) {
        throw new Error('Both arguments must be arrays');
    }

    let totalScore = 0;
    for (let i = 0; i < Math.min(userAnswers.length, rubric.length); i++) {
        const criteria = rubric[i];
        const answer = userAnswers[i];

        if (answer && criteria.maxScore) {
            // Simple scoring: if answer meets minimum length, award full points
            totalScore += answer.length >= 50 ? criteria.maxScore : Math.floor(criteria.maxScore / 2);
        }
    }

    return totalScore;
};

/**
 * Calculate critical thinking score based on user answers and rubric
 * @param {Array} userAnswers - Array of user's answers
 * @param {Array} rubric - Array of rubric criteria with scores
 * @returns {number} Total score
 */
exports.calculateCriticalThinkingScore = (userAnswers, rubric) => {
    if (!Array.isArray(userAnswers) || !Array.isArray(rubric)) {
        throw new Error('Both arguments must be arrays');
    }

    let totalScore = 0;
    for (let i = 0; i < Math.min(userAnswers.length, rubric.length); i++) {
        const criteria = rubric[i];
        const answer = userAnswers[i];

        if (answer && criteria.maxScore) {
            // Advanced scoring: consider answer length and keyword matching
            const lengthScore = answer.length >= 100 ? criteria.maxScore * 0.6 : criteria.maxScore * 0.3;
            
            // Check for keywords (placeholder logic)
            const keywordScore = criteria.maxScore * 0.4;
            
            totalScore += Math.floor(lengthScore + keywordScore);
        }
    }

    return totalScore;
};
