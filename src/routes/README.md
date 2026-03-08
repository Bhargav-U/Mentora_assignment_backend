
---

# Routes

## Purpose

The `routes/` directory defines the **HTTP endpoints** exposed by the Mentora backend.

Each route module groups related endpoints by **domain or feature** and maps HTTP requests to their corresponding controllers.

Routes are responsible for:

* defining endpoint URLs
* mapping HTTP methods (`GET`, `POST`, etc.)
* attaching middleware such as authentication and authorization
* forwarding requests to controllers

Routes should remain **lightweight** and should not contain business logic or database queries.

---

# Role of Routes in the Architecture

The backend follows a modular layered architecture:

```
Client Request
      ↓
Routes
      ↓
Controllers
      ↓
Services
      ↓
Database
```

Within this flow, the route layer defines **how external HTTP requests enter the system**.

Routes determine:

* the endpoint structure
* the middleware stack
* the controller responsible for handling the request

---

# Route Organization

Endpoints are grouped into separate route modules based on **functional areas** of the system.

This structure keeps the API organized and easier to scale as the project grows.

Example structure:

```
routes/
   auth.routes.js
   students.routes.js
   lessons.routes.js
   bookings.routes.js
   sessions.routes.js
   parent.routes.js
   mentor.routes.js
   llm.routes.js
   index.js
```

---

# Route Modules

## `auth.routes.js`

Handles authentication-related endpoints.

Endpoints include:

| Method | Endpoint       | Description                           |
| ------ | -------------- | ------------------------------------- |
| POST   | `/auth/signup` | Register a new parent or mentor       |
| POST   | `/auth/login`  | Authenticate user and return JWT      |
| GET    | `/auth/me`     | Return the authenticated user profile |

These routes are typically public except for `/auth/me`, which requires authentication.

---

## `students.routes.js`

Handles student management functionality.

Students are created and managed by **parents**.

Endpoints include:

| Method | Endpoint                       | Description                                |
| ------ | ------------------------------ | ------------------------------------------ |
| POST   | `/students`                    | Create a student under a parent account    |
| GET    | `/students`                    | List all students belonging to the parent  |
| GET    | `/students/:studentId/lessons` | List lessons booked for a specific student |

These routes enforce **ownership rules** to ensure parents only manage their own students.

---

## `lessons.routes.js`

Handles lesson management.

Lessons are created and owned by **mentors**.

Endpoints include:

| Method | Endpoint                      | Description                         |
| ------ | ----------------------------- | ----------------------------------- |
| GET    | `/lessons`                    | List available lessons              |
| POST   | `/lessons`                    | Create a new lesson                 |
| GET    | `/lessons/:lessonId/students` | List students enrolled in a lesson  |
| GET    | `/lessons/:lessonId/sessions` | List sessions belonging to a lesson |

These routes allow both **mentors and students** to view lesson information.

---

## `bookings.routes.js`

Handles lesson enrollment.

Endpoints include:

| Method | Endpoint    | Description                  |
| ------ | ----------- | ---------------------------- |
| POST   | `/bookings` | Book a student into a lesson |

Parents can book lessons for their children through this endpoint.

---

## `sessions.routes.js`

Handles session management.

Sessions represent individual class meetings inside a lesson.

Endpoints include:

| Method | Endpoint    | Description                   |
| ------ | ----------- | ----------------------------- |
| POST   | `/sessions` | Create a session for a lesson |

Mentors use this endpoint to create lesson sessions.

---

## `parent.routes.js`

Provides **parent-specific views** that aggregate data related to their students.

Endpoints include:

| Method | Endpoint                              | Description                         |
| ------ | ------------------------------------- | ----------------------------------- |
| GET    | `/parent/students`                    | List students managed by the parent |
| GET    | `/parent/students/:studentId/lessons` | View lessons for a specific student |

These endpoints provide convenient views for parent dashboards.

---

## `mentor.routes.js`

Provides **mentor-specific views**.

Endpoints include:

| Method | Endpoint          | Description                        |
| ------ | ----------------- | ---------------------------------- |
| GET    | `/mentor/lessons` | List lessons created by the mentor |

This endpoint is useful for mentor dashboards where mentors need to manage their lessons.

---

## `llm.routes.js`

Handles the **AI summarization feature**.

This endpoint integrates with a Large Language Model (Google Gemini) to generate summaries of text.

Endpoint:

| Method | Endpoint         | Description                              |
| ------ | ---------------- | ---------------------------------------- |
| POST   | `/llm/summarize` | Generate a concise summary of input text |

Example request:

```
POST /api/llm/summarize
```

Request body:

```json
{
  "text": "Long educational text..."
}
```

Example response:

```json
{
  "summary": "• Key point one\n• Key point two\n• Key point three",
  "model": "gemini-2.5-flash"
}
```

This endpoint includes:

* input validation
* rate limiting
* external LLM integration

---

# Route Aggregation (`index.js`)

The `index.js` file acts as the **central router** that mounts all route modules.

Example structure:

```
import authRoutes from "./auth.routes.js"
import studentsRoutes from "./students.routes.js"
import lessonsRoutes from "./lessons.routes.js"
import bookingsRoutes from "./bookings.routes.js"
import sessionsRoutes from "./sessions.routes.js"
import parentRoutes from "./parent.routes.js"
import mentorRoutes from "./mentor.routes.js"
import llmRoutes from "./llm.routes.js"
```

All routes are mounted under:

```
/api
```

Example:

```
/api/auth
/api/students
/api/lessons
/api/bookings
/api/sessions
/api/parent
/api/mentor
/api/llm
```

This keeps the API structure clean and predictable.

---

# Middleware Usage in Routes

Routes may attach middleware before reaching controllers.

Common middleware includes:

| Middleware           | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `auth.middleware.js` | Verifies JWT authentication                   |
| `role.middleware.js` | Enforces role-based access                    |
| `express-rate-limit` | Protects endpoints such as the LLM summarizer |

Example route definition:

```javascript
router.post(
  "/summarize",
  authMiddleware,
  summarizeRateLimiter,
  summarizeController
)
```

Middleware ensures that requests are properly validated and authorized before they reach the controller layer.

---

# Design Principles

The route layer follows several design principles.

### Lightweight Routing

Routes define **URL structure and middleware**, but avoid implementing logic.

All business logic is delegated to controllers and services.

---

### Modular Organization

Each domain area has its own route module.

This makes the API easier to maintain and extend.

---

### Clear Endpoint Structure

All endpoints are grouped under `/api`, ensuring consistent and predictable routing.

---

# Summary

The `routes/` layer defines how HTTP requests enter the Mentora backend.

It is responsible for:

* structuring API endpoints
* attaching middleware
* delegating request handling to controllers

By keeping routes lightweight and modular, the application remains **organized, scalable, and easy to maintain** as new features are added.
