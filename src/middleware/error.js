const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Handle file not found error
    if (err.code === 'ENOENT') {
        return res.status(404).json({
            success: false,
            message: 'Required data file not found'
        });
    }

    // Handle JSON parse error
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON format in request'
        });
    }

    // Default error
    res.status(500).json({
        success: false,
        message: 'Something went wrong!'
    });
};

module.exports = errorHandler;
