
---

# Controllers

## Purpose

The `controllers/` directory contains the **HTTP request handlers** for the Mentora backend.

Controllers sit between the **route layer** and the **service layer**.

Their job is to:

* receive incoming HTTP requests
* validate incoming data
* call the appropriate service functions
* send the final HTTP response back to the client
* forward unexpected errors to centralized error handling middleware

Controllers should remain **thin** and should not contain heavy business logic or direct database access.

---

# Role of Controllers in the Architecture

The backend follows this request flow:

```text
Route → Controller → Service → Database
```

Within that flow, controllers are responsible for the **application-facing HTTP layer**.

They convert raw incoming requests into structured inputs for services, and then convert service results into API responses.

---

# Responsibilities

## 1. Receive and Parse Requests

Controllers receive:

* request body (`req.body`)
* route parameters (`req.params`)
* query parameters (`req.query`)
* authenticated user information (`req.user`)

They use these values to prepare inputs for the service layer.

---

## 2. Validate Request Data

Before calling services, controllers validate incoming payloads using **Zod schemas** defined in:

```text
src/validators/
```

Examples:

* signup payload validation
* login payload validation
* student creation payload validation
* booking creation payload validation
* session creation payload validation

This ensures that only valid data reaches business logic.

---

## 3. Call Services

Once input is validated, controllers call the relevant service function.

Examples:

* `auth.controller.js` → `auth.service.js`
* `students.controller.js` → `students.service.js`
* `lessons.controller.js` → `lessons.service.js`

Services handle:

* business rules
* ownership checks
* database operations

Controllers should only orchestrate this interaction.

---

## 4. Shape HTTP Responses

Controllers decide:

* HTTP status code
* JSON response body
* success vs error response format

Examples:

* `201 Created` after creating a student
* `200 OK` when returning lessons
* `400 Bad Request` for invalid input
* `403 Forbidden` when ownership rules fail

---

## 5. Forward Errors to Middleware

Controllers do not fully handle unexpected errors themselves.

Instead, they pass errors to the centralized error handler using:

```js
next(error)
```

This keeps error handling consistent across the application.

---

# What Controllers Should Not Do

Controllers should **not**:

* write raw SQL
* directly access the database
* contain complex business logic
* duplicate validation logic from validators
* contain infrastructure configuration

Those responsibilities belong elsewhere:

| Responsibility               | Correct Layer |
| ---------------------------- | ------------- |
| Request validation           | `validators/` |
| Business logic               | `services/`   |
| Database queries             | `services/`   |
| Authentication / role checks | `middleware/` |
| Configuration                | `config/`     |

---

# Files in This Directory

| File                     | Purpose                                                                        |
| ------------------------ | ------------------------------------------------------------------------------ |
| `auth.controller.js`     | Handles signup, login, and current-user endpoints                              |
| `students.controller.js` | Handles student creation and student listing                                   |
| `lessons.controller.js`  | Handles lesson creation and lesson-related listing endpoints                   |
| `bookings.controller.js` | Handles lesson booking requests                                                |
| `sessions.controller.js` | Handles session creation and session listing                                   |
| `parent.controller.js`   | Handles parent-specific views such as parent students and parent child lessons |

---

# Controller Design Principles

## Thin Controllers

Controllers are intentionally lightweight.

A well-structured controller should mostly do this:

1. validate request input
2. call a service
3. return a response

This keeps the code easy to read and easy to maintain.

---

## Reusability Through Services

By moving business logic into services, multiple controllers can reuse the same service logic without duplication.

This helps when:

* the API grows
* new endpoints are added
* the frontend requires different views of the same data

---

## Clear Separation of Concerns

Controllers are responsible for the **HTTP layer**, not the full application logic.

This separation improves:

* readability
* debugging
* testability
* long-term maintainability

---

# Example Controller Lifecycle

Example flow for student creation:

```text
POST /students
   ↓
students.routes.js
   ↓
students.controller.js
   ↓
students.validator.js
   ↓
students.service.js
   ↓
database insert
   ↓
controller sends 201 response
```

---

# Error Handling Pattern

Typical controller structure:

```js
try {
  // validate input
  // call service
  // send response
} catch (error) {
  next(error)
}
```

This ensures that all controllers behave consistently and rely on centralized error middleware.

---

# Summary

The `controllers/` layer acts as the **bridge between HTTP requests and business logic**.

It is responsible for:

* request handling
* validation coordination
* service invocation
* response formatting
* error forwarding

Keeping controllers thin and focused makes the backend architecture more **modular, scalable, and maintainable**.
