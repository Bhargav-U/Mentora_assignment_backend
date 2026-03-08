# Mentora Backend

A modular, production-ready REST API for managing tutoring sessions — covering student management, lesson booking, session tracking, and AI-powered text summarization.

---

## Table of Contents

- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Request Flow](#request-flow)
- [Design Decisions](#design-decisions)
- [Authentication & Authorization](#authentication--authorization)
- [Validation](#validation)
- [Error Handling](#error-handling)
- [API Reference](#api-reference)
- [API Usage Guide](#api-usage-guide)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
  - [Option A — Local Development](#option-a--local-development)
  - [Option B — Docker Deployment](#option-b--docker-deployment)

---

## Architecture

![Mentora Backend Architecture](./Mentora_backend_architecture.png)

The backend follows a **modular service-based structure** designed for clarity, scalability, and maintainability.

```
Route → Controller → Service → Database
```

| Layer            | Responsibility                                              |
| ---------------- | ----------------------------------------------------------- |
| **Routes**       | Define HTTP endpoints and attach middleware                 |
| **Controllers**  | Parse requests, call services, send responses               |
| **Services**     | Contain business logic and execute database queries         |
| **Database**     | Accessed through `config/db.js`                            |

---

## Database Schema

![Simplified ER Diagram](./src/db/ER_Diagram_simplified.png)

The schema is initialized using `create_schema.sql` located in `src/db/`. This file must be applied **once** after the database is created and before the server is started for the first time.

See [Getting Started](#getting-started) for the exact setup sequence.

---

## Project Structure

```
src/
├── app.js            # Configures Express middleware, routes, and global error handling
├── server.js         # Starts the server after verifying database connectivity
├── config/           # Environment variables and database connection setup
├── routes/           # API endpoint definitions and middleware attachment
├── controllers/      # HTTP request/response logic
├── services/         # Business logic and database queries
├── validators/       # Request validation schemas (Zod)
├── middleware/       # Authentication, authorization, and error handling
├── utils/            # Shared helper utilities
├── db/
│   └── create_schema.sql  # Database schema — run once after DB is created
└── tests/            # API and integration tests
```

---

## Request Flow

Each request moves through the following layers:

```
Client
  │
  ▼
Route          ← Defines the endpoint and attaches middleware
  │
  ▼
Middleware     ← JWT verification, role checks, validation
  │
  ▼
Controller     ← Parses request, delegates to service, sends response
  │
  ▼
Service        ← Business logic, ownership checks, DB queries
  │
  ▼
Database       ← PostgreSQL via config/db.js
```

---

## Design Decisions

### Students stored separately from users

Students live in a dedicated `students` table rather than inside `users`.

- Students authenticate independently
- A single parent may manage multiple students
- Students follow a different permission model
- Avoids mixing authentication roles with managed accounts

This separation enables **cleaner authorization and clearer domain modeling**.

### JWT for stateless authentication

- No server-side session storage required
- Horizontally scalable across multiple instances
- Token carries user identity and role
- Simple integration with any API client

Tokens are passed via:

```
Authorization: Bearer <JWT_TOKEN>
```

### Thin controllers, rich services

Controllers handle only request parsing, validation, and response sending. All business rules, ownership validation, and database operations live in the service layer — improving **maintainability, testability, and reuse across endpoints**.

### Bookings as a join table

Students link to lessons through a `bookings` table, providing:

- A proper many-to-many relationship
- Database-level referential integrity
- A unique constraint preventing duplicate enrollments
- Efficient querying and aggregation

### Summary vs. detail endpoints

| Endpoint                          | Returns                                      |
| --------------------------------- | -------------------------------------------- |
| `GET /mentor/lessons`             | Summary view with student and session counts |
| `GET /lessons/:lessonId/students` | Full enrolled student list                   |
| `GET /lessons/:id/sessions`       | Full session list                            |

---

## Authentication & Authorization

### Middleware

| Middleware               | Purpose                                                        |
| ------------------------ | -------------------------------------------------------------- |
| `auth.middleware.js`     | Verifies JWT and attaches the authenticated user to `req.user` |
| `role.middleware.js`     | Restricts endpoints based on user role                         |
| `error.middleware.js`    | Centralized error handling                                     |
| `notFound.middleware.js` | Handles unknown routes                                         |

### Roles

```
PARENT | MENTOR | STUDENT
```

### Access Rules

| Role              | Permissions                                                                        |
| ----------------- | ---------------------------------------------------------------------------------- |
| **PARENT**        | Create and manage their own students; book lessons only for their own students     |
| **MENTOR**        | Create and manage their own lessons; create sessions; view their enrolled students |
| **STUDENT**       | View only their own lessons                                                        |
| **Authenticated** | View sessions for any lesson they are associated with                              |

---

## Validation

All incoming requests are validated using **Zod schemas** defined in `src/validators/`.

Validation runs **before business logic executes**, ensuring invalid or malformed data never reaches the service layer.

---

## Error Handling

All errors are returned in a consistent JSON structure:

```json
{
  "message": "Error description"
}
```

### HTTP Status Codes

| Code | Meaning                 |
| ---- | ----------------------- |
| 200  | Successful request      |
| 201  | Resource created        |
| 400  | Validation error        |
| 401  | Authentication required |
| 403  | Forbidden               |
| 404  | Resource not found      |
| 409  | Conflict                |
| 413  | Payload too large       |
| 429  | Rate limit exceeded     |
| 500  | Internal server error   |
| 502  | External provider error |

---

## API Reference

All endpoints are relative to `/api`.

> **Base URL**
>
> Before running any request, export your base URL:
> ```bash
> export BASE_URL="<your-api-base-url>/api"
> ```
> For local development:
> ```bash
> export BASE_URL="http://localhost:3000/api"
> ```

---

### Core Endpoints

| Method | Endpoint                | Auth | Roles  | Description                   |
| ------ | ----------------------- | ---- | ------ | ----------------------------- |
| GET    | `/`                     | No   | —      | API status                    |
| GET    | `/health`               | No   | —      | Health check                  |
| POST   | `/auth/signup`          | No   | —      | Register a parent or mentor   |
| POST   | `/auth/login`           | No   | —      | Login and receive a JWT token |
| GET    | `/auth/me`              | Yes  | Any    | Return authenticated account  |
| POST   | `/students`             | Yes  | PARENT | Create a student              |
| GET    | `/students`             | Yes  | PARENT | List parent's students        |
| POST   | `/lessons`              | Yes  | MENTOR | Create a lesson               |
| POST   | `/bookings`             | Yes  | PARENT | Book a student into a lesson  |
| POST   | `/sessions`             | Yes  | MENTOR | Create a lesson session       |
| GET    | `/lessons/:id/sessions` | Yes  | Any    | List sessions for a lesson    |

---

### Extended Endpoints

| Method | Endpoint                              | Auth | Roles           | Description                   |
| ------ | ------------------------------------- | ---- | --------------- | ----------------------------- |
| GET    | `/lessons`                            | Yes  | Any             | List all lessons               |
| GET    | `/students/:studentId/lessons`        | Yes  | PARENT, STUDENT | Lessons assigned to a student  |
| GET    | `/lessons/:lessonId/students`         | Yes  | MENTOR          | Students enrolled in a lesson  |
| GET    | `/parent/students`                    | Yes  | PARENT          | Parent dashboard               |
| GET    | `/parent/students/:studentId/lessons` | Yes  | PARENT          | Lessons for a specific child   |
| GET    | `/mentor/lessons`                     | Yes  | MENTOR          | Mentor lesson dashboard        |

---

### AI Summarization Endpoint

Generates a concise summary of provided text using an LLM (Gemini by default).

| Method | Endpoint         | Auth | Roles             | Description             |
| ------ | ---------------- | ---- | ----------------- | ----------------------- |
| POST   | `/llm/summarize` | Yes  | Any authenticated | Generate a text summary |

**Request body:**

```json
{
  "text": "Your long-form text to be summarized goes here."
}
```

**Successful response:**

```json
{
  "summary": "A concise summary of the provided text.",
  "model": "gemini-2.5-flash"
}
```

**Validation and error codes:**

| Condition                       | Code |
| ------------------------------- | ---- |
| `text` field is missing         | 400  |
| `text` is below minimum length  | 400  |
| `text` exceeds maximum length   | 413  |
| Rate limit exceeded             | 429  |
| LLM provider error              | 502  |

**Rate limiting:**
The endpoint is protected by a sliding window rate limiter configured via `LLM_RATE_LIMIT_WINDOW_MS` and `LLM_RATE_LIMIT_MAX_REQUESTS`. Exceeding the limit returns:

```json
{
  "message": "Too many requests"
}
```

---

## API Usage Guide

Set your environment before running any commands:

```bash
export BASE_URL="<your-api-base-url>/api"
export TOKEN="<your-jwt-token>"
```

> For local development: `export BASE_URL="http://localhost:3000/api"`

---

### Health Check

```bash
curl "$BASE_URL/health"
```

Expected response: `OK`

---

### Signup

Creates a **PARENT** or **MENTOR** account. Students are not created through signup.

```bash
curl -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "role": "PARENT",
    "username": "john_parent",
    "password": "strongpassword"
  }'
```

| Code | Meaning                 |
| ---- | ----------------------- |
| 201  | Account created         |
| 400  | Validation error        |
| 409  | Username already exists |

---

### Login

```bash
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_parent",
    "password": "strongpassword"
  }'
```

**Response:**

```json
{
  "token": "<JWT_TOKEN>"
}
```

Save the token for all subsequent requests:

```bash
export TOKEN="<JWT_TOKEN>"
```

| Code | Meaning                      |
| ---- | ---------------------------- |
| 400  | Invalid request format       |
| 401  | Invalid username or password |

---

### Get Current User

```bash
curl "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**

```json
{
  "id": "...",
  "username": "...",
  "role": "PARENT"
}
```

---

### Create Student *(PARENT only)*

```bash
curl -X POST "$BASE_URL/students" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Alice",
    "last_name": "Doe",
    "username": "alice_student",
    "password": "studentpass"
  }'
```

| Code | Meaning                          |
| ---- | -------------------------------- |
| 201  | Student created                  |
| 400  | Invalid request body             |
| 403  | Only parents can create students |

---

### List Parent's Students *(PARENT only)*

```bash
curl "$BASE_URL/parent/students" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Create Lesson *(MENTOR only)*

```bash
curl -X POST "$BASE_URL/lessons" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Math Basics",
    "description": "Introduction to arithmetic"
  }'
```

| Code | Meaning                         |
| ---- | ------------------------------- |
| 201  | Lesson created                  |
| 403  | Only mentors can create lessons |

---

### List All Lessons

```bash
curl "$BASE_URL/lessons" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Book Student into Lesson *(PARENT only)*

```bash
curl -X POST "$BASE_URL/bookings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "<STUDENT_UUID>",
    "lesson_id": "<LESSON_UUID>"
  }'
```

| Code | Meaning                         |
| ---- | ------------------------------- |
| 201  | Booking created                 |
| 403  | Parent does not own the student |
| 404  | Lesson not found                |
| 409  | Student already enrolled        |

---

### Create Session *(MENTOR only)*

```bash
curl -X POST "$BASE_URL/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lesson_id": "<LESSON_UUID>",
    "date": "2026-03-08T10:00:00Z",
    "topic": "Fractions",
    "summary": "Basic fractions introduction"
  }'
```

| Code | Meaning                        |
| ---- | ------------------------------ |
| 201  | Session created                |
| 400  | Invalid session data           |
| 403  | Mentor does not own the lesson |

---

### List Sessions for a Lesson

```bash
curl "$BASE_URL/lessons/<LESSON_UUID>/sessions" \
  -H "Authorization: Bearer $TOKEN"
```

---

### List Students Enrolled in a Lesson *(MENTOR only)*

```bash
curl "$BASE_URL/lessons/<LESSON_UUID>/students" \
  -H "Authorization: Bearer $TOKEN"
```

---

### List Lessons for a Student

```bash
curl "$BASE_URL/students/<STUDENT_UUID>/lessons" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Parent View of a Student's Lessons *(PARENT only)*

```bash
curl "$BASE_URL/parent/students/<STUDENT_UUID>/lessons" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Mentor Lesson Dashboard *(MENTOR only)*

Returns all mentor lessons with student and session counts.

```bash
curl "$BASE_URL/mentor/lessons" \
  -H "Authorization: Bearer $TOKEN"
```

---

### AI Summarization

```bash
curl -X POST "$BASE_URL/llm/summarize" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Artificial intelligence is transforming education by enabling personalized learning, automated grading, and better content accessibility."
  }'
```

**Response:**

```json
{
  "summary": "AI improves education through personalized learning, automated grading, and better accessibility.",
  "model": "gemini-2.5-flash"
}
```

---

## Environment Variables

Create a `.env` file in the project root. All variables below are required.

```env
# ─── Server ────────────────────────────────────────────────────────────────────

PORT=3000

# ─── Database ──────────────────────────────────────────────────────────────────
#
# Format: postgresql://<user>:<password>@<host>:<port>/<database>
#
# Local development (DB running directly on your machine):
#   DATABASE_URL=postgresql://root:root@localhost:5432/mentora
#
# Docker deployment (DB running as a container on a shared Docker network):
#   Use the DB container name as the host — NOT localhost.
#   Containers on the same Docker network resolve each other by container name.
#   Example: DATABASE_URL=postgresql://root:root@mentoraDB:5432/mentora
#   Replace "mentoraDB" with whatever name you gave your database container.
#
# Production / managed DB (e.g. AWS RDS, Supabase, Neon):
#   Replace the host with your cloud database endpoint.

DATABASE_URL=postgresql://<db_user>:<db_password>@<db_host>:5432/<db_name>

# ─── JWT ───────────────────────────────────────────────────────────────────────
#
# A long, random secret string used to sign and verify tokens.
# Generate one with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Keep this value private and never commit it.

JWT_SECRET=your_jwt_secret_here

# How long a token remains valid before expiring.
# Accepted formats: 1d (1 day), 12h (12 hours), 7d (7 days), etc.

JWT_EXPIRES_IN=1d

# ─── LLM / Gemini ──────────────────────────────────────────────────────────────
#
# Obtain your API key from Google AI Studio: https://aistudio.google.com/app/apikey

GEMINI_API_KEY=your_gemini_api_key_here

# The Gemini model to use for summarization requests.
# Recommended: gemini-2.5-flash (fast and cost-efficient)
# Other options: gemini-1.5-pro, gemini-1.5-flash

LLM_MODEL=gemini-2.5-flash

# The system-level instruction sent to the LLM before every summarization request.
# Customize this to adjust the tone, style, or constraints of generated summaries.

LLM_SUMMARIZE_PROMPT=You are a helpful assistant. Summarize the following text concisely and clearly.

# ─── LLM Rate Limiting ─────────────────────────────────────────────────────────
#
# Controls how many requests a single client can make to the /llm/summarize endpoint.
#
# LLM_RATE_LIMIT_WINDOW_MS   — Duration of the rate limit window in milliseconds.
#                               Example: 60000 = 1 minute window.
#
# LLM_RATE_LIMIT_MAX_REQUESTS — Maximum number of requests allowed per client
#                               within the window before returning 429.

LLM_RATE_LIMIT_WINDOW_MS=60000
LLM_RATE_LIMIT_MAX_REQUESTS=20

# ─── Environment ───────────────────────────────────────────────────────────────
#
# Use "development" locally and "production" in deployed environments.

NODE_ENV=development
```

> **Never commit your `.env` file.** It is included in `.gitignore` by default.

---

## Getting Started

The startup sequence is always:

```
1. Start the database
2. Apply the schema  ← first time only
3. Start the server
```

---

### Option A — Local Development

**Prerequisites:** Node.js 20+, PostgreSQL running locally.

#### 1. Clone the repository

```bash
git clone <your-repo-url>
cd mentora-backend
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Configure environment

```bash
cp .env.example .env
# Open .env and fill in your values
```

For a local PostgreSQL instance, set:

```env
DATABASE_URL=postgresql://root:root@localhost:5432/mentora
```

#### 4. Create the database

```bash
psql -U root -c "CREATE DATABASE mentora;"
```

#### 5. Apply the schema

```bash
psql -U root -d mentora -f src/db/create_schema.sql
```

#### 6. Start the server

```bash
node src/server.js
```

Verify:

```bash
curl "http://localhost:3000/api/health"
# Expected: OK
```

---

### Option B — Docker Deployment

This option runs **both the database and the backend as Docker containers** on a shared bridge network.

The database container must be **running and healthy** before the backend container is started.

> **A note on naming:** The container names, image names, and network name used in the examples below (`mentoraDB`, `mentoraBridge`, `mentora_backend_image`, `mentora_backend_container`) are illustrative. You may use any names you prefer — just keep them consistent across all commands and in your `.env` file.

---

#### Step 1 — Initialize Git *(first time only)*

```bash
git init

cat > .gitignore << 'EOF'
node_modules/
.env
npm-debug.log
.DS_Store
coverage/
dist/
EOF
```

---

#### Step 2 — Create a shared Docker network

All containers must communicate over the same network.

```bash
docker network create mentoraBridge
```

---

#### Step 3 — Start the database container

```bash
docker run -d \
  --name mentoraDB \
  --network mentoraBridge \
  -e POSTGRES_USER=root \
  -e POSTGRES_PASSWORD=root \
  -e POSTGRES_DB=mentora \
  -p 5432:5432 \
  --restart unless-stopped \
  postgres:16
```

Wait a few seconds for PostgreSQL to finish initializing before proceeding.

---

#### Step 4 — Apply the database schema *(first time only)*

Run `create_schema.sql` against the running database container. This only needs to be done once, when the database is first created.

```bash
docker exec -i mentoraDB psql -U root -d mentora < src/db/create_schema.sql
```

---

#### Step 5 — Configure the environment

Create your `.env` file. Because the backend runs as a container on the same Docker network as the database, the **database host must be set to the database container name** — not `localhost`.

```env
PORT=3000
DATABASE_URL=postgresql://root:root@mentoraDB:5432/mentora
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=1d
GEMINI_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-2.5-flash
LLM_SUMMARIZE_PROMPT=You are a helpful assistant. Summarize the following text concisely and clearly.
LLM_RATE_LIMIT_WINDOW_MS=60000
LLM_RATE_LIMIT_MAX_REQUESTS=20
NODE_ENV=production
```

> **Why the container name as host?**
> Within a Docker bridge network, containers resolve each other by their container name. Using `localhost` here would point to the backend container itself, not the database — the connection would fail.

---

#### Step 6 — Write the Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
# Use lightweight Node Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy application source
COPY . .

# Expose API port
EXPOSE 3000

# Start the server
CMD ["node", "src/server.js"]
```

---

#### Step 7 — Build and run the backend container

```bash
# Build the image
docker build -t mentora_backend_image .

# Run the container
docker run -d \
  --name mentora_backend_container \
  --network mentoraBridge \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  mentora_backend_image
```

---

#### Step 8 — Verify the deployment

```bash
curl "http://localhost:3000/api/health"
# Expected: OK
```

---

#### Rebuilding after code changes

When you update the source code, rebuild and replace the backend container. The database container does not need to be restarted.

```bash
# Remove the old container and image
docker rm -f mentora_backend_container
docker rmi mentora_backend_image

# Rebuild and restart
docker build -t mentora_backend_image .
docker run -d \
  --name mentora_backend_container \
  --network mentoraBridge \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  mentora_backend_image
```

---

## Typical Workflow

| Step | Action                                                           |
| ---- | ---------------------------------------------------------------- |
| 1    | **Signup** — Create a PARENT or MENTOR account                   |
| 2    | **Login** — Receive a JWT token                                  |
| 3    | **Export token** — `export TOKEN="<your-jwt-token>"`             |
| 4    | **Create resources** — Students, lessons, bookings, sessions     |
| 5    | **Query dashboards** — Use mentor and parent dashboard endpoints |
| 6    | **Summarize** — Use the AI endpoint as needed                    |

All protected endpoints require:

```
Authorization: Bearer <JWT_TOKEN>
```

---

*Mentora Backend is built for clarity and scale — with a clean service-oriented architecture that keeps routing, business logic, validation, and external integrations clearly separated and independently testable.*