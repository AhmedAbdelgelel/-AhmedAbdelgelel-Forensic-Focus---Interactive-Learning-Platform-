# Forensic Focus - Interactive Learning Platform

A comprehensive Node.js backend application for an interactive forensic science learning platform. This application enables students to test their knowledge through real-case scenarios and quizzes, while allowing instructors to manage content and track student progress.

## Features

### User Features
- Authentication (Register, Login, Logout)
- University Email Validation
- College ID Verification
- View Available Quizzes
- Take Quizzes
- View Personal Grades

### Admin Features
- Authentication (Register, Login, Logout)
- Quiz Management (Create, Update, Delete)
- View All Quiz Attempts
- Monitor Student Progress
- Access Student Grades

### Security Features
- JWT Authentication
- Password Hashing
- Protected Routes
- Input Validation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/forensic-focus.git
cd forensic-focus
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/forensic-focus
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Documentation

Detailed API documentation is available in the `API_Documentation.md` file, which includes:
- All available endpoints
- Request/Response formats
- Authentication requirements
- Example requests

## Quiz Template

A standardized quiz template is available in `question-template.json`. This template ensures consistency in quiz creation and includes:
- Quiz title and description
- Question format
- Answer options structure
- Correct answer designation

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
# -AhmedAbdelgelel-Forensic-Focus---Interactive-Learning-Platform-
