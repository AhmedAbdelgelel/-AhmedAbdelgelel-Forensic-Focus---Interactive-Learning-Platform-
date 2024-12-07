# Forensic Case Study API Documentation

## Base URL
```
http://localhost:5001/api
```

## Authentication
All endpoints except registration and login require a valid JWT token in the Authorization header.

### Test Account Credentials
```
Email: test.user@mans.edu.eg
Password: Test@12345
```

## Authentication Endpoints

### 1. Register User
```http
POST /auth/register
Content-Type: application/json

{
    "name": "Test User",
    "email": "test.user@mans.edu.eg",
    "password": "Test@12345"
}
```
Note: Email must be a valid Mansoura University email (@mans.edu.eg)

### 2. Login User
```http
POST /auth/login
Content-Type: application/json

{
    "email": "test.user@mans.edu.eg",
    "password": "Test@12345"
}
```
Response includes JWT token to be used in subsequent requests.

### 3. Logout User
```http
POST /auth/logout
Authorization: Bearer <your_jwt_token>
```
Note: Client should remove the JWT token from local storage after successful logout.

## Quiz Endpoints

### 1. Get Available Quizzes
```http
GET /quiz/available
Authorization: Bearer <your_jwt_token>
```

### 2. Get Questions for a Case
```http
GET /quiz/:caseId/questions
Authorization: Bearer <your_jwt_token>
```
Replace `:caseId` with the case number (1, 2, or 3)

### 3. Submit Quiz Answers
```http
POST /quiz/:caseId/submit
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
    "answers": ["A", "B", "C", "D"]  // Array of answer choices
}
```

### 4. Get User Progress
```http
GET /quiz/progress
Authorization: Bearer <your_jwt_token>
```

## Response Format
All responses follow this general format:
```json
{
    "status": "success",
    "data": {
        // Response data specific to each endpoint
    }
}
```

## Error Handling
Errors return with appropriate HTTP status codes and messages:
```json
{
    "status": "error",
    "message": "Error description"
}
```

## Quiz Cases Overview
1. Case 1: Body Found in Car (4 questions)
2. Case 2: Elderly Woman Death (4 questions)
3. Case 3: Desert Road Corpses (5 questions)

## Score Tracking
Each case tracks:
- Quiz score
- Evidence analysis score
- Critical thinking score
- Completion status
- Last attempt timestamp

## Development Notes
- Server runs on port 5001
- MongoDB required for database
- JWT used for authentication
- Rate limiting implemented for security
