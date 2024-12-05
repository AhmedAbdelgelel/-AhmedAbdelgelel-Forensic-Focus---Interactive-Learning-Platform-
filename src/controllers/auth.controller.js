const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Generate JWT Token
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// Register user
exports.register = async (req, res) => {
    try {
        const { username, email, collegeId, password } = req.body;

        // Validate college ID format (assuming it's a specific format for Mansoura University)
        const collegeIdRegex = /^[0-9]{10}$/; // 10-digit college ID
        if (!collegeIdRegex.test(collegeId)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid 10-digit college ID'
            });
        }

        // Validate email is from Mansoura University
        if (!email.endsWith('@mans.edu.eg')) {
            return res.status(400).json({
                success: false,
                message: 'Please use your Mansoura University email'
            });
        }

        // Check if user already exists
        let user = await User.findOne({ 
            $or: [
                { email },
                { collegeId }
            ]
        });
        
        if (user) {
            return res.status(400).json({
                success: false,
                message: user.email === email ? 'Email already registered' : 'College ID already registered'
            });
        }

        // Create new user
        user = await User.create({
            username,
            email,
            collegeId,
            password
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    collegeId: user.collegeId
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error in registration',
            error: error.message
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check if user exists and get password
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    collegeId: user.collegeId
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error in login',
            error: error.message
        });
    }
};

// Get current user
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    collegeId: user.collegeId
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting user information',
            error: error.message
        });
    }
};
