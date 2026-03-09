# Mentora

**A full-stack tutoring platform** for managing students, lessons, sessions, and AI-powered text summarization — built with a modular Node.js/Express backend, a React/TypeScript frontend, and deployed end-to-end on cloud infrastructure.

🌐 **Live Application:** [mentora-app.unnambhargav.in](https://mentora-app.unnambhargav.in)
⚡ **Live API:** [mentora-assignment-api.unnambhargav.in/api](https://mentora-assignment-api.unnambhargav.in/api)

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
- [Error Handling](#error-handling)
- [API Reference](#api-reference)
- [API Usage Guide](#api-usage-guide)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
  - [Option A — Local Development](#option-a--local-development)
  - [Option B — Docker Deployment](#option-b--docker-deployment)
- [License](#license)

---

## Overview

Mentora is a role-based tutoring management platform supporting three distinct user types:

| Role | Capabilities |
|---|---|
| **PARENT** | Register students, browse and book lessons, track sessions via calendar |
| **MENTOR** | Create lessons, schedule sessions, manage enrolled students |
| **STUDENT** | View enrolled lessons and upcoming sessions |

The platform includes an AI-powered assistant that summarizes text into structured bullet points using Google's Gemini LLM.

---

## Architecture

### Full Stack & Deployment

![Mentora Full Stack Architecture & Deployment](./Mentora_fullstack_deployment_architecture.png)

The system is split into two independently deployed components:

- **Frontend** — a static React/Vite SPA deployed to Cloudflare's global CDN via Cloudflare Pages, triggered automatically on every push to the `main` branch of the GitHub repository.
- **Backend** — a containerized Node.js/Express API running on an AWS EC2 instance, fronted by Nginx for SSL termination and reverse proxying.

DNS for both subdomains is managed through Cloudflare:

| Subdomain | Points To |
|---|---|
| `mentora-app.unnambhargav.in` | Cloudflare Pages (global CDN) |
| `mentora-assignment-api.unnambhargav.in` | AWS EC2 VM public IP |

### Backend Architecture

![Mentora Backend Architecture](./Mentora_backend_architecture.png)

The backend follows a **modular service-based structure**:

```
Route → Controller → Service → Database
```

| Layer | Responsibility |
|---|---|
| **Routes** | Define HTTP endpoints and attach middleware |
| **Controllers** | Parse requests, call services, send responses |
| **Services** | Contain business logic and execute database queries |
| **Database** | Accessed through `config/db.js` via connection pool |

### Database Schema

![Simplified ER Diagram](./src/db/ER_Diagram_simplified.png)

The schema is initialized using `create_schema.sql` in `src/db/`. This file is applied **once** after the database is created and before the server is started for the first time.

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| UI Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Routing | React Router v6 |
| Data Fetching | TanStack Query (React Query) |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| Hosting | Cloudflare Pages |

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express.js |
| Database | PostgreSQL 16 |
| Auth | JWT (stateless) |
| Validation | Zod |
| LLM Integration | Google Gemini API |
| Containerization | Docker |
| Reverse Proxy | Nginx + Let's Encrypt SSL |
| Hosting | AWS EC2 |

---

## Features

- **Role-based access control** — PARENT, MENTOR, and STUDENT roles with strictly enforced permissions at the middleware level
- **Student management** — parents create and manage their own students independently of the users table
- **Lesson booking** — many-to-many enrollment via a bookings join table with duplicate prevention
- **Session scheduling** — mentors create sessions per lesson; all roles view sessions via an interactive calendar
- **AI summarization** — authenticated users submit text and receive structured JSON bullet-point summaries powered by Gemini, with rate limiting and graceful error handling
- **CI/CD pipeline** — frontend deploys automatically from GitHub to Cloudflare Pages on every push
- **HTTPS everywhere** — Let's Encrypt certificates managed by Certbot on Nginx; Cloudflare handles TLS for the frontend

---

## Deployment

### Frontend — Cloudflare Pages

The frontend is deployed as a static site via Cloudflare Pages with automatic CI/CD:

1. Developer pushes source code to GitHub (`main` branch)
2. Cloudflare Pages detects the push via webhook
3. Cloudflare runs `npm run build` (Vite), injecting all `VITE_` environment variables at build time
4. The compiled `dist/` output is deployed globally across Cloudflare's CDN
5. Live at `https://mentora-app.unnambhargav.in`

> **No `.env` file is committed to the repository.** All environment variables are configured directly in the Cloudflare Pages dashboard under Settings → Environment Variables.

**Build configuration:**
| Setting | Value |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | 20 |

---

### Backend — AWS EC2 with Docker & Nginx

The backend runs on an AWS EC2 Ubuntu instance with the following stack:

```
Internet
  ↓ HTTPS :443
Nginx (SSL termination via Let's Encrypt)
  ↓ HTTP :3000 (localhost only)
mentora_backend_container (Node.js/Express)
  ↓ TCP :5432 (Docker bridge network)
mentoraDB (PostgreSQL 16)
```

**How it works:**

- Nginx listens on port 443, terminates TLS using a Let's Encrypt certificate obtained via Certbot, and reverse proxies all traffic to the Node.js container on `localhost:3000`
- The Node.js container and PostgreSQL container are both on a shared Docker bridge network (`mentoraBridge`), allowing them to communicate using container names as hostnames
- Both containers run with `--restart unless-stopped` to survive VM reboots
- The internal hop from Nginx to the container is plain HTTP over localhost — it never leaves the machine

**Nginx configuration (simplified):**
```nginx
server {
    listen 443 ssl;
    server_name mentora-assignment-api.unnambhargav.in;

    ssl_certificate /etc/letsencrypt/live/mentora-assignment-api.unnambhargav.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mentora-assignment-api.unnambhargav.in/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Project Structure

```
src/
├── app.js              # Express middleware, routes, and global error handling
├── server.js           # Entry point — starts server after verifying DB connectivity
├── config/             # Environment variables and database connection pool
├── routes/             # Endpoint definitions and middleware attachment
├── controllers/        # HTTP request/response logic
├── services/           # Business logic and database queries
├── validators/         # Zod request validation schemas
├── middleware/         # Auth, role checks, error handling, 404
├── utils/              # Shared helper utilities
└── db/
    └── create_schema.sql  # Database schema — applied once on first setup
```

---

## Request Flow

```
Client
  │
  ▼
Route          ← Defines the endpoint and attaches middleware
  │
  ▼
Middleware     ← JWT verification, role checks, Zod validation
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

Students live in a dedicated `students` table rather than in `users`.

- Students authenticate independently
- A single parent may manage multiple students
- Students follow a different permission model from parents and mentors
- Prevents mixing authentication roles with managed accounts

This separation enables cleaner authorization and clearer domain modeling.

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

Controllers handle only request parsing and response sending. All business rules, ownership validation, and database operations live in the service layer — improving maintainability, testability, and reuse across endpoints.

### Bookings as a join table

Students link to lessons through a `bookings` table, providing:
- A proper many-to-many relationship
- Database-level referential integrity
- A unique constraint preventing duplicate enrollments
- Efficient querying and aggregation

### Summary vs. detail endpoints

| Endpoint | Returns |
|---|---|
| `GET /mentor/lessons` | Summary view with student and session counts |
| `GET /lessons/:lessonId/students` | Full enrolled student list |
| `GET /lessons/:id/sessions` | Full session list |

---

## Authentication & Authorization

### Middleware

| Middleware | Purpose |
|---|---|
| `auth.middleware.js` | Verifies JWT and attaches the authenticated user to `req.user` |
| `role.middleware.js` | Restricts endpoints based on user role |
| `error.middleware.js` | Centralized error handling |
| `notFound.middleware.js` | Handles unknown routes |

### Roles

```
PARENT | MENTOR | STUDENT
```

### Access Rules

| Role | Permissions |
|---|---|
| **PARENT** | Create and manage their own students; book lessons only for their own students |
| **MENTOR** | Create and manage their own lessons; create sessions; view enrolled students |
| **STUDENT** | View only their own lessons |
| **Authenticated** | View sessions for any lesson they are associated with |

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

| Code | Meaning |
|---|---|
| 200 | Successful request |
| 201 | Resource created |
| 400 | Validation error |
| 401 | Authentication required |
| 403 | Forbidden |
| 404 | Resource not found |
| 409 | Conflict |
| 413 | Payload too large |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 502 | External provider error |

---

## API Reference

**Base URL (Live):** `https://mentora-assignment-api.unnambhargav.in/api`

All endpoints are relative to `/api`.

### Core Endpoints

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/health` | No | — | Health check |
| POST | `/auth/signup` | No | — | Register a parent or mentor |
| POST | `/auth/login` | No | — | Login and receive a JWT token |
| GET | `/auth/me` | Yes | Any | Return authenticated account |
| POST | `/students` | Yes | PARENT | Create a student |
| GET | `/students` | Yes | PARENT | List parent's students |
| POST | `/lessons` | Yes | MENTOR | Create a lesson |
| POST | `/bookings` | Yes | PARENT | Book a student into a lesson |
| POST | `/sessions` | Yes | MENTOR | Create a lesson session |
| GET | `/lessons/:id/sessions` | Yes | Any | List sessions for a lesson |

### Extended Endpoints

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/lessons` | Yes | Any | List all lessons |
| GET | `/students/:studentId/lessons` | Yes | PARENT, STUDENT | Lessons assigned to a student |
| GET | `/lessons/:lessonId/students` | Yes | MENTOR | Students enrolled in a lesson |
| GET | `/parent/students` | Yes | PARENT | Parent dashboard |
| GET | `/parent/students/:studentId/lessons` | Yes | PARENT | Lessons for a specific child |
| GET | `/mentor/lessons` | Yes | MENTOR | Mentor lesson dashboard with counts |

### AI Summarization Endpoint

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| POST | `/llm/summarize` | Yes | Any authenticated | Generate a structured text summary |

**Request body:**
```json
{
  "text": "Your long-form text to be summarized goes here."
}
```

**Response:**
```json
{
  "summary": "{\"bullets\":[\"Point one\",\"Point two\",\"Point three\"],\"word_count\":42}",
  "model": "gemini-2.5-flash"
}
```

**Error codes:**

| Condition | Code |
|---|---|
| `text` field missing | 400 |
| `text` below minimum length | 400 |
| `text` exceeds maximum length | 413 |
| Rate limit exceeded | 429 |
| LLM provider error | 502 |

**Rate limiting:** Protected by a sliding window rate limiter configured via `LLM_RATE_LIMIT_WINDOW_MS` and `LLM_RATE_LIMIT_MAX_REQUESTS`.

---

## API Usage Guide

```bash
export BASE_URL="https://mentora-assignment-api.unnambhargav.in/api"
export TOKEN="<your-jwt-token>"
```

---

### Health Check

```bash
curl "$BASE_URL/health"
```
Expected: `OK`

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

| Code | Meaning |
|---|---|
| 201 | Account created |
| 400 | Validation error |
| 409 | Username already exists |

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

Save the token:
```bash
export TOKEN="<JWT_TOKEN>"
```

---

### Get Current User

```bash
curl "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN"
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

| Code | Meaning |
|---|---|
| 201 | Booking created |
| 403 | Parent does not own the student |
| 404 | Lesson not found |
| 409 | Student already enrolled |

---

### Create Session *(MENTOR only)*

```bash
curl -X POST "$BASE_URL/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lesson_id": "<LESSON_UUID>",
    "date": "2026-03-08T10:00:00.000Z",
    "topic": "Fractions",
    "summary": "Basic fractions introduction"
  }'
```

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

---

## Environment Variables

Create a `.env` file in the project root. All variables below are required.

```env
# ─── Server ────────────────────────────────────────────────────────────────────

PORT=3000

# ─── Database ──────────────────────────────────────────────────────────────────
# Local:  DATABASE_URL=postgresql://root:root@localhost:5432/mentora
# Docker: Use the DB container name as the host (not localhost)
#         DATABASE_URL=postgresql://root:root@mentoraDB:5432/mentora

DATABASE_URL=postgresql://<db_user>:<db_password>@<db_host>:5432/<db_name>

# ─── JWT ───────────────────────────────────────────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=1d

# ─── LLM / Gemini ──────────────────────────────────────────────────────────────
# API key from: https://aistudio.google.com/app/apikey

GEMINI_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-2.5-flash
LLM_SUMMARIZE_PROMPT=You are an educational assistant. Summarize the provided text into bullet points. You must respond with ONLY a valid JSON object — no markdown, no code blocks, no extra text. Use exactly this format: {"bullets":["point one","point two","point three"],"word_count":42}. Rules: 3 to 6 bullets. Each bullet under 25 words. Total word_count must be under 120. Do not add information not present in the input.

# ─── LLM Rate Limiting ─────────────────────────────────────────────────────────

LLM_RATE_LIMIT_WINDOW_MS=60000
LLM_RATE_LIMIT_MAX_REQUESTS=20

# ─── Environment ───────────────────────────────────────────────────────────────

NODE_ENV=development
```

> **Never commit your `.env` file.** It is listed in `.gitignore`.

---

## Getting Started

### Option A — Local Development

**Prerequisites:** Node.js 20+, PostgreSQL running locally.

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd mentora-backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in your values

# 4. Create the database
psql -U root -c "CREATE DATABASE mentora;"

# 5. Apply the schema (once only)
psql -U root -d mentora -f src/db/create_schema.sql

# 6. Start the server
node src/server.js
```

Verify:
```bash
curl "http://localhost:3000/api/health"
# Expected: OK
```

---

### Option B — Docker Deployment

This runs both the database and the backend as Docker containers on a shared bridge network.

#### Step 1 — Create a shared Docker network

```bash
docker network create mentoraBridge
```

#### Step 2 — Start the database container

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

#### Step 3 — Apply the schema *(once only)*

```bash
docker exec -i mentoraDB psql -U root -d mentora < src/db/create_schema.sql
```

#### Step 4 — Configure `.env`

Set `DATABASE_URL` to use the container name as the host:

```env
DATABASE_URL=postgresql://root:root@mentoraDB:5432/mentora
```

#### Step 5 — Build and run the backend container

```bash
docker build -t mentora_backend_image .

docker run -d \
  --name mentora_backend_container \
  --network mentoraBridge \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  mentora_backend_image
```

#### Step 6 — Verify

```bash
curl "http://localhost:3000/api/health"
# Expected: OK
```

#### Rebuilding after code changes

```bash
docker rm -f mentora_backend_container
docker rmi mentora_backend_image
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

| Step | Action |
|---|---|
| 1 | **Signup** — Create a PARENT or MENTOR account |
| 2 | **Login** — Receive a JWT token |
| 3 | **Export token** — `export TOKEN="<your-jwt-token>"` |
| 4 | **Create resources** — Students, lessons, bookings, sessions |
| 5 | **Query dashboards** — Use mentor and parent dashboard endpoints |
| 6 | **Summarize** — Use the AI endpoint as needed |

All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## License

Copyright (C) 2026 Unnam Bhargav Sai Karthikeya Chowdary

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.

You are free to use, copy, modify, and distribute this software — including for commercial purposes — **provided that any derivative work or distribution is also released under the same GPL-3.0 license with full source code made publicly available**.

Closing the source, sublicensing under a proprietary license, or distributing modified versions without making the source code available under GPL-3.0 constitutes a violation of this license and will be subject to legal action.

See the full license text at: [https://www.gnu.org/licenses/gpl-3.0.en.html](https://www.gnu.org/licenses/gpl-3.0.en.html)

---

*Mentora is built for clarity and scale — with a clean service-oriented architecture that keeps routing, business logic, validation, and external integrations clearly separated and independently maintainable.*