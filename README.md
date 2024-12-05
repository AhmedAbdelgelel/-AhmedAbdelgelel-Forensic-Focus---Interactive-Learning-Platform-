# Forensic Case Study Quiz Application

This application is designed to test knowledge of forensic investigation through interactive case studies. Each case includes evidence images, descriptions, and questions.

## Project Structure

```
Project-02/
├── src/
│   ├── evidence/
│   │   ├── case1/  # Desert Road Murders
│   │   ├── case2/  # Park Assault Case
│   │   └── case3/  # Fingerprint Mystery
│   ├── data/
│   │   └── quiz-data.json
│   └── middleware/
└── README.md
```

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Ensure all images are placed in their respective case folders under `src/evidence/`.

3. Start the application:
   ```bash
   npm start
   ```

## Case Studies

1. **The Desert Road Murders**
   - Investigation of bodies found in desert location
   - Blood evidence analysis
   - Crime scene documentation

2. **The Park Assault Case**
   - Victim injury documentation
   - Blood evidence collection
   - Professional investigation procedures

3. **The Fingerprint Mystery**
   - Fingerprint evidence analysis
   - Crime scene investigation
   - Evidence collection procedures

## Image Organization

Each case has its own folder with relevant evidence images:
- Case 1: Body discovery, blood evidence, scene documentation
- Case 2: Victim photos, crime scene, evidence collection
- Case 3: Fingerprint evidence, investigation photos

## API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `POST /api/users/logout` - Logout user

### Quiz Routes (Protected)
- `GET /api/users/quizzes` - Get all available quizzes
- `POST /api/quiz/:quizId/start` - Start a quiz
- `POST /api/quiz/:quizId/submit` - Submit an answer
- `POST /api/quiz/:quizId/complete` - Complete a quiz
- `GET /api/users/grades` - Get user's quiz grades

### Admin Routes (Protected)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/users` - Get all users
- `GET /api/admin/quizzes` - Get all quizzes with attempts

### Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Environment Variables
Create a `.env` file with the following:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
