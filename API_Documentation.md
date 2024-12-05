# Forensic Case Study API Documentation

Base URL: `http://localhost:3000/api`

## Authentication Endpoints

### 1. Register User
- **Method**: POST
- **Endpoint**: `/auth/register`
- **Body**:
```json
{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
}
```
- **Response**:
```json
{
    "success": true,
    "token": "jwt_token_here",
    "data": {
        "user": {
            "id": "user_id",
            "username": "testuser",
            "email": "test@example.com"
        }
    }
}
```

### 2. Login
- **Method**: POST
- **Endpoint**: `/auth/login`
- **Body**:
```json
{
    "email": "test@example.com",
    "password": "password123"
}
```
- **Response**:
```json
{
    "success": true,
    "token": "jwt_token_here"
}
```

### 3. Get Current User
- **Method**: GET
- **Endpoint**: `/auth/me`
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**:
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "user_id",
            "username": "testuser",
            "email": "test@example.com"
        }
    }
}
```

### 4. User Logout
- **Method**: POST
- **Endpoint**: `/users/logout`
- **Headers**:
  - `Authorization`: Bearer token
- **Response**:
```json
{
    "success": true,
    "message": "Logged out successfully"
}
```

## Quiz Endpoints

### 1. Get All Cases
- **Method**: GET
- **Endpoint**: `/quiz/cases`
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**:
```json
{
    "success": true,
    "data": {
        "cases": [
            {
                "id": "case-001",
                "title": "Case Title",
                "sections": {}
            }
        ]
    }
}
```

### 2. Get Specific Case
- **Method**: GET
- **Endpoint**: `/quiz/cases/:id`
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**:
```json
{
    "success": true,
    "data": {
        "case": {
            "id": "case-001",
            "title": "Case Title",
            "sections": {},
            "questions": {}
        }
    }
}
```

### 3. Submit Answers
- **Method**: POST
- **Endpoint**: `/quiz/cases/:id/submit`
- **Headers**: 
  - Authorization: Bearer {token}
- **Body**:
```json
{
    "multipleChoice": [
        {
            "id": "mc1",
            "answer": "b"
        }
    ],
    "criticalThinking": [
        {
            "id": "ct1",
            "answer": "Detailed answer here"
        }
    ]
}
```
- **Response**:
```json
{
    "success": true,
    "data": {
        "progress": {
            "scores": {
                "multipleChoice": 80,
                "criticalThinking": 0,
                "total": 40
            }
        }
    }
}
```

## Admin Endpoints

### 1. Create Case
- **Method**: POST
- **Endpoint**: `/admin/cases`
- **Headers**: 
  - Authorization: Bearer {admin_token}
- **Body**:
```json
{
    "id": "case-001",
    "title": "New Case",
    "sections": {
        "overview": {
            "content": "Case overview",
            "image": "/evidence/case1/overview.jpg"
        }
    },
    "questions": {
        "multiple_choice": {
            "title": "Multiple Choice",
            "questions": [
                {
                    "id": "mc1",
                    "question": "Question text",
                    "options": [
                        {
                            "id": "a",
                            "text": "Option A",
                            "isCorrect": false
                        },
                        {
                            "id": "b",
                            "text": "Option B",
                            "isCorrect": true
                        }
                    ]
                }
            ]
        }
    }
}
```
- **Response**:
```json
{
    "success": true,
    "data": {
        "case": {
            "id": "case-001",
            "title": "New Case"
        }
    }
}
```

### 2. Update Case
- **Method**: PUT
- **Endpoint**: `/admin/cases/:id`
- **Headers**: 
  - Authorization: Bearer {admin_token}
- **Body**: Same as Create Case
- **Response**: Same as Create Case

### 3. Grade Critical Thinking
- **Method**: POST
- **Endpoint**: `/admin/progress/:progressId/grade`
- **Headers**: 
  - Authorization: Bearer {admin_token}
- **Body**:
```json
{
    "grades": [
        {
            "questionId": "ct1",
            "score": 4,
            "feedback": "Good analysis, but could provide more detail"
        }
    ]
}
```
- **Response**:
```json
{
    "success": true,
    "data": {
        "progress": {
            "scores": {
                "multipleChoice": 80,
                "criticalThinking": 80,
                "total": 80
            }
        }
    }
}
```

### 4. Get Case Submissions
- **Method**: GET
- **Endpoint**: `/admin/cases/:caseId/submissions`
- **Headers**: 
  - Authorization: Bearer {admin_token}
- **Response**:
```json
{
    "success": true,
    "data": {
        "submissions": [
            {
                "user": {
                    "username": "testuser",
                    "email": "test@example.com"
                },
                "scores": {
                    "multipleChoice": 80,
                    "criticalThinking": 80,
                    "total": 80
                },
                "completedAt": "2024-01-01T00:00:00.000Z"
            }
        ]
    }
}
```

### 5. Admin Logout
- **Method**: POST
- **Endpoint**: `/admin/logout`
- **Headers**:
  - `Authorization`: Bearer token
- **Response**:
```json
{
    "success": true,
    "message": "Admin logged out successfully"
}
```

## Testing in Postman

1. **Environment Setup**:
   - Create a new environment called "Forensic Quiz API"
   - Add variables:
     - `baseUrl`: http://localhost:3000/api
     - `token`: (leave empty initially)

2. **Collection Setup**:
   - Create a new collection called "Forensic Quiz API"
   - Import all the endpoints
   - Use the environment variables in your requests: {{baseUrl}}/auth/login

3. **Authentication Flow**:
   - Register a new user
   - Login to get the token
   - The token will be automatically set for subsequent requests

4. **Testing Sequence**:
   1. Register/Login
   2. Get available cases
   3. Get specific case details
   4. Submit answers
   5. Admin: Create new cases
   6. Admin: Grade submissions

## Error Handling

All endpoints follow this error response format:
```json
{
    "success": false,
    "message": "Error description here"
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error
