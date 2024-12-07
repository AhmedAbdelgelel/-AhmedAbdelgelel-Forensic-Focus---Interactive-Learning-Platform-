const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AppError = require('../utils/AppError');

// Helper function to generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// Register user
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, collegeId } = req.body;

        // Validate email domain
        if (!email.endsWith('@mans.edu.eg')) {
            throw new AppError('Email must be from mans.edu.eg domain', 400);
        }

        // Validate college ID
        if (!/^\d{10}$/.test(collegeId)) {
            throw new AppError('College ID must be exactly 10 digits', 400);
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { collegeId }] 
        });
        
        if (existingUser) {
            throw new AppError(
                existingUser.email === email ? 'Email already exists' : 'College ID already exists',
                400
            );
        }

        // Generate salt and hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user document
        const userDoc = {
            name,
            email,
            password: hashedPassword,
            collegeId,
            progress: [],
            createdAt: new Date()
        };

        // Create user
        const user = await User.create(userDoc);

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            status: 'success',
            token,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    collegeId: user.collegeId
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Login user
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if email and password exist
        if (!email || !password) {
            throw new AppError('Please provide email and password', 400);
        }

        // Check if user exists && password is correct
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            throw new AppError('Invalid credentials', 401);
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            status: 'success',
            token,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    collegeId: user.collegeId
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Logout user
exports.logout = async (req, res) => {
    try {
        // Since we're using JWT, we don't need to do anything server-side
        // The client should remove the token from their storage
        res.status(200).json({
            status: 'success',
            message: 'Successfully logged out'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error logging out'
        });
    }
};

// Get current user
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.json({
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    collegeId: user.collegeId,
                    progress: user.progress
                }
            }
        });
    } catch (error) {
        next(error);
    }
};
