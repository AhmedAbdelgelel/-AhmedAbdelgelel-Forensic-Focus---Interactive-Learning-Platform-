// Store progress in memory (you can replace this with a database later)
const progress = new Map();

const trackProgress = (req, res, next) => {
    const caseId = req.params.id;
    const section = req.query.section || 'overview';
    
    if (!progress.has(caseId)) {
        progress.set(caseId, {
            currentSection: 'overview',
            completedSections: [],
            score: 0,
            startedAt: new Date()
        });
    }

    const caseProgress = progress.get(caseId);

    // Validate section access
    const sections = ['overview', 'evidence', 'analysis', 'critical'];
    const currentIndex = sections.indexOf(caseProgress.currentSection);
    const requestedIndex = sections.indexOf(section);

    if (requestedIndex > currentIndex + 1) {
        return res.status(403).json({
            success: false,
            message: 'Please complete previous sections first'
        });
    }

    // Update progress
    if (requestedIndex > currentIndex) {
        caseProgress.currentSection = section;
        caseProgress.completedSections.push(sections[currentIndex]);
        progress.set(caseId, caseProgress);
    }

    // Add progress to request
    req.caseProgress = caseProgress;
    next();
};

const updateScore = (req, res, next) => {
    const caseId = req.params.id;
    const { score } = req.body;

    if (progress.has(caseId)) {
        const caseProgress = progress.get(caseId);
        caseProgress.score = score;
        progress.set(caseId, caseProgress);
    }

    next();
};

module.exports = {
    trackProgress,
    updateScore
};
