const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Admin = require('../models/admin.model');

const protect = async (req, res, next) => {
    try {
        // Skip auth check for admin registration and login
        if (req.baseUrl === '/api/admin' && (req.path === '/register' || req.path === '/login')) {
            return next();
        }

        let token;

        // Get token from Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if this is an admin route
            if (req.baseUrl === '/api/admin') {
                req.user = await Admin.findById(decoded.id);
            } else {
                req.user = await User.findById(decoded.id);
            }

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error in auth middleware'
        });
    }
};

// Optional auth - allows both authenticated and unauthenticated access
const optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = await User.findById(decoded.id).select('-password');
            } catch (error) {
                // Invalid token - continue without user
                req.user = null;
            }
        } else {
            req.user = null;
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    protect,
    optionalAuth
};
