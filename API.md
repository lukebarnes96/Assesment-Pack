# API Documentation

Base URL: `http://localhost:4000/api`

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### POST /auth/register

Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CLIENT",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CLIENT"
  },
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token"
}
```

### POST /auth/login

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": { /* user object */ },
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token"
}
```

### POST /auth/refresh

Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

**Response:**
```json
{
  "accessToken": "new_jwt_token"
}
```

## Clients

### POST /clients

Create a client profile. (Authenticated)

**Request Body:**
```json
{
  "dateOfBirth": "1990-01-01",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "occupation": "Software Engineer",
  "annualIncome": 100000
}
```

### GET /clients

Get all clients. (Broker/Admin only)

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "data": [/* array of clients */],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### GET /clients/:id

Get client by ID.

### PUT /clients/:id

Update client profile.

## Insurance Products

### GET /products

Get all insurance products.

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `type`: Filter by insurance type (AUTO, HOME, LIFE, HEALTH, etc.)
- `carrier`: Filter by carrier name

**Response:**
```json
{
  "data": [
    {
      "id": "product_id",
      "name": "Premium Auto Insurance",
      "type": "AUTO",
      "carrier": "ABC Insurance",
      "description": "Comprehensive auto insurance",
      "basePrice": 150.00,
      "coverageDetails": {},
      "features": ["24/7 Support", "Roadside Assistance"],
      "isActive": true
    }
  ],
  "pagination": { /* pagination info */ }
}
```

### GET /products/:id

Get product by ID.

### POST /products

Create new product. (Admin only)

### PUT /products/:id

Update product. (Admin only)

### DELETE /products/:id

Deactivate product. (Admin only)

## Quotes

### POST /quotes

Create a new quote.

**Request Body:**
```json
{
  "clientId": "client_id",
  "productId": "product_id",
  "coverageAmount": 250000,
  "deductible": 1000,
  "additionalInfo": {}
}
```

**Response:**
```json
{
  "id": "quote_id",
  "quoteNumber": "QT-12345",
  "premium": 175.50,
  "coverageAmount": 250000,
  "deductible": 1000,
  "validUntil": "2024-02-15T00:00:00Z",
  "product": { /* product details */ },
  "client": { /* client details */ }
}
```

### GET /quotes

Get all quotes for the authenticated user.

### GET /quotes/:id

Get quote by ID.

### POST /quotes/:id/accept

Accept a quote and convert it to a policy.

### POST /quotes/compare

Compare quotes across multiple products.

**Request Body:**
```json
{
  "clientId": "client_id",
  "insuranceType": "AUTO",
  "coverageAmount": 250000,
  "deductible": 1000
}
```

### POST /quotes/recommendations

Get AI-powered policy recommendations.

**Request Body:**
```json
{
  "clientId": "client_id",
  "insuranceType": "AUTO",
  "budget": 200,
  "preferences": {
    "priority": "coverage"
  }
}
```

**Response:**
```json
[
  {
    "productId": "product_id",
    "productName": "Premium Auto Coverage",
    "score": 95,
    "reasoning": "Best match for your needs...",
    "estimatedPremium": 185.00,
    "coverageHighlights": ["Comprehensive coverage", "Low deductible"],
    "pros": ["Excellent coverage", "Good price"],
    "cons": ["Slightly higher premium"]
  }
]
```

## Policies

### POST /policies

Create a new policy. (Broker/Admin only)

**Request Body:**
```json
{
  "clientId": "client_id",
  "productId": "product_id",
  "premium": 175.50,
  "coverageAmount": 250000,
  "deductible": 1000,
  "startDate": "2024-01-01",
  "endDate": "2025-01-01",
  "terms": {}
}
```

### GET /policies

Get all policies.

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (DRAFT, ACTIVE, EXPIRED, CANCELLED, PENDING_RENEWAL)

### GET /policies/:id

Get policy by ID.

### PUT /policies/:id

Update policy. (Broker/Admin only)

### POST /policies/:id/activate

Activate a policy. (Broker/Admin only)

## Claims

### POST /claims

File a new claim.

**Request Body:**
```json
{
  "policyId": "policy_id",
  "incidentDate": "2024-01-15",
  "claimAmount": 5000,
  "description": "Accident on highway..."
}
```

**Response:**
```json
{
  "id": "claim_id",
  "claimNumber": "CLM-12345",
  "status": "SUBMITTED",
  "claimAmount": 5000,
  "incidentDate": "2024-01-15T00:00:00Z",
  "reportedDate": "2024-01-16T10:30:00Z",
  "description": "Accident on highway...",
  "policy": { /* policy details */ }
}
```

### GET /claims

Get all claims.

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status

### GET /claims/:id

Get claim by ID.

### POST /claims/:id/analyze

Trigger AI analysis of a claim. (Broker/Admin only)

**Response:**
```json
{
  "fraudRisk": "LOW",
  "fraudScore": 15,
  "validationStatus": "VALID",
  "flags": [],
  "recommendedAction": "Approve claim for processing",
  "estimatedSettlement": 4800
}
```

### PUT /claims/:id/status

Update claim status. (Broker/Admin only)

**Request Body:**
```json
{
  "status": "APPROVED",
  "approvedAmount": 4800,
  "processingNotes": "Claim approved after review"
}
```

## AI Services

### POST /ai/risk-assessment

Perform risk assessment. (Broker/Admin only)

**Request Body:**
```json
{
  "clientId": "client_id",
  "assessmentType": "Auto Insurance",
  "data": {
    "age": 35,
    "drivingHistory": [],
    "vehicle": {
      "year": 2020,
      "make": "Toyota",
      "model": "Camry"
    },
    "location": "New York, NY",
    "annualMileage": 12000
  }
}
```

**Response:**
```json
{
  "riskLevel": "MEDIUM",
  "riskScore": 55,
  "factors": [
    {
      "factor": "Age",
      "impact": "positive",
      "weight": 0.8,
      "description": "Mature driver with experience"
    }
  ],
  "recommendations": [
    "Consider defensive driving course for lower premium"
  ],
  "confidence": 0.92
}
```

### POST /ai/policy-recommendations

Get AI policy recommendations.

### POST /ai/claims/:claimId/analyze

Analyze a claim for fraud and validity. (Broker/Admin only)

### GET /ai/fraud-detection/:clientId

Detect fraud patterns for a client. (Broker/Admin only)

### POST /ai/document-analysis

Analyze insurance documents.

**Request Body:**
```json
{
  "documentType": "DRIVERS_LICENSE",
  "documentText": "extracted text from OCR",
  "metadata": {}
}
```

### POST /ai/chat/sessions

Create a new chat session.

**Response:**
```json
{
  "sessionId": "session_id"
}
```

### GET /ai/chat/sessions

Get all chat sessions for the authenticated user.

### POST /ai/chat

Send a message to the AI assistant.

**Request Body:**
```json
{
  "sessionId": "session_id",
  "message": "What does my auto policy cover?"
}
```

**Response:**
```json
{
  "message": "Your auto policy covers...",
  "suggestions": [
    "Tell me about my deductible",
    "How do I file a claim?"
  ],
  "actions": []
}
```

## Health Check

### GET /health

Check API health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-16T10:30:00Z"
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

API endpoints are rate limited to 100 requests per 15 minutes per IP address.

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets
