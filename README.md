# Mentora

**A full-stack tutoring platform** for managing students, lessons, sessions, and AI-powered text summarization — built with a modular Node.js/Express backend, a React/TypeScript frontend, and deployed end-to-end on cloud infrastructure.

🌐 **Live Application:** [mentora-app.unnambhargav.in](https://mentora-app.unnambhargav.in)  
⚡ **Live API:** [mentora-assignment-api.unnambhargav.in/api](https://mentora-assignment-api.unnambhargav.in/api)

![project_image](./Project_image.png)
---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [Full Stack & Deployment](#full-stack--deployment)
  - [Backend Architecture](#backend-architecture)
  - [Database Schema](#database-schema)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Deployment](#deployment)
  - [Frontend — Cloudflare Pages](#frontend--cloudflare-pages)
  - [Backend — AWS EC2 with Docker & Nginx](#backend--aws-ec2-with-docker--nginx)
- [Project Structure](#project-structure)
- [Request Flow](#request-flow)
- [Design Decisions](#design-decisions)
- [Authentication & Authorization](#authentication--authorization)
- [Validation](#validation)
  - [Input Format Flexibility](#input-format-flexibility)
- [Error Handling](#error-handling)
- [API Reference](#api-reference)
- [API Usage Guide](#api-usage-guide)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
  - [Option A — Local Development](#option-a--local-development)
  - [Option B — Docker Deployment](#option-b--docker-deployment)
- [Testing](#testing)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Overview

Mentora is a **role-based tutoring management platform** supporting three distinct user types with carefully designed permissions and workflows:

| Role | Capabilities |
|---|---|
| **PARENT** | Register students under their account, browse available lessons, book students into lessons, track all sessions via calendar |
| **MENTOR** | Create and manage lessons, schedule sessions for their lessons, view enrolled students and their progress |
| **STUDENT** | View enrolled lessons, see upcoming sessions, access lesson materials |

### Key Capabilities

- **Multi-tenant student management** — Parents manage multiple students independently; each student has separate authentication
- **Flexible lesson enrollment** — Many-to-many relationship between students and lessons with duplicate prevention
- **Session scheduling** — Mentors create time-bound sessions; all stakeholders view sessions via interactive calendar
- **AI-powered summarization** — Google Gemini LLM integration for generating structured bullet-point summaries with rate limiting and error handling
- **Production-ready deployment** — Complete CI/CD pipeline with automatic frontend deployments and containerized backend infrastructure

---

## Architecture

### Full Stack & Deployment

![Mentora Full Stack Architecture & Deployment](./Mentora_fullstack_deployment_architecture.png)

The system is split into **two independently deployed components**:

#### Frontend (Client-Side)
- **Technology:** React 18 + TypeScript SPA built with Vite
- **Hosting:** Cloudflare Pages (global CDN with 300+ edge locations)
- **CI/CD:** Automatic deployment triggered on every push to `main` branch
- **Domain:** `mentora-app.unnambhargav.in`

#### Backend (Server-Side)
- **Technology:** Node.js 20 + Express.js REST API
- **Hosting:** AWS EC2 Ubuntu instance (t2.micro)
- **Containerization:** Docker with PostgreSQL 16
- **Reverse Proxy:** Nginx with Let's Encrypt SSL/TLS
- **Domain:** `mentora-assignment-api.unnambhargav.in`

#### DNS Configuration
Both subdomains are managed through Cloudflare DNS:

| Subdomain | Type | Points To | SSL/TLS |
|-----------|------|-----------|---------|
| `mentora-app.unnambhargav.in` | CNAME | Cloudflare Pages | Cloudflare Universal SSL |
| `mentora-assignment-api.unnambhargav.in` | A Record | AWS EC2 Public IP | Let's Encrypt (Certbot) |

---

### Backend Architecture

![Mentora Backend Architecture](./Mentora_backend_architecture.png)

The backend follows a **modular service-based architecture** with clear separation of concerns:

```
Route → Controller → Service → Database
```

| Layer | Responsibility | Examples |
|-------|---------------|----------|
| **Routes** | Define HTTP endpoints and attach middleware | `auth.routes.js`, `lessons.routes.js` |
| **Controllers** | Parse requests, validate input, call services, format responses | `auth.controller.js`, `students.controller.js` |
| **Services** | Business logic, ownership validation, database queries | `auth.service.js`, `bookings.service.js` |
| **Middleware** | Cross-cutting concerns (auth, roles, errors, validation) | `auth.middleware.js`, `role.middleware.js` |
| **Database** | PostgreSQL connection pool and query execution | `config/db.js` |

**Benefits of this architecture:**
- **Maintainability:** Each layer has a single responsibility
- **Testability:** Services can be tested independently
- **Reusability:** Business logic in services can be called from multiple controllers
- **Security:** Middleware enforces authentication and authorization before business logic runs

---

### Database Schema

![Simplified ER Diagram](./src/db/ER_Diagram_simplified.png)

The database schema consists of **five core tables** with referential integrity enforced through foreign keys:

#### Tables Overview

| Table | Purpose | Key Constraints |
|-------|---------|----------------|
| **users** | Parents and mentors | Unique username/email, role enum (PARENT/MENTOR) |
| **students** | Student accounts managed by parents | Unique username, FK to parent via `parent_id` |
| **lessons** | Courses created by mentors | FK to mentor via `mentor_id` |
| **bookings** | Student enrollment in lessons | Composite unique constraint on (student_id, lesson_id) |
| **sessions** | Time-bound lesson sessions | FK to lesson via `lesson_id` |

#### Key Relationships

```
users (PARENT) --1:N--> students
users (MENTOR) --1:N--> lessons
students --N:M--> lessons (via bookings join table)
lessons --1:N--> sessions
```

#### Schema Initialization

The schema is defined in `src/db/Create_schema.sql` and must be applied **once** during initial setup:

```bash
psql -U root -d mentora -f src/db/Create_schema.sql
```

**Important:** The schema includes:
- UUID primary keys for all tables
- Cascade delete rules (deleting a parent removes their students)
- Check constraints (role must be PARENT or MENTOR)
- Unique constraints (prevent duplicate bookings)
- Timestamp fields (created_at, updated_at)

---

## Tech Stack

### Frontend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| UI Framework | React 18 + TypeScript | Component-based UI with type safety |
| Build Tool | Vite | Fast development and optimized production builds |
| Routing | React Router v6 | Client-side navigation |
| Data Fetching | TanStack Query (React Query) | Server state management with caching |
| Styling | Tailwind CSS + shadcn/ui | Utility-first CSS with pre-built components |
| Animations | Framer Motion | Smooth transitions and interactions |
| Hosting | Cloudflare Pages | Global CDN with automatic deployments |

### Backend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js 20 | JavaScript runtime environment |
| Framework | Express.js 5.x | Web application framework |
| Database | PostgreSQL 16 | Relational database with ACID compliance |
| Auth | JWT (jsonwebtoken) | Stateless authentication |
| Validation | Zod | Runtime schema validation |
| Password Hashing | bcryptjs | Secure password storage |
| LLM Integration | Google Gemini API | AI-powered text summarization |
| Containerization | Docker | Application containerization |
| Reverse Proxy | Nginx + Let's Encrypt | SSL termination and load balancing |
| Hosting | AWS EC2 | Ubuntu 22.04 LTS virtual machine |

---

## Features

### Core Features

✅ **Role-based access control (RBAC)**
- Three distinct user roles: PARENT, MENTOR, STUDENT
- Middleware-enforced permissions on every protected endpoint
- Role-specific dashboards and capabilities

✅ **Multi-tenant student management**
- Parents create and manage multiple student accounts
- Students stored separately from users table
- Each student has independent authentication credentials
- Parent-student relationship enforced at database level

✅ **Lesson marketplace**
- Mentors create lessons with title and description
- All authenticated users can browse available lessons
- Mentors cannot enroll in their own lessons

✅ **Booking system**
- Parents book their students into lessons
- Many-to-many relationship via join table
- Duplicate enrollment prevention
- Ownership validation (parent must own the student)

✅ **Session scheduling**
- Mentors create time-bound sessions for their lessons
- Each session includes date, topic, and summary
- Access control: only users associated with a lesson can view its sessions
  - Mentors who created the lesson
  - Parents whose students are enrolled
  - Students enrolled in the lesson

✅ **AI-powered summarization**
- Google Gemini 2.5 Flash integration
- Input validation (minimum 50 chars, maximum 10,000 chars)
- Structured JSON output (3-6 bullet points, max 120 words)
- Rate limiting (configurable, default 20 requests/minute)
- Graceful error handling with appropriate HTTP status codes

✅ **Production deployment**
- Frontend: Cloudflare Pages with automatic CI/CD
- Backend: Dockerized Node.js + PostgreSQL on AWS EC2
- SSL/TLS encryption on all connections
- Nginx reverse proxy for backend

---

## Deployment

### Frontend — Cloudflare Pages

The frontend is deployed as a **static site** with automatic CI/CD:

#### Deployment Flow

```
Developer pushes to GitHub (main branch)
          ↓
Cloudflare webhook triggered
          ↓
Cloudflare runs: npm run build
          ↓
Vite bundles React app → dist/
          ↓
dist/ deployed to global CDN
          ↓
Live at: mentora-app.unnambhargav.in
```

#### Build Configuration

| Setting | Value |
|---------|-------|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | 20 |
| Root directory | `/` |

#### Environment Variables

All environment variables are configured in **Cloudflare Pages dashboard** (Settings → Environment Variables):

```env
VITE_API_BASE_URL=https://mentora-assignment-api.unnambhargav.in/api
```

> **Security Note:** `.env` files are **never committed** to the repository. Cloudflare injects environment variables at build time.

#### Deployment Triggers

- **Automatic:** Every push to `main` branch
- **Manual:** Via Cloudflare dashboard

**Deployment time:** Typically 2-3 minutes from push to live.

---

### Backend — AWS EC2 with Docker & Nginx

The backend runs on an **AWS EC2 Ubuntu instance** with the following architecture:

```
Internet (HTTPS requests)
        ↓
    Port 443
        ↓
Nginx (SSL termination via Let's Encrypt)
        ↓
    Port 3000 (localhost only)
        ↓
mentora_backend_container (Node.js/Express)
        ↓
    Port 5432 (Docker bridge network)
        ↓
mentoraDB (PostgreSQL 16)
```

#### Infrastructure Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| EC2 Instance | AWS t2.micro (Ubuntu 22.04) | Virtual machine host |
| Docker Network | Bridge network `mentoraBridge` | Container communication |
| Database Container | `postgres:16` official image | Data persistence |
| Backend Container | Custom Node.js 20 Alpine image | API server |
| Reverse Proxy | Nginx | SSL termination, request routing |
| SSL/TLS | Let's Encrypt (Certbot) | HTTPS encryption |

#### Network Flow

1. **Client → Nginx** (Port 443, HTTPS)
   - Nginx listens on public IP
   - SSL certificate from Let's Encrypt validates identity
   - TLS encryption protects data in transit

2. **Nginx → Backend Container** (Port 3000, HTTP over localhost)
   - Nginx reverse proxies to `localhost:3000`
   - Connection never leaves the machine
   - Sets headers: `Host`, `X-Forwarded-Proto`

3. **Backend → Database** (Port 5432, TCP over Docker network)
   - Both containers on shared bridge network `mentoraBridge`
   - Backend connects using container name: `mentoraDB`
   - Isolated from host network

#### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name mentora-assignment-api.unnambhargav.in;

    # SSL certificates managed by Certbot
    ssl_certificate /etc/letsencrypt/live/mentora-assignment-api.unnambhargav.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mentora-assignment-api.unnambhargav.in/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Reverse proxy to backend container
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name mentora-assignment-api.unnambhargav.in;
    return 301 https://$server_name$request_uri;
}
```

#### Container Restart Policy

Both containers use `--restart unless-stopped`:
- Automatically restart on failure
- Start on VM boot
- Do not restart if manually stopped

#### SSL Certificate Renewal

Let's Encrypt certificates expire every 90 days. Certbot auto-renewal is configured via cron:

```bash
# Runs twice daily, renews if cert expires within 30 days
0 */12 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

---

## Project Structure

```
mentora-backend/
├── src/
│   ├── app.js                  # Express app setup, middleware, routes
│   ├── server.js               # Entry point, DB connection, server start
│   ├── config/
│   │   ├── db.js              # PostgreSQL connection pool
│   │   └── env.js             # Environment variable validation
│   ├── routes/
│   │   ├── index.js           # Main router, combines all routes
│   │   ├── auth.routes.js     # Authentication endpoints
│   │   ├── students.routes.js # Student management
│   │   ├── lessons.routes.js  # Lesson CRUD operations
│   │   ├── bookings.routes.js # Enrollment system
│   │   ├── sessions.routes.js # Session scheduling
│   │   └── llm.routes.js      # AI summarization
│   ├── controllers/
│   │   ├── auth.controller.js    # Signup, login, get current user
│   │   ├── students.controller.js # Create student, list students
│   │   ├── lessons.controller.js  # Create/list lessons
│   │   ├── bookings.controller.js # Enroll students
│   │   ├── sessions.controller.js # Schedule sessions
│   │   └── llm.controller.js      # Summarize text
│   ├── services/
│   │   ├── auth.service.js       # User auth logic, JWT generation
│   │   ├── students.service.js   # Student CRUD, ownership checks
│   │   ├── lessons.service.js    # Lesson operations
│   │   ├── bookings.service.js   # Enrollment logic, duplicate prevention
│   │   ├── sessions.service.js   # Session CRUD, access control
│   │   └── llm.service.js        # Gemini API integration
│   ├── validators/
│   │   ├── auth.validator.js     # Signup/login schemas
│   │   ├── students.validator.js # Student creation schema
│   │   ├── lessons.validator.js  # Lesson creation schema
│   │   ├── bookings.validator.js # Booking schema (snake_case/camelCase)
│   │   └── sessions.validator.js # Session schema (snake_case/camelCase)
│   ├── middleware/
│   │   ├── auth.middleware.js    # JWT verification, req.user attachment
│   │   ├── role.middleware.js    # Role-based access control
│   │   ├── error.middleware.js   # Global error handler, Zod errors
│   │   └── notFound.middleware.js # 404 handler
│   ├── utils/
│   │   └── jwt.util.js           # JWT helper functions
│   └── db/
│       └── Create_schema.sql     # Database schema (run once)
├── tests/
│   └── validators.test.js        # Validator tests (snake_case/camelCase)
├── .env.example                  # Environment variable template
├── .dockerignore                 # Excludes .env, node_modules from builds
├── .gitignore                    # Git ignore rules
├── Dockerfile                    # Multi-stage Docker build
├── package.json                  # Dependencies and scripts
├── package-lock.json             # Locked dependency versions
└── README.md                     # This file
```

---

## Request Flow

Every API request follows this flow:

```
1. Client sends HTTP request
          ↓
2. Route matches endpoint
   Example: POST /api/bookings
          ↓
3. Middleware chain executes in order:
   a. auth.middleware.js
      - Verifies JWT token
      - Attaches user to req.user
      - Returns 401 if invalid
   b. role.middleware.js (if present)
      - Checks if user.role matches required role
      - Returns 403 if unauthorized
   c. Zod validator (if present)
      - Validates request body against schema
      - Returns 400 if invalid
          ↓
4. Controller receives validated request
   - Extracts data from req.body, req.params, req.user
   - Calls appropriate service function
          ↓
5. Service executes business logic
   - Validates ownership (e.g., parent owns student)
   - Performs database queries
   - Returns data or throws error
          ↓
6. Controller formats response
   - Returns JSON with appropriate status code
   - 200/201 for success
   - 400/403/404/409/500 for errors
          ↓
7. Error middleware catches any errors
   - Formats error as { message: "..." }
   - Returns appropriate HTTP status code
          ↓
8. Response sent to client
```

### Example: Creating a Booking

```javascript
// Client request
POST /api/bookings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
{
  "student_id": "123e4567-e89b-12d3-a456-426614174000",
  "lesson_id": "987fcdeb-51a2-43f1-b789-012345678901"
}

// Flow:
1. Route: POST /bookings → bookings.routes.js
2. Middleware:
   - auth.middleware → Verifies JWT, sets req.user
   - role.middleware → Checks req.user.role === 'PARENT'
   - Zod validator → Validates student_id and lesson_id are UUIDs
3. Controller: bookings.controller.createBooking()
   - Extracts: student_id, lesson_id, parent_id from req
4. Service: bookings.service.createBooking()
   - Validates parent owns student
   - Checks lesson exists
   - Prevents duplicate enrollment
   - Inserts into bookings table
5. Response: 201 Created
{
  "id": "abcd1234-...",
  "student_id": "123e4567-...",
  "lesson_id": "987fcdeb-...",
  "created_at": "2026-03-09T12:00:00.000Z"
}
```

---

## Design Decisions

### 1. Students Stored Separately from Users

**Decision:** Students live in a dedicated `students` table, not in `users`.

**Rationale:**
- **Separation of concerns:** Users authenticate and have roles; students are managed entities
- **Multi-tenant support:** A single parent can manage multiple students
- **Independent authentication:** Students log in separately with their own credentials
- **Different permission model:** Students have read-only access; parents/mentors have write access
- **Clearer domain model:** Users create accounts; parents create students under those accounts

**Alternative considered:** Store students as users with role='STUDENT' and add parent_id to users table.

**Why rejected:** Mixing authentication accounts with managed entities creates confusion. If a student later becomes a parent, migration becomes complex.

---

### 2. JWT for Stateless Authentication

**Decision:** Use JWT tokens instead of session-based authentication.

**Rationale:**
- **Scalability:** No server-side session storage required; can horizontally scale across multiple instances
- **Stateless:** Each request is self-contained; no need to look up session in database
- **Simple client integration:** Token passed in Authorization header; works with any HTTP client
- **Microservices-ready:** Token can be validated by any service without shared session store

**Security considerations:**
- Tokens are signed with `JWT_SECRET` (256-bit random key)
- Tokens expire after 24 hours (configurable via `JWT_EXPIRES_IN`)
- No refresh token mechanism (for simplicity; users re-login after expiry)

**Alternative considered:** Express-session with PostgreSQL session store.

**Why rejected:** Adds database overhead on every request and complicates horizontal scaling.

---

### 3. Thin Controllers, Rich Services

**Decision:** Controllers only parse requests and format responses; all business logic lives in services.

**Rationale:**
- **Single Responsibility Principle:** Controllers handle HTTP; services handle business logic
- **Testability:** Services can be unit tested without HTTP mocking
- **Reusability:** Same service function can be called from multiple controllers or background jobs
- **Maintainability:** Business rules are centralized in one place

**Example:**

```javascript
// Controller (thin)
async createBooking(req, res, next) {
  try {
    const { student_id, lesson_id } = req.body;
    const parent_id = req.user.id;
    
    const booking = await bookingsService.createBooking(student_id, lesson_id, parent_id);
    
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
}

// Service (rich)
async createBooking(studentId, lessonId, parentId) {
  // 1. Validate parent owns student
  const student = await db.query('SELECT * FROM students WHERE id = $1', [studentId]);
  if (!student || student.parent_id !== parentId) {
    throw new Error('Student not found or not owned by parent');
  }
  
  // 2. Check lesson exists
  const lesson = await db.query('SELECT * FROM lessons WHERE id = $1', [lessonId]);
  if (!lesson) {
    throw new Error('Lesson not found');
  }
  
  // 3. Prevent duplicate enrollment
  const existing = await db.query(
    'SELECT * FROM bookings WHERE student_id = $1 AND lesson_id = $2',
    [studentId, lessonId]
  );
  if (existing) {
    throw new Error('Student already enrolled in this lesson');
  }
  
  // 4. Create booking
  return await db.query(
    'INSERT INTO bookings (student_id, lesson_id) VALUES ($1, $2) RETURNING *',
    [studentId, lessonId]
  );
}
```

---

### 4. Bookings as a Join Table

**Decision:** Use a `bookings` table to link students and lessons (many-to-many).

**Rationale:**
- **Proper relational modeling:** Students can enroll in multiple lessons; lessons can have multiple students
- **Referential integrity:** Foreign keys ensure students and lessons exist
- **Duplicate prevention:** Unique constraint on (student_id, lesson_id) prevents double enrollment
- **Efficient queries:** Can easily get all lessons for a student or all students for a lesson
- **Extensible:** Can add fields like enrollment_date, status, payment_info without changing other tables

**Schema:**

```sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, lesson_id)  -- Prevents duplicate enrollments
);
```

**Alternative considered:** Store enrolled_students as JSON array in lessons table.

**Why rejected:** Violates normalization; loses referential integrity; inefficient queries.

---

### 5. Summary vs. Detail Endpoints

**Decision:** Provide separate endpoints for summary views and detailed data.

**Rationale:**
- **Performance:** Summary endpoints return minimal data; detail endpoints return full data
- **Flexibility:** Clients can choose appropriate endpoint based on use case
- **Bandwidth optimization:** Mobile apps can fetch summaries; desktop apps can fetch details

**Examples:**

| Endpoint | Returns | Use Case |
|----------|---------|----------|
| `GET /mentor/lessons` | Lesson list with student_count and session_count | Mentor dashboard |
| `GET /lessons/:id/students` | Full student details (name, username, enrollment date) | Student management page |
| `GET /lessons/:id/sessions` | All session details (date, topic, summary) | Session calendar |

---

## Authentication & Authorization

### Middleware Stack

| Middleware | File | Purpose |
|-----------|------|---------|
| `auth.middleware.js` | Global auth check | Verifies JWT, attaches `req.user` |
| `role.middleware.js` | Role enforcement | Restricts endpoints by user role |
| `error.middleware.js` | Error handler | Catches and formats all errors |
| `notFound.middleware.js` | 404 handler | Handles unknown routes |

---

### Authentication Flow

#### 1. Signup (POST /auth/signup)

```
Client → Server
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "role": "PARENT",
  "username": "john_parent",
  "password": "strongpassword"
}

Server validates:
- All fields present
- Email format valid
- Role is PARENT or MENTOR (not STUDENT)
- Username not already taken

Server hashes password:
- Uses bcryptjs with salt rounds 10
- Stores hash, never plaintext

Server creates user:
INSERT INTO users (first_name, last_name, email, phone, role, username, password_hash)
VALUES (...)

Server responds:
201 Created
{
  "id": "uuid",
  "username": "john_parent",
  "role": "PARENT"
}
```

#### 2. Login (POST /auth/login)

```
Client → Server
{
  "username": "john_parent",
  "password": "strongpassword"
}

Server validates:
- Finds user by username
- Compares password hash using bcrypt.compare()

Server generates JWT:
const token = jwt.sign(
  { id: user.id, role: user.role, type: 'user' },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
);

Server responds:
200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "role": "PARENT",
    "username": "john_parent"
  }
}
```

#### 3. Authenticated Request

```
Client → Server
GET /api/students
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

auth.middleware.js:
1. Extracts token from Authorization header
2. Verifies token signature using JWT_SECRET
3. Checks token expiration
4. Decodes payload: { id, role, type }
5. Attaches to request: req.user = { id, role, type }

If valid: next() → proceed to controller
If invalid: 401 Unauthorized

role.middleware.js (if present):
1. Checks req.user.role against required roles
2. If match: next()
3. If no match: 403 Forbidden
```

---

### Authorization Rules

| Role | Can Create | Can Read | Can Update | Can Delete |
|------|-----------|----------|-----------|-----------|
| **PARENT** | Own students, bookings for own students | Own students, all lessons, enrolled lessons | Own students | Own students |
| **MENTOR** | Own lessons, sessions for own lessons | Own lessons, enrolled students, all lessons | Own lessons, own sessions | Own lessons, own sessions |
| **STUDENT** | Nothing | Own enrolled lessons, sessions for enrolled lessons | Nothing | Nothing |

---

### Role-Based Endpoint Protection

```javascript
// Public endpoints (no auth required)
router.post('/auth/signup', authController.signup);
router.post('/auth/login', authController.login);
router.get('/health', (req, res) => res.send('OK'));

// Authenticated endpoints (any logged-in user)
router.get('/me', auth, authController.getCurrentUser);
router.get('/lessons', auth, lessonsController.getAllLessons);

// Parent-only endpoints
router.post('/students', auth, role('PARENT'), studentsController.createStudent);
router.post('/bookings', auth, role('PARENT'), bookingsController.createBooking);

// Mentor-only endpoints
router.post('/lessons', auth, role('MENTOR'), lessonsController.createLesson);
router.post('/sessions', auth, role('MENTOR'), sessionsController.createSession);

// Multi-role endpoints
router.get('/students/:id/lessons', auth, role('PARENT', 'STUDENT'), studentsController.getStudentLessons);
```

---

### Access Control for Sessions

**Requirement:** Only users associated with a lesson can view its sessions.

**Implementation:** `sessions.service.js` validates access before returning sessions:

```javascript
async getSessionsByLesson(lessonId, userId, userRole, userType) {
  // 1. Check if user has access to this lesson
  let hasAccess = false;
  
  if (userType === 'user' && userRole === 'MENTOR') {
    // Mentors can view sessions for their own lessons
    const lesson = await db.query(
      'SELECT * FROM lessons WHERE id = $1 AND mentor_id = $2',
      [lessonId, userId]
    );
    hasAccess = !!lesson;
  } else if (userType === 'user' && userRole === 'PARENT') {
    // Parents can view sessions if they have a student enrolled
    const enrollment = await db.query(
      'SELECT b.* FROM bookings b ' +
      'JOIN students s ON b.student_id = s.id ' +
      'WHERE b.lesson_id = $1 AND s.parent_id = $2',
      [lessonId, userId]
    );
    hasAccess = !!enrollment;
  } else if (userType === 'student') {
    // Students can view sessions if they are enrolled
    const enrollment = await db.query(
      'SELECT * FROM bookings WHERE lesson_id = $1 AND student_id = $2',
      [lessonId, userId]
    );
    hasAccess = !!enrollment;
  }
  
  if (!hasAccess) {
    throw new Error('Access denied');
  }
  
  // 2. Return sessions for this lesson
  return await db.query(
    'SELECT * FROM sessions WHERE lesson_id = $1 ORDER BY date ASC',
    [lessonId]
  );
}
```

---

## Validation

All incoming requests are validated using **Zod schemas** defined in `src/validators/`.

### Validation Flow

```
1. Client sends request
          ↓
2. Zod validator middleware runs
   - Parses req.body against schema
   - Returns 400 if validation fails
          ↓
3. Controller receives validated data
   - Type-safe (TypeScript benefits from Zod inference)
```

### Example: Booking Validation

```javascript
// src/validators/bookings.validator.js
const { z } = require('zod');

const createBookingSchema = z.object({
  student_id: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  lesson_id: z.string().uuid().optional(),
  lessonId: z.string().uuid().optional()
}).refine(
  (data) => (data.student_id || data.studentId) && (data.lesson_id || data.lessonId),
  { message: 'student_id and lesson_id are required' }
);

// Middleware usage
router.post('/bookings', 
  auth, 
  role('PARENT'), 
  validate(createBookingSchema),  // Zod validation
  bookingsController.createBooking
);
```

### Validation Error Response

```json
// Client sends invalid data
POST /api/bookings
{
  "student_id": "not-a-uuid",
  "lesson_id": "123"
}

// Server responds
400 Bad Request
{
  "message": "Validation failed: student_id must be a valid UUID"
}
```

---

### Input Format Flexibility

The API accepts **both `snake_case` and `camelCase`** for input fields to support different client preferences:

**Both formats are valid:**

```json
// snake_case (Python, Ruby style)
{
  "student_id": "123e4567-e89b-12d3-a456-426614174000",
  "lesson_id": "987fcdeb-51a2-43f1-b789-012345678901"
}

// camelCase (JavaScript style)
{
  "studentId": "123e4567-e89b-12d3-a456-426614174000",
  "lessonId": "987fcdeb-51a2-43f1-b789-012345678901"
}
```

**Applies to:**
- POST /bookings (student_id, lesson_id)
- POST /sessions (lesson_id)
- Any endpoint accepting ID parameters

**Implementation:**

```javascript
// Zod schema accepts both formats
const schema = z.object({
  student_id: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
}).refine(
  (data) => data.student_id || data.studentId,
  { message: 'student_id or studentId is required' }
);

// Service normalizes to snake_case
const studentId = req.body.student_id || req.body.studentId;
```

**Why support both?**
- JavaScript clients prefer camelCase
- Database uses snake_case
- Improved developer experience
- No breaking changes when migrating between styles

---

## Error Handling

All errors are returned in a **consistent JSON format**:

```json
{
  "message": "Human-readable error description"
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| **200** | OK | Successful GET request |
| **201** | Created | Resource successfully created |
| **400** | Bad Request | Validation error, missing required field |
| **401** | Unauthorized | Missing or invalid JWT token |
| **403** | Forbidden | Valid token but insufficient permissions |
| **404** | Not Found | Resource does not exist |
| **409** | Conflict | Duplicate entry (username taken, student already enrolled) |
| **413** | Payload Too Large | Request body exceeds size limit (LLM text too long) |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Unexpected server error |
| **502** | Bad Gateway | External service error (Gemini API failure) |

---

### Error Scenarios and Responses

#### 1. Validation Error (400)

```bash
# Missing required field
POST /api/auth/signup
{
  "username": "john"
  # Missing password, email, etc.
}

# Response
400 Bad Request
{
  "message": "Validation failed: password is required"
}
```

#### 2. Authentication Error (401)

```bash
# Missing token
GET /api/students

# Response
401 Unauthorized
{
  "message": "Authentication required"
}

# Invalid token
GET /api/students
Authorization: Bearer invalid_token

# Response
401 Unauthorized
{
  "message": "Invalid token"
}

# Expired token
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (expired)

# Response
401 Unauthorized
{
  "message": "Token expired"
}
```

#### 3. Authorization Error (403)

```bash
# Student tries to create a lesson (MENTOR only)
POST /api/lessons
Authorization: Bearer <student_token>

# Response
403 Forbidden
{
  "message": "Access denied: MENTOR role required"
}

# Parent tries to book another parent's student
POST /api/bookings
{
  "student_id": "someone_elses_student",
  "lesson_id": "..."
}

# Response
403 Forbidden
{
  "message": "Access denied: you do not own this student"
}
```

#### 4. Not Found (404)

```bash
# Resource doesn't exist
GET /api/lessons/00000000-0000-0000-0000-000000000000

# Response
404 Not Found
{
  "message": "Lesson not found"
}
```

#### 5. Conflict (409)

```bash
# Username already taken
POST /api/auth/signup
{
  "username": "existing_user",
  ...
}

# Response
409 Conflict
{
  "message": "Username already exists"
}

# Student already enrolled
POST /api/bookings
{
  "student_id": "already_enrolled_student",
  "lesson_id": "lesson_id"
}

# Response
409 Conflict
{
  "message": "Student already enrolled in this lesson"
}
```

#### 6. Payload Too Large (413)

```bash
# Text exceeds 10,000 characters
POST /api/llm/summarize
{
  "text": "Very long text..." (>10000 chars)
}

# Response
413 Payload Too Large
{
  "message": "Text exceeds maximum length of 10000 characters"
}
```

#### 7. Rate Limit Exceeded (429)

```bash
# More than 20 requests per minute to LLM endpoint
POST /api/llm/summarize (21st request within 60 seconds)

# Response
429 Too Many Requests
{
  "message": "Rate limit exceeded. Try again in 60 seconds."
}
```

#### 8. Internal Server Error (500)

```bash
# Unexpected error (database connection lost, etc.)
GET /api/lessons

# Response
500 Internal Server Error
{
  "message": "An unexpected error occurred"
}
```

#### 9. External Service Error (502)

```bash
# Gemini API is down or returns error
POST /api/llm/summarize
{
  "text": "Valid text..."
}

# Response
502 Bad Gateway
{
  "message": "Failed to generate summary. Please try again later."
}
```

---

### Error Middleware Implementation

```javascript
// src/middleware/error.middleware.js
const errorHandler = (err, req, res, next) => {
  console.error(err);
  
  // Zod validation errors → 400
  if (err.name === 'ZodError') {
    return res.status(400).json({
      message: `Validation failed: ${err.errors[0].message}`
    });
  }
  
  // JWT errors → 401
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Invalid or expired token'
    });
  }
  
  // Custom error with status code
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message
    });
  }
  
  // Generic server error → 500
  res.status(500).json({
    message: 'An unexpected error occurred'
  });
};
```

---

## API Reference

**Base URL (Live):** `https://mentora-assignment-api.unnambhargav.in/api`  
**Base URL (Local):** `http://localhost:3000/api`

All endpoints are relative to `/api`.

---

### Core Endpoints

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/health` | No | — | Health check (returns "OK") |
| POST | `/auth/signup` | No | — | Register a parent or mentor account |
| POST | `/auth/login` | No | — | Login and receive JWT token |
| GET | `/me` or `/auth/me` | Yes | Any | Get current authenticated user |
| POST | `/students` | Yes | PARENT | Create a student account |
| GET | `/students` | Yes | PARENT | List parent's students |
| POST | `/lessons` | Yes | MENTOR | Create a new lesson |
| POST | `/bookings` | Yes | PARENT | Enroll a student in a lesson |
| POST | `/sessions` | Yes | MENTOR | Create a lesson session |
| GET | `/lessons/:id/sessions` | Yes | Any* | List sessions for a lesson |

*Access restricted to users associated with the lesson (mentor who created it, parents/students enrolled)

---

### Extended Endpoints

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/lessons` | Yes | Any | List all available lessons |
| GET | `/students/:studentId/lessons` | Yes | PARENT, STUDENT | Get lessons for a specific student |
| GET | `/lessons/:lessonId/students` | Yes | MENTOR | Get students enrolled in a lesson |
| GET | `/parent/students` | Yes | PARENT | Parent dashboard (students summary) |
| GET | `/parent/students/:studentId/lessons` | Yes | PARENT | Lessons for a specific child |
| GET | `/mentor/lessons` | Yes | MENTOR | Mentor dashboard (lessons with counts) |

---

### AI Summarization Endpoint

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/llm/summarize` | Yes | Any authenticated | Generate structured text summary |

**Request:**
```json
{
  "text": "Your long-form text to be summarized goes here. Must be at least 50 characters and no more than 10,000 characters."
}
```

**Response:**
```json
{
  "summary": "{\"bullets\":[\"Point one\",\"Point two\",\"Point three\"],\"word_count\":42}",
  "model": "gemini-2.5-flash"
}
```

**Validation Rules:**
- Text field is required
- Minimum length: 50 characters
- Maximum length: 10,000 characters

**Error Codes:**

| Condition | HTTP Code | Response |
|-----------|-----------|----------|
| Text missing or empty | 400 | `{ "message": "Text is required" }` |
| Text too short (<50 chars) | 400 | `{ "message": "Text must be at least 50 characters" }` |
| Text too long (>10,000 chars) | 413 | `{ "message": "Text exceeds maximum length of 10000 characters" }` |
| Rate limit exceeded | 429 | `{ "message": "Rate limit exceeded. Try again in X seconds." }` |
| Gemini API failure | 502 | `{ "message": "Failed to generate summary. Please try again later." }` |

**Rate Limiting:**
- Window: 60 seconds (configurable via `LLM_RATE_LIMIT_WINDOW_MS`)
- Max requests: 20 per window (configurable via `LLM_RATE_LIMIT_MAX_REQUESTS`)
- Applies per IP address

**Summary Format:**
- 3-6 bullet points
- Each bullet <25 words
- Total word count <120 words
- Returns structured JSON (not prose)

---

## API Usage Guide

### Setup

```bash
# Set base URL
export BASE_URL="https://mentora-assignment-api.unnambhargav.in/api"

# For local development
# export BASE_URL="http://localhost:3000/api"

# Token will be set after login
export TOKEN=""
```

---

### 1. Health Check

**Purpose:** Verify API is running

```bash
curl "$BASE_URL/health"
```

**Expected Response:**
```
OK
```

---

### 2. Signup (Create Account)

**Purpose:** Register a new PARENT or MENTOR account

**Note:** Students are NOT created via signup. Parents create students after logging in.

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
    "password": "strongpassword123"
  }'
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_parent",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "role": "PARENT",
  "created_at": "2026-03-09T10:00:00.000Z"
}
```

**Possible Errors:**

| Code | Scenario |
|------|----------|
| 400 | Missing required field, invalid email format |
| 409 | Username or email already exists |

---

### 3. Login

**Purpose:** Authenticate and receive JWT token

```bash
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_parent",
    "password": "strongpassword123"
  }'
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsInJvbGUiOiJQQVJFTlQiLCJ0eXBlIjoidXNlciIsImlhdCI6MTcwOTk3NjAwMCwiZXhwIjoxNzEwMDYyNDAwfQ.xyz123...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_parent",
    "role": "PARENT",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Save token for subsequent requests:**
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Possible Errors:**

| Code | Scenario |
|------|----------|
| 400 | Missing username or password |
| 401 | Invalid credentials |

---

### 4. Get Current User

**Purpose:** Retrieve authenticated user's profile

```bash
curl "$BASE_URL/me" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_parent",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "role": "PARENT"
}
```

**Possible Errors:**

| Code | Scenario |
|------|----------|
| 401 | Missing or invalid token |

---

### 5. Create Student (PARENT only)

**Purpose:** Parent creates a student account under their management

```bash
curl -X POST "$BASE_URL/students" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Alice",
    "last_name": "Doe",
    "username": "alice_student",
    "password": "studentpass123"
  }'
```

**Response (201 Created):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "parent_id": "550e8400-e29b-41d4-a716-446655440000",
  "first_name": "Alice",
  "last_name": "Doe",
  "username": "alice_student",
  "created_at": "2026-03-09T10:05:00.000Z"
}
```

**Note:** Student can now log in using their username and password.

**Possible Errors:**

| Code | Scenario |
|------|----------|
| 400 | Missing required fields |
| 401 | Not authenticated |
| 403 | User is not a PARENT |
| 409 | Username already exists |

---

### 6. List Parent's Students (PARENT only)

**Purpose:** Get all students managed by the authenticated parent

```bash
curl "$BASE_URL/parent/students" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "first_name": "Alice",
    "last_name": "Doe",
    "username": "alice_student",
    "created_at": "2026-03-09T10:05:00.000Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440002",
    "first_name": "Bob",
    "last_name": "Doe",
    "username": "bob_student",
    "created_at": "2026-03-09T10:10:00.000Z"
  }
]
```

**Possible Errors:**

| Code | Scenario |
|------|----------|
| 401 | Not authenticated |
| 403 | User is not a PARENT |

---

### 7. Create Lesson (MENTOR only)

**Purpose:** Mentor creates a new lesson

```bash
curl -X POST "$BASE_URL/lessons" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to Algebra",
    "description": "Learn basic algebraic concepts including variables, equations, and problem-solving strategies."
  }'
```

**Response (201 Created):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440003",
  "mentor_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Introduction to Algebra",
  "description": "Learn basic algebraic concepts including variables, equations, and problem-solving strategies.",
  "created_at": "2026-03-09T10:15:00.000Z"
}
```

**Note:** mentor_id is automatically set from the authenticated user's token.

**Possible Errors:**

| Code | Scenario |
|------|----------|
| 400 | Missing title or description |
| 401 | Not authenticated |
| 403 | User is not a MENTOR |

---

### 8. List All Lessons

**Purpose:** Browse all available lessons (any authenticated user)

```bash
curl "$BASE_URL/lessons" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440003",
    "title": "Introduction to Algebra",
    "description": "Learn basic algebraic concepts...",
    "mentor_id": "550e8400-e29b-41d4-a716-446655440000",
    "mentor_name": "John Doe",
    "created_at": "2026-03-09T10:15:00.000Z"
  },
  {
    "id": "770e8400-e29b-41d4-a716-446655440004",
    "title": "Python Programming",
    "description": "Introduction to Python programming...",
    "mentor_id": "550e8400-e29b-41d4-a716-446655440005",
    "mentor_name": "Jane Smith",
    "created_at": "2026-03-09T09:00:00.000Z"
  }
]
```

**Possible Errors:**

| Code | Scenario |
|------|----------|
| 401 | Not authenticated |

---

### 9. Book Student into Lesson (PARENT only)

**Purpose:** Enroll a student in a lesson

**Note:** Accepts both snake_case and camelCase field names.

```bash
# Using snake_case
curl -X POST "$BASE_URL/bookings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "660e8400-e29b-41d4-a716-446655440001",
    "lesson_id": "770e8400-e29b-41d4-a716-446655440003"
  }'

# Using camelCase (also valid)
curl -X POST "$BASE_URL/bookings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "660e8400-e29b-41d4-a716-446655440001",
    "lessonId": "770e8400-e29b-41d4-a716-446655440003"
  }'
```

**Response (201 Created):**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440006",
  "student_id": "660e8400-e29b-41d4-a716-446655440001",
  "lesson_id": "770e8400-e29b-41d4-a716-446655440003",
  "created_at": "2026-03-09T10:20:00.000Z"
}
```

**Possible Errors:**

| Code | Scenario |
|------|----------|
| 400 | Missing student_id or lesson_id |
| 401 | Not authenticated |
| 403 | Parent does not own the student |
| 404 | Student or lesson not found |
| 409 | Student already enrolled in this lesson |

---

### 10. Create Session (MENTOR only)

**Purpose:** Schedule a session for a lesson

```bash
curl -X POST "$BASE_URL/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lesson_id": "770e8400-e29b-41d4-a716-446655440003",
    "date": "2026-03-15T14:00:00.000Z",
    "topic": "Solving Linear Equations",
    "summary": "We will cover methods for solving single-variable linear equations."
  }'
```

**Response (201 Created):**
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440007",
  "lesson_id": "770e8400-e29b-41d4-a716-446655440003",
  "date": "2026-03-15T14:00:00.000Z",
  "topic": "Solving Linear Equations",
  "summary": "We will cover methods for solving single-variable linear equations.",
  "created_at": "2026-03-09T10:25:00.000Z"
}
```

**Possible Errors:**

| Code | Scenario |
|------|----------|
| 400 | Missing required fields, invalid date format |
| 401 | Not authenticated |
| 403 | Mentor does not own the lesson |
| 404 | Lesson not found |

---

### 11. List Sessions for a Lesson

**Purpose:** View all scheduled sessions for a lesson

**Access Control:** Only accessible to:
- The mentor who created the lesson
- Parents whose students are enrolled
- Students enrolled in the lesson

```bash
curl "$BASE_URL/lessons/770e8400-e29b-41d4-a716-446655440003/sessions" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**
```json
[
  {
    "id": "990e8400-e29b-41d4-a716-446655440007",
    "lesson_id": "770e8400-e29b-41d4-a716-446655440003",
    "date": "2026-03-15T14:00:00.000Z",
    "topic": "Solving Linear Equations",
    "summary": "We will cover methods for solving single-variable linear equations.",
    "created_at": "2026-03-09T10:25:00.000Z"
  },
  {
    "id": "990e8400-e29b-41d4-a716-446655440008",
    "date": "2026-03-22T14:00:00.000Z",
    "topic": "Quadratic Equations",
    "summary": "Introduction to solving quadratic equations.",
    "created_at": "2026-03-09T10:30:00.000Z"
  }
]
```

**Possible Errors:**

| Code | Scenario |
|------|----------|
| 401 | Not authenticated |
| 403 | User does not have access to this lesson |
| 404 | Lesson not found |

---

### 12. List Students Enrolled in a Lesson (MENTOR only)

**Purpose:** View all students enrolled in a lesson

```bash
curl "$BASE_URL/lessons/770e8400-e29b-41d4-a716-446655440003/students" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**
```json
[
  {
    "student_id": "660e8400-e29b-41d4-a716-446655440001",
    "first_name": "Alice",
    "last_name": "Doe",
    "username": "alice_student",
    "enrollment_date": "2026-03-09T10:20:00.000Z"
  },
  {
    "student_id": "660e8400-e29b-41d4-a716-446655440002",
    "first_name": "Bob",
    "last_name": "Doe",
    "username": "bob_student",
    "enrollment_date": "2026-03-09T10:25:00.000Z"
  }
]
```

**Possible Errors:**

| Code | Scenario |
|------|----------|
| 401 | Not authenticated |
| 403 | User is not the mentor for this lesson |
| 404 | Lesson not found |

---

### 13. List Lessons for a Student

**Purpose:** View all lessons a student is enrolled in

```bash
curl "$BASE_URL/students/660e8400-e29b-41d4-a716-446655440001/lessons" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**
```json
[
  {
    "lesson_id": "770e8400-e29b-41d4-a716-446655440003",
    "title": "Introduction to Algebra",
    "description": "Learn basic algebraic concepts...",
    "mentor_name": "John Doe",
    "enrollment_date": "2026-03-09T10:20:00.000Z"
  }
]
```

**Possible Errors:**

| Code | Scenario |
|------|----------|
| 401 | Not authenticated |
| 403 | Parent does not own student, or student querying another student |
| 404 | Student not found |

---

### 14. Mentor Dashboard (MENTOR only)

**Purpose:** View all lessons created by mentor with student and session counts

```bash
curl "$BASE_URL/mentor/lessons" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440003",
    "title": "Introduction to Algebra",
    "description": "Learn basic algebraic concepts...",
    "student_count": 2,
    "session_count": 3,
    "created_at": "2026-03-09T10:15:00.000Z"
  },
  {
    "id": "770e8400-e29b-41d4-a716-446655440009",
    "title": "Advanced Calculus",
    "description": "Differential and integral calculus...",
    "student_count": 5,
    "session_count": 8,
    "created_at": "2026-03-08T09:00:00.000Z"
  }
]
```

**Possible Errors:**

| Code | Scenario |
|------|----------|
| 401 | Not authenticated |
| 403 | User is not a MENTOR |

---

### 15. AI Summarization

**Purpose:** Generate structured bullet-point summary of text

```bash
curl -X POST "$BASE_URL/llm/summarize" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Artificial intelligence (AI) is transforming education by enabling personalized learning experiences, automating administrative tasks, and providing intelligent tutoring systems. Machine learning algorithms analyze student performance data to identify learning gaps and recommend targeted interventions. Natural language processing powers chatbots that answer student questions 24/7. Computer vision enables automated grading of written assignments. However, concerns remain about data privacy, algorithmic bias, and the need for human oversight in educational decision-making."
  }'
```

**Response (200 OK):**
```json
{
  "summary": "{\"bullets\":[\"AI enables personalized learning and intelligent tutoring systems in education\",\"Machine learning analyzes student data to identify gaps and recommend interventions\",\"NLP chatbots provide 24/7 student support while computer vision automates grading\",\"Concerns exist about data privacy, bias, and need for human oversight\"],\"word_count\":48}",
  "model": "gemini-2.5-flash"
}
```

**Parsed Summary:**
```json
{
  "bullets": [
    "AI enables personalized learning and intelligent tutoring systems in education",
    "Machine learning analyzes student data to identify gaps and recommend interventions",
    "NLP chatbots provide 24/7 student support while computer vision automates grading",
    "Concerns exist about data privacy, bias, and need for human oversight"
  ],
  "word_count": 48
}
```

**Possible Errors:**

| Code | Scenario | Response |
|------|----------|----------|
| 400 | Text missing | `{ "message": "Text is required" }` |
| 400 | Text too short | `{ "message": "Text must be at least 50 characters" }` |
| 413 | Text too long | `{ "message": "Text exceeds maximum length of 10000 characters" }` |
| 429 | Rate limit | `{ "message": "Rate limit exceeded. Try again in 45 seconds." }` |
| 502 | Gemini API error | `{ "message": "Failed to generate summary. Please try again later." }` |

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# ─────────────────────────────────────────────────────────────────────────────
# Server Configuration
# ─────────────────────────────────────────────────────────────────────────────

# Port on which the server listens
PORT=3000

# ─────────────────────────────────────────────────────────────────────────────
# Database Configuration
# ─────────────────────────────────────────────────────────────────────────────

# PostgreSQL connection string
# Format: postgresql://<username>:<password>@<host>:<port>/<database>

# Local development (PostgreSQL running on localhost)
# DATABASE_URL=postgresql://root:root@localhost:5432/mentora

# Docker deployment (PostgreSQL in container named 'mentoraDB')
# DATABASE_URL=postgresql://root:root@mentoraDB:5432/mentora

DATABASE_URL=postgresql://<db_user>:<db_password>@<db_host>:5432/<db_name>

# ─────────────────────────────────────────────────────────────────────────────
# JWT Configuration
# ─────────────────────────────────────────────────────────────────────────────

# Secret key for signing JWT tokens (must be strong and random)
# Generate a secure key:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_jwt_secret_here_replace_with_secure_random_string

# Token expiration time (examples: '1h', '1d', '7d')
JWT_EXPIRES_IN=1d

# ─────────────────────────────────────────────────────────────────────────────
# LLM / Google Gemini Configuration
# ─────────────────────────────────────────────────────────────────────────────

# Google Gemini API key
# Get your key from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Gemini model to use for summarization
LLM_MODEL=gemini-2.5-flash

# System prompt for summarization
# IMPORTANT: This prompt must instruct the model to return ONLY valid JSON
LLM_SUMMARIZE_PROMPT=You are an educational assistant. Summarize the provided text into bullet points. You must respond with ONLY a valid JSON object — no markdown, no code blocks, no extra text. Use exactly this format: {"bullets":["point one","point two","point three"],"word_count":42}. Rules: 3 to 6 bullets. Each bullet under 25 words. Total word_count must be under 120. Do not add information not present in the input.

# ─────────────────────────────────────────────────────────────────────────────
# Rate Limiting Configuration
# ─────────────────────────────────────────────────────────────────────────────

# Time window for rate limiting (in milliseconds)
# 60000 = 1 minute
LLM_RATE_LIMIT_WINDOW_MS=60000

# Maximum number of requests allowed per window
LLM_RATE_LIMIT_MAX_REQUESTS=20

# ─────────────────────────────────────────────────────────────────────────────
# Environment
# ─────────────────────────────────────────────────────────────────────────────

# Set to 'production' in production, 'development' for local dev
NODE_ENV=development
```

### Important Notes

> **Never commit your `.env` file to Git.** It contains sensitive credentials.

The `.env` file is already listed in `.gitignore`:
```gitignore
.env
node_modules/
```

### Generating a Secure JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

This generates a 128-character hexadecimal string suitable for JWT signing.

---

## Getting Started

### Prerequisites

- **Node.js 20+** - [Download](https://nodejs.org/)
- **PostgreSQL 16+** - [Download](https://www.postgresql.org/download/)
- **Docker** (optional, for containerized deployment) - [Download](https://www.docker.com/)

---

### Option A — Local Development

**Best for:** Active development, debugging, testing changes

#### Step 1: Clone Repository

#### Step 2: Install Dependencies

```bash
npm install
```

This installs all packages listed in `package.json`:
- express
- pg (PostgreSQL driver)
- jsonwebtoken
- bcryptjs
- zod
- dotenv
- @google/generative-ai
- express-rate-limit

#### Step 3: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:
```env
DATABASE_URL=postgresql://root:root@localhost:5432/mentora
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
GEMINI_API_KEY=<get from https://aistudio.google.com/app/apikey>
```

#### Step 4: Create Database

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database
postgres=# CREATE DATABASE mentora;

# Create user (if needed)
postgres=# CREATE USER root WITH PASSWORD 'root';

# Grant privileges
postgres=# GRANT ALL PRIVILEGES ON DATABASE mentora TO root;

# Exit
postgres=# \q
```

#### Step 5: Apply Schema

```bash
psql -U root -d mentora -f src/db/Create_schema.sql
```

**Expected output:**
```
CREATE EXTENSION
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
```

#### Step 6: Start Server

```bash
node src/server.js
```

**Expected output:**
```
[2026-03-09T10:00:00.000Z] Database connected successfully
[2026-03-09T10:00:00.000Z] Server running on port 3000
```

#### Step 7: Verify

```bash
curl "http://localhost:3000/api/health"
```

**Expected response:**
```
OK
```

---

### Option B — Docker Deployment

**Best for:** Production deployment, environment isolation, reproducible builds

This setup runs both PostgreSQL and the Node.js backend in Docker containers on a shared network.

#### Step 1: Create Docker Network

```bash
docker network create mentoraBridge
```

This creates a bridge network allowing containers to communicate using container names as hostnames.

#### Step 2: Start PostgreSQL Container

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

**Flags explained:**
- `-d` - Run in detached mode (background)
- `--name mentoraDB` - Container name (used as hostname in Docker network)
- `--network mentoraBridge` - Connect to our custom network
- `-e` - Set environment variables
- `-p 5432:5432` - Expose port 5432 to host (for debugging)
- `--restart unless-stopped` - Auto-restart on failure or VM reboot

#### Step 3: Apply Database Schema

Wait 5 seconds for PostgreSQL to initialize, then apply schema:

```bash
docker exec -i mentoraDB psql -U root -d mentora < src/db/Create_schema.sql
```

**Expected output:**
```
CREATE EXTENSION
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
```

#### Step 4: Configure Environment

Create `.env` file with Docker-specific settings:

```env
PORT=3000
DATABASE_URL=postgresql://root:root@mentoraDB:5432/mentora
JWT_SECRET=<your-secret-here>
JWT_EXPIRES_IN=1d
GEMINI_API_KEY=<your-key-here>
LLM_MODEL=gemini-2.5-flash
LLM_SUMMARIZE_PROMPT=You are an educational assistant. Summarize the provided text into bullet points. You must respond with ONLY a valid JSON object — no markdown, no code blocks, no extra text. Use exactly this format: {"bullets":["point one","point two","point three"],"word_count":42}. Rules: 3 to 6 bullets. Each bullet under 25 words. Total word_count must be under 120. Do not add information not present in the input.
LLM_RATE_LIMIT_WINDOW_MS=60000
LLM_RATE_LIMIT_MAX_REQUESTS=20
NODE_ENV=production
```

**Important:** Use `mentoraDB` (container name) as the database host, **not** `localhost`.

#### Step 5: Build Backend Image

```bash
docker build -t mentora_backend_image .
```

**Dockerfile overview:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
```

**Build time:** ~2-3 minutes

#### Step 6: Run Backend Container

```bash
docker run -d \
  --name mentora_backend_container \
  --network mentoraBridge \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  mentora_backend_image
```

**Flags explained:**
- `--env-file .env` - Load environment variables from file
- `-p 3000:3000` - Expose port 3000 to host

#### Step 7: Verify

```bash
# Check container logs
docker logs mentora_backend_container

# Expected output:
# [2026-03-09T10:00:00.000Z] Database connected successfully
# [2026-03-09T10:00:00.000Z] Server running on port 3000

# Test health endpoint
curl "http://localhost:3000/api/health"

# Expected: OK
```

---

### Docker Management Commands

#### View Running Containers
```bash
docker ps
```

#### Stop Containers
```bash
docker stop mentora_backend_container mentoraDB
```

#### Start Containers
```bash
docker start mentoraDB
docker start mentora_backend_container
```

#### View Logs
```bash
# Backend logs
docker logs -f mentora_backend_container

# Database logs
docker logs -f mentoraDB
```

#### Remove Containers
```bash
docker rm -f mentora_backend_container mentoraDB
```

#### Rebuild After Code Changes

```bash
# 1. Stop and remove old container
docker rm -f mentora_backend_container

# 2. Remove old image
docker rmi mentora_backend_image

# 3. Rebuild image
docker build -t mentora_backend_image .

# 4. Run new container
docker run -d \
  --name mentora_backend_container \
  --network mentoraBridge \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  mentora_backend_image
```

#### Database Backup

```bash
# Create backup
docker exec mentoraDB pg_dump -U root mentora > backup.sql

# Restore from backup
docker exec -i mentoraDB psql -U root -d mentora < backup.sql
```

---

## Testing

The project includes **basic validator tests** to verify input handling:

### Run Tests

```bash
npm test
```

**Expected output:**
```
TAP version 13
# Subtest: Bookings Validator
    ok 1 - accepts snake_case fields
    ok 2 - accepts camelCase fields
    ok 3 - rejects missing fields
# Subtest: Sessions Validator
    ok 1 - accepts snake_case fields
    ok 2 - accepts camelCase fields
    ok 3 - validates date format
1..6
# tests 6
# pass 6
# fail 0
```

### Current Test Coverage

**Covered:**
- ✅ Validator schemas (snake_case/camelCase input validation)
- ✅ Zod error handling
- ✅ Input format flexibility

**Not Covered (Future Work):**
- ❌ Service layer unit tests
- ❌ Controller integration tests
- ❌ End-to-end API tests
- ❌ Database query tests
- ❌ Authentication middleware tests

### Test Files

```
tests/
└── validators.test.js    # Validator schema tests
```

### Adding More Tests

To expand test coverage, create additional test files:

```javascript
// tests/services/auth.service.test.js
const { describe, it } = require('node:test');
const assert = require('node:assert');
const authService = require('../../src/services/auth.service');

describe('Auth Service', () => {
  it('should hash passwords correctly', async () => {
    const hash = await authService.hashPassword('testpass');
    assert.ok(hash);
    assert.notEqual(hash, 'testpass');
  });
});
```

---

## Known Limitations

This implementation focuses on **core assignment requirements**. The following features are **intentionally not implemented**:

### ❌ Optional Features Not Included

- **Join session endpoint** - Bonus feature from assignment (track session attendance)
- **API versioning** - No `/v1/` or `/v2/` prefix support
- **Password reset flow** - No email-based password recovery
- **Email notifications** - No automated emails for bookings/sessions
- **File uploads** - No support for lesson materials or attachments
- **Real-time updates** - No WebSocket or Server-Sent Events
- **Pagination** - All list endpoints return full results
- **Search/filtering** - No advanced query capabilities
- **Audit logging** - No activity tracking or change history

### ⚠️ Scope Decisions

- **Test coverage is minimal** - Only validator tests included (service/integration tests would be added in production)
- **No refresh tokens** - Users must re-login after token expiry (24 hours)
- **Rate limiting only on LLM endpoint** - No global rate limiting or abuse prevention
- **No CORS restrictions** - Open to all origins (would be restricted in production)
- **No request size limits** - Except for LLM text (10,000 chars)
- **No database migrations** - Schema changes require manual SQL updates
- **No monitoring/observability** - No Prometheus metrics, APM, or structured logging

### 🔒 Security Considerations for Production

Before deploying to production, consider adding:
- **CORS configuration** - Restrict allowed origins
- **Helmet.js** - Security headers (CSP, HSTS, etc.)
- **Rate limiting** - Global rate limiter (express-rate-limit)
- **Input sanitization** - Prevent XSS/SQL injection
- **HTTPS enforcement** - Redirect all HTTP to HTTPS
- **Database connection pooling limits** - Prevent connection exhaustion
- **Request timeout middleware** - Prevent long-running requests
- **SQL prepared statements** - Already using parameterized queries (✅)
- **Environment-based secrets** - Already using .env (✅)

**Note:** These omissions **do not affect core functionality** or assignment requirements. They represent areas for future enhancement in a production system.

---

## Troubleshooting

### Database Connection Issues

**Problem:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solutions:**

1. **Verify PostgreSQL is running:**
```bash
# macOS/Linux
pg_isready

# Windows
pg_ctl status
```

2. **Check DATABASE_URL format:**
```env
# Local: use localhost
DATABASE_URL=postgresql://root:root@localhost:5432/mentora

# Docker: use container name
DATABASE_URL=postgresql://root:root@mentoraDB:5432/mentora
```

3. **Verify database exists:**
```bash
psql -U root -l | grep mentora
```

4. **Check PostgreSQL logs:**
```bash
# macOS
tail -f /usr/local/var/log/postgres.log

# Linux
tail -f /var/log/postgresql/postgresql-16-main.log

# Docker
docker logs mentoraDB
```

---

### JWT Authentication Failures

**Problem:** `401 Unauthorized` on protected endpoints

**Solutions:**

1. **Verify token format:**
```bash
# Correct format
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ❌ Wrong - missing "Bearer"
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. **Check token expiration:**
- Visit [jwt.io](https://jwt.io)
- Paste your token
- Check `exp` claim (Unix timestamp)
- If expired, log in again to get new token

3. **Verify JWT_SECRET matches:**
- Ensure `.env` file has same `JWT_SECRET` used during signup/login
- If changed, existing tokens are invalid

4. **Check server logs:**
```bash
node src/server.js
# Look for JWT verification errors
```

---

### Docker Network Issues

**Problem:** Backend can't connect to database in Docker

**Solutions:**

1. **Verify containers are on same network:**
```bash
docker network inspect mentoraBridge

# Should show both containers:
# - mentoraDB
# - mentora_backend_container
```

2. **Check DATABASE_URL uses container name:**
```env
# ❌ Wrong - localhost doesn't work in Docker
DATABASE_URL=postgresql://root:root@localhost:5432/mentora

# ✅ Correct - use container name
DATABASE_URL=postgresql://root:root@mentoraDB:5432/mentora
```

3. **Restart containers in order:**
```bash
docker restart mentoraDB
sleep 5  # Wait for DB to initialize
docker restart mentora_backend_container
```

---

### Rate Limit on AI Endpoint

**Problem:** `429 Too Many Requests` on `/llm/summarize`

**Solutions:**

1. **Wait for rate limit window to reset** (default: 60 seconds)

2. **Increase rate limit in `.env`:**
```env
LLM_RATE_LIMIT_WINDOW_MS=60000     # 1 minute
LLM_RATE_LIMIT_MAX_REQUESTS=50     # Increase from 20 to 50
```

3. **Check Gemini API quota:**
- Visit [Google AI Studio](https://aistudio.google.com/)
- Check API usage dashboard
- Free tier: 60 requests/minute

---

### Schema Not Applied

**Problem:** Tables don't exist

**Solutions:**

1. **Verify schema was applied:**
```bash
psql -U root -d mentora -c "\dt"

# Expected output:
#  Schema |    Name    | Type  | Owner
# --------+------------+-------+-------
#  public | users      | table | root
#  public | students   | table | root
#  public | lessons    | table | root
#  public | bookings   | table | root
#  public | sessions   | table | root
```

2. **Reapply schema:**
```bash
psql -U root -d mentora -f src/db/Create_schema.sql
```

3. **For Docker:**
```bash
docker exec -i mentoraDB psql -U root -d mentora < src/db/Create_schema.sql
```

---

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions:**

1. **Find process using port 3000:**
```bash
# macOS/Linux
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

2. **Kill the process:**
```bash
# macOS/Linux
kill -9 <PID>

# Windows
taskkill /PID <PID> /F
```

3. **Use different port:**
```env
PORT=3001
```

---

### Gemini API Errors

**Problem:** `502 Bad Gateway` on summarization

**Solutions:**

1. **Verify API key is valid:**
```bash
curl "https://generativelanguage.googleapis.com/v1/models?key=$GEMINI_API_KEY"
```

2. **Check API key format in `.env`:**
```env
# ❌ Wrong - includes quotes
GEMINI_API_KEY="AIzaSy..."

# ✅ Correct - no quotes
GEMINI_API_KEY=AIzaSy...
```

3. **Test with smaller text:**
```bash
curl -X POST "$BASE_URL/llm/summarize" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"This is a short test to verify the API works."}'
```

4. **Check Gemini service status:**
- Visit [Google Cloud Status](https://status.cloud.google.com/)

---

### CORS Errors in Browser

**Problem:** `Access-Control-Allow-Origin` error

**Note:** CORS is currently **disabled** (allows all origins). If you've enabled CORS restrictions:

**Solution:**

1. **Update CORS config in `src/app.js`:**
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',  // Local frontend
    'https://mentora-app.unnambhargav.in'  // Production frontend
  ],
  credentials: true
}));
```

2. **Install CORS package:**
```bash
npm install cors
```

---

## License

MIT License

Copyright (c) 2026 Unnam Bhargav Sai Karthikeya Chowdary

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
---

## Typical Workflow Example

Here's a complete workflow showing how all components work together:

### 1. Mentor Creates an Account and Lesson

```bash
# Mentor signs up
curl -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Sarah",
    "last_name": "Johnson",
    "email": "sarah@example.com",
    "phone": "1234567890",
    "role": "MENTOR",
    "username": "sarah_mentor",
    "password": "securepass123"
  }'

# Mentor logs in
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "sarah_mentor",
    "password": "securepass123"
  }'
# Save token as MENTOR_TOKEN

# Mentor creates a lesson
curl -X POST "$BASE_URL/lessons" \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Python for Beginners",
    "description": "Learn Python programming from scratch"
  }'
# Save lesson_id
```

### 2. Parent Creates Students and Enrolls Them

```bash
# Parent signs up
curl -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Michael",
    "last_name": "Smith",
    "email": "michael@example.com",
    "phone": "9876543210",
    "role": "PARENT",
    "username": "michael_parent",
    "password": "parentpass123"
  }'

# Parent logs in
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "michael_parent",
    "password": "parentpass123"
  }'
# Save token as PARENT_TOKEN

# Parent creates a student
curl -X POST "$BASE_URL/students" \
  -H "Authorization: Bearer $PARENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Emma",
    "last_name": "Smith",
    "username": "emma_student",
    "password": "studentpass123"
  }'
# Save student_id

# Parent enrolls student in lesson
curl -X POST "$BASE_URL/bookings" \
  -H "Authorization: Bearer $PARENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "<student_id>",
    "lesson_id": "<lesson_id>"
  }'
```

### 3. Mentor Schedules Sessions

```bash
# Mentor creates session
curl -X POST "$BASE_URL/sessions" \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lesson_id": "<lesson_id>",
    "date": "2026-03-20T15:00:00.000Z",
    "topic": "Python Basics - Variables and Data Types",
    "summary": "Introduction to Python variables, data types, and basic operations"
  }'
```

### 4. Student Views Their Lessons and Sessions

```bash
# Student logs in
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "emma_student",
    "password": "studentpass123"
  }'
# Save token as STUDENT_TOKEN

# Student views enrolled lessons
curl "$BASE_URL/students/<student_id>/lessons" \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Student views upcoming sessions
curl "$BASE_URL/lessons/<lesson_id>/sessions" \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

### 5. Anyone Uses AI Summarization

```bash
# Mentor summarizes lesson notes
curl -X POST "$BASE_URL/llm/summarize" \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Python is a high-level, interpreted programming language known for its simple syntax and readability. It supports multiple programming paradigms including procedural, object-oriented, and functional programming. Python has extensive standard libraries and a large ecosystem of third-party packages available through PyPI. Common applications include web development, data science, machine learning, automation, and scientific computing."
  }'
```

---
## Future Enhancements

The current implementation provides a solid foundation for a tutoring platform. The following enhancements are planned for future iterations to improve discoverability, functionality, observability, and user experience.

---

### 1. Subject-Based Lesson Categorization

**Goal:** Enable quick lesson discovery through subject tags and filtering.

**Implementation:**
- Add `subject` field to lessons table with predefined categories (Math, Science, Programming, Languages, Arts, etc.)
- Support multiple subject tags per lesson via a `lesson_subjects` join table
- Implement filtering endpoints:
  ```
  GET /lessons?subject=Math
  GET /lessons?subject=Programming,Science
  ```
- Add subject-based search with autocomplete
- Create subject-specific lesson recommendations

**Benefits:**
- Faster lesson discovery for parents and students
- Improved lesson organization for mentors
- Better analytics on popular subjects

---

### 2. Session Media Integration

**Goal:** Allow mentors to attach video recordings or live meeting links to sessions.

**Implementation:**
- Add `media` field to sessions table:
  ```json
  {
    "type": "video" | "live_meeting",
    "url": "https://zoom.us/j/123456789" | "https://s3.amazonaws.com/...",
    "platform": "Zoom" | "Google Meet" | "Microsoft Teams" | "Recorded",
    "duration_minutes": 60,
    "access_expires_at": "2026-12-31T23:59:59Z"
  }
  ```
- Create new endpoint: `GET /sessions/:id/media`
- Validate URLs before storage (check domain whitelist)
- Implement access control:
  - Only enrolled students and session owner can access media
  - Temporary signed URLs for recorded videos (S3 presigned URLs)
  - Meeting link visibility control (show 15 minutes before session starts)
- Track media engagement:
  - Video watch time
  - Live session attendance
  - Completion rates

**Benefits:**
- Centralized access to all session materials
- Flexible delivery (live or recorded)
- Better tracking of student engagement
- Support for asynchronous learning

---

### 3. Observability Stack Integration

**Goal:** Implement comprehensive monitoring, logging, and alerting using industry-standard tools.

**Implementation:**

#### **Metrics — Prometheus + Grafana**
- Instrument backend with `prom-client`:
  ```javascript
  // Metrics to track:
  - HTTP request rate, duration, error rate (RED metrics)
  - Database connection pool usage
  - JWT token generation/validation rate
  - LLM API calls, latency, success rate
  - Active users, lessons, bookings
  - Session creation rate
  ```
- Deploy Prometheus server to scrape `/metrics` endpoint
- Create Grafana dashboards:
  - **System Health:** CPU, memory, disk, network
  - **API Performance:** Request latency p50/p95/p99, throughput
  - **Business Metrics:** Active users, new signups, lesson bookings
  - **LLM Usage:** Summarization requests, token consumption, costs

#### **Logging — InfluxDB (Time-Series)**
- Replace console.log with structured logging (Winston or Pino)
- Send logs to InfluxDB for time-series analysis
- Track:
  - User authentication events
  - Booking transactions
  - LLM API usage patterns
  - Error rates by endpoint
- Retention policies (7 days for debug logs, 90 days for audit logs)

#### **Alerting**
- Set up Prometheus Alertmanager:
  - Alert on API error rate > 5%
  - Alert on database connection pool exhaustion
  - Alert on LLM API failures
  - Alert on JWT secret rotation needed
- Integrate with Slack/PagerDuty for incident response

**Benefits:**
- Real-time visibility into system health
- Proactive issue detection before users complain
- Data-driven capacity planning
- Performance optimization insights

---

### 4. OAuth 2.0 Google Sign-In

**Goal:** Replace traditional email/password authentication with Google OAuth for enhanced security and user convenience.

**Implementation:**

#### **Backend Changes**
- Add OAuth flow using `passport-google-oauth20`:
  ```javascript
  GET /auth/google          // Redirect to Google consent screen
  GET /auth/google/callback // Handle OAuth callback
  ```
- Store Google user data:
  ```sql
  ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
  ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
  ALTER TABLE users ADD COLUMN avatar_url TEXT;
  ```
- Support hybrid authentication:
  - Users can sign up with Google OR email/password
  - Link Google account to existing email/password account
- Email verification via Google eliminates need for custom email verification flow

#### **Security Improvements**
- Gmail addresses guaranteed to be valid and owned by user
- No password storage for OAuth users (reduces breach impact)
- Leverage Google's 2FA for enhanced security
- Automatic email verification

#### **User Experience**
- One-click signup/login for users with Google accounts
- Auto-populate profile (name, email, avatar) from Google
- Faster onboarding (no password creation required)

**Migration Strategy:**
- Existing users keep email/password auth
- New users can choose Google or traditional signup
- Gradual migration via email prompts: "Sign in with Google for faster access"

**Benefits:**
- Reduced friction in signup process
- Higher conversion rates (one-click vs. form filling)
- Better security (no weak passwords)
- Reduced support burden (fewer password reset requests)

---

### 5. Advanced Lesson Metadata and Filtering

**Goal:** Add rich metadata to lessons for sophisticated discovery and personalization.

**Implementation:**

#### **New Lesson Fields**
```sql
ALTER TABLE lessons ADD COLUMN location_type VARCHAR(20); -- 'online', 'in-person', 'hybrid'
ALTER TABLE lessons ADD COLUMN address TEXT;              -- For in-person lessons
ALTER TABLE lessons ADD COLUMN languages TEXT[];          -- ['English', 'Spanish', 'Hindi']
ALTER TABLE lessons ADD COLUMN difficulty_level VARCHAR(20); -- 'beginner', 'intermediate', 'advanced'
ALTER TABLE lessons ADD COLUMN min_age INT;
ALTER TABLE lessons ADD COLUMN max_age INT;
ALTER TABLE lessons ADD COLUMN price_per_session DECIMAL(10,2);
ALTER TABLE lessons ADD COLUMN max_students INT;          -- Class size limit
ALTER TABLE lessons ADD COLUMN timezone VARCHAR(50);      -- 'America/New_York'
```

#### **Enhanced Filtering**
```javascript
GET /lessons?location=online
GET /lessons?language=English,Spanish
GET /lessons?difficulty=beginner
GET /lessons?age_group=8-12
GET /lessons?price_max=50
GET /lessons?subject=Math&location=online&language=English
```

#### **Geolocation Features**
- Store mentor location (latitude, longitude)
- Find lessons within X miles of user:
  ```
  GET /lessons/nearby?lat=40.7128&lng=-74.0060&radius=10
  ```
- Display lessons on interactive map (frontend)

#### **Multi-Language Support**
- Lessons taught in multiple languages
- UI language selection for platform
- Automatic translation of lesson descriptions (Google Translate API)

**Benefits:**
- Better lesson matching for diverse user base
- Support for global mentorship (online lessons across timezones)
- Localized experience for non-English speakers
- Price transparency and budget filtering

---

### 6. Payment Gateway Integration

**Goal:** Monetize the platform by implementing paid lesson enrollments with secure payment processing.

**Implementation:**

#### **Payment Provider Integration (Stripe)**
- Add Stripe SDK and webhooks
- New endpoints:
  ```javascript
  POST /payments/create-checkout-session  // Initialize payment
  POST /payments/webhook                  // Handle Stripe events
  GET /payments/history                   // User payment history
  ```

#### **Database Schema**
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  lesson_id UUID REFERENCES lessons(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20), -- 'pending', 'completed', 'failed', 'refunded'
  stripe_payment_intent_id VARCHAR(255),
  stripe_session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lesson_pricing (
  lesson_id UUID REFERENCES lessons(id),
  price_per_session DECIMAL(10,2),
  price_per_month DECIMAL(10,2),   -- Subscription model
  trial_sessions INT DEFAULT 0,     -- Free trial sessions
  currency VARCHAR(3) DEFAULT 'USD'
);
```

#### **Payment Flow**
1. Parent browses lessons → sees pricing
2. Parent clicks "Enroll & Pay" → redirected to Stripe Checkout
3. Stripe processes payment → sends webhook to backend
4. Backend verifies webhook signature → creates booking
5. Student gets access to lesson sessions
6. Email receipt sent to parent

#### **Pricing Models**
- **Pay-per-session:** Parent pays for individual sessions
- **Monthly subscription:** Unlimited sessions in a lesson for fixed monthly fee
- **Package deals:** Buy 10 sessions, get 2 free
- **Trial periods:** First 2 sessions free, then paid

#### **Security & Compliance**
- Never store credit card details (Stripe handles PCI compliance)
- Webhook signature verification
- Idempotency keys for payment retries
- Refund handling for cancelled sessions

#### **Revenue Sharing**
- Platform takes commission (e.g., 15%) from each transaction
- Mentors receive payouts via Stripe Connect
- Automatic payout scheduling (weekly/monthly)

**Benefits:**
- Revenue generation for platform sustainability
- Professional monetization for mentors
- Transparent pricing for parents
- Secure, trusted payment processing

---

### 7. Admin Dashboard and Management System

**Goal:** Provide platform administrators with tools to monitor, manage, and moderate the entire application.

**Implementation:**

#### **New Admin User Role**
```sql
ALTER TABLE users ADD COLUMN role VARCHAR(20) CHECK (role IN ('PARENT', 'MENTOR', 'STUDENT', 'ADMIN'));
```

#### **Admin Endpoints**
```javascript
// User Management
GET    /admin/users                      // List all users with filters
GET    /admin/users/:id                  // User details + activity
PUT    /admin/users/:id/suspend          // Suspend user account
PUT    /admin/users/:id/unsuspend        // Reactivate account
DELETE /admin/users/:id                  // Permanently delete user

// Content Moderation
GET    /admin/lessons/pending            // Lessons awaiting approval
PUT    /admin/lessons/:id/approve        // Approve lesson
PUT    /admin/lessons/:id/reject         // Reject lesson (with reason)
DELETE /admin/lessons/:id                // Remove inappropriate lesson

// Platform Analytics
GET    /admin/analytics/overview         // High-level metrics
GET    /admin/analytics/revenue          // Payment metrics
GET    /admin/analytics/engagement       // User activity metrics

// System Logs
GET    /admin/logs?level=error           // Filter logs by level
GET    /admin/logs?user_id=123           // User-specific logs
GET    /admin/logs?date_range=...        // Time-based logs

// Access Control
GET    /admin/permissions                // List all role permissions
PUT    /admin/permissions/:role          // Modify role permissions
GET    /admin/audit-trail                // All admin actions logged
```

#### **Admin Dashboard Features**

**User Management:**
- View all users (parents, mentors, students, admins)
- Search by username, email, role
- Suspend/ban users for policy violations
- Reset user passwords
- Merge duplicate accounts
- View user activity history (logins, bookings, sessions)

**Content Moderation:**
- Review flagged lessons for inappropriate content
- Approve/reject new mentor applications
- Monitor session topics for policy compliance
- Handle user-reported content

**Platform Monitoring:**
- Real-time active users count
- System health status (API, database, LLM service)
- Error rates by endpoint
- Slow query detection
- Database connection pool usage

**Financial Oversight:**
- Total revenue (daily, monthly, yearly)
- Revenue by lesson, mentor, subject
- Failed payment tracking
- Refund requests and approvals
- Mentor payout status

**Security & Compliance:**
- Failed login attempts (potential brute force)
- API rate limit violations
- Suspicious activity alerts
- GDPR data export requests
- Right to be forgotten (data deletion)

**Configuration Management:**
- Modify platform settings (LLM rate limits, session durations)
- Feature flags (enable/disable features for testing)
- Environment variable management (non-sensitive)
- Email template editing

#### **Admin Dashboard UI (Frontend)**
- Built with React Admin or Retool
- Charts and graphs (Recharts, Chart.js)
- Real-time updates (WebSocket for live metrics)
- Dark mode for late-night monitoring

#### **Access Control & Audit Trail**
- Admin actions logged to `admin_audit_log` table:
  ```sql
  CREATE TABLE admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id),
    action VARCHAR(50),  -- 'suspend_user', 'delete_lesson', etc.
    target_type VARCHAR(20), -- 'user', 'lesson', 'session'
    target_id UUID,
    reason TEXT,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
- Two-factor authentication required for admin accounts
- Admin actions require reason/justification
- Admins cannot modify their own permissions

**Benefits:**
- Centralized platform management
- Faster response to user issues and reports
- Data-driven decision making
- Compliance with regulations (GDPR, COPPA)
- Reduced operational overhead

---

## Implementation Priority

Based on impact and complexity, recommended implementation order:

| Priority | Enhancement | Impact | Complexity | Timeline |
|----------|------------|--------|-----------|----------|
| **1** | Subject Tags | High | Low | 1 week |
| **2** | Session Media Links | High | Medium | 2 weeks |
| **3** | Advanced Filtering (Location, Language) | High | Medium | 2 weeks |
| **4** | Google OAuth | Medium | Medium | 2 weeks |
| **5** | Payment Gateway | High | High | 4 weeks |
| **6** | Observability Stack | Medium | Medium | 3 weeks |
| **7** | Admin Dashboard | Medium | High | 4 weeks |

**Total estimated timeline for all enhancements:** ~18 weeks (4.5 months)

---

## Technical Considerations

### Database Migration Strategy
- Use Flyway or Knex.js for version-controlled migrations
- Zero-downtime migrations with backward-compatible changes
- Rollback plans for each migration

### API Versioning
- Introduce `/v1/` prefix to current endpoints
- New features in `/v2/` with deprecation notices for v1
- Support both versions during transition period

### Performance Optimization
- Implement Redis caching for frequently accessed data (lesson lists, user profiles)
- Database query optimization (indexes on filtered columns)
- CDN for static assets (lesson images, videos)
- Lazy loading for large lists (pagination)

### Security Hardening
- Rate limiting on all endpoints (not just LLM)
- Input sanitization against XSS and SQL injection
- CORS configuration with whitelist
- Content Security Policy headers
- Regular dependency audits (`npm audit`)

### Scalability Planning
- Horizontal scaling with load balancer (Nginx, AWS ALB)
- Database read replicas for reporting queries
- Microservices architecture for high-traffic features (payments, LLM)
- Message queue for async tasks (email sending, notifications)

---

*These enhancements will transform Mentora from a functional MVP into a production-ready, scalable tutoring platform capable of serving thousands of users while maintaining high performance, security, and user satisfaction.*

*Mentora is built for **clarity and scale** — with a clean service-oriented architecture that keeps routing, business logic, validation, and external integrations clearly separated and independently maintainable.*

**Built with ❤️ for the educational community**
