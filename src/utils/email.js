const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            // do not fail on invalid certs
            rejectUnauthorized: false
        }
    });
};

// Send verification OTP
const sendVerificationOTP = async (user, otp) => {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
            to: user.email,
            subject: 'Email Verification',
            html: `
                <h1>Email Verification</h1>
                <p>Hello ${user.username},</p>
                <p>Your verification code is: <strong>${otp}</strong></p>
                <p>This code will expire in 10 minutes.</p>
                <p>If you did not request this verification, please ignore this email.</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent:', info.response);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
    try {
        const transporter = createTransporter();
        // Frontend URL where user will reset password
        const resetUrl = `${process.env.BASE_URL}/reset-password/${resetToken}`;

        const mailOptions = {
            from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <h1>Password Reset Request</h1>
                <p>Hello ${user.username},</p>
                <p>You requested a password reset. Please click the link below to reset your password:</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you did not request this reset, please ignore this email.</p>
                <p>For security reasons, please do not share this link with anyone.</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.response);
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
};

module.exports = {
    sendVerificationOTP,
    sendPasswordResetEmail
};
