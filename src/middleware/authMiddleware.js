const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No authentication token provided', 401);
        }

        const token = authHeader.replace('Bearer ', '');

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Check if user still exists
            const user = await User.findById(decoded.userId);
            if (!user) {
                throw new AppError('User no longer exists', 401);
            }

            // Add user info to request
            req.user = {
                userId: decoded.userId
            };
            
            next();
        } catch (err) {
            throw new AppError('Invalid authentication token', 401);
        }
    } catch (error) {
        next(error);
    }
};
