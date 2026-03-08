
---

# Services

## Purpose

The `services/` directory contains the **business logic layer** of the Mentora backend.

Services are responsible for implementing **domain rules, data processing, and database interactions**. They sit between the controller layer and the database layer.

Services interact with the database through the shared query interface provided by:

```
config/db.js
```

This design ensures that:

* controllers remain thin
* business logic is centralized
* database access is consistent and reusable

---

# Role of the Service Layer

Within the application architecture, services occupy the **core domain layer**.

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

Responsibilities of the service layer include:

* executing business rules
* validating ownership and permissions
* interacting with the database
* aggregating and transforming data
* coordinating multiple operations within a transaction

Services **do not handle HTTP responses** and **do not access request objects directly**.

---

# Files in This Directory

| File                  | Purpose                            |
| --------------------- | ---------------------------------- |
| `auth.service.js`     | Handles authentication logic       |
| `students.service.js` | Student creation and retrieval     |
| `lessons.service.js`  | Lesson creation and listing        |
| `bookings.service.js` | Lesson enrollment logic            |
| `sessions.service.js` | Session creation and listing       |
| `parent.service.js`   | Parent-specific data views         |
| `llm.service.js`      | LLM text summarization integration |

Each service module corresponds to a specific **domain area of the platform**.

---

# Authentication Service

## `auth.service.js`

Handles user authentication and account management.

Responsibilities include:

* creating new user accounts
* hashing passwords using `bcrypt`
* validating login credentials
* issuing JWT tokens
* returning authenticated user details

Example operations:

* `createUser()`
* `loginUser()`
* `getCurrentUser()`

Security considerations:

* passwords are **never stored in plaintext**
* JWT tokens include **user ID and role**

---

# Students Service

## `students.service.js`

Handles operations related to students managed by parents.

Responsibilities include:

* creating student accounts under a parent
* retrieving students belonging to a parent
* listing lessons booked for a specific student

Important rule enforced here:

```
Parents can only access their own students.
```

Ownership checks ensure that parents cannot view or modify students belonging to another account.

---

# Lessons Service

## `lessons.service.js`

Manages lesson-related operations.

Responsibilities include:

* creating lessons
* listing available lessons
* retrieving students enrolled in a lesson
* retrieving sessions associated with a lesson

Important rule enforced here:

```
Mentors can only manage lessons they own.
```

This prevents unauthorized modification of lessons created by other mentors.

---

# Bookings Service

## `bookings.service.js`

Handles enrollment of students into lessons.

Responsibilities include:

* booking a student into a lesson
* preventing duplicate enrollments
* enforcing relational integrity

The `bookings` table acts as a **join table** between:

```
students
lessons
```

This allows the system to support a **many-to-many relationship** where:

* a student can join multiple lessons
* a lesson can have multiple students

---

# Sessions Service

## `sessions.service.js`

Manages lesson sessions.

Sessions represent **individual class events** within a lesson.

Responsibilities include:

* creating sessions for lessons
* retrieving sessions belonging to a lesson

Important rule enforced here:

```
Mentors can only create sessions for lessons they own.
```

---

# Parent Service

## `parent.service.js`

Provides **aggregated views** specifically designed for parent dashboards.

Responsibilities include:

* listing all students under a parent
* retrieving lessons associated with a specific student

These endpoints provide **simplified access patterns** for parent-facing interfaces.

---

# LLM Service

## `llm.service.js`

Handles integration with a **Large Language Model (LLM)** for text summarization.

This service communicates with the **Google Gemini API** to generate concise summaries.

Responsibilities include:

* validating input text length
* constructing the prompt sent to the model
* calling the LLM provider API
* returning the generated summary

Supported input constraints:

| Rule                    | Behavior      |
| ----------------------- | ------------- |
| Missing text            | returns `400` |
| Text < 50 characters    | returns `400` |
| Text > configured limit | returns `413` |

The service returns a structured response:

```json
{
  "summary": "...",
  "model": "gemini-2.5-flash"
}
```

The model name and prompt template are configured through **environment variables** to keep the system flexible and secure.

---

# Database Interaction

All database queries are executed through the shared utility:

```
config/db.js
```

Example pattern:

```javascript
const result = await query(
  "SELECT * FROM lessons WHERE mentor_id = $1",
  [mentorId]
)
```

Using a centralized database layer ensures:

* consistent connection handling
* easier testing and mocking
* separation of infrastructure from domain logic

---

# Why Business Logic Lives Here

Separating business logic into services provides several architectural benefits.

### Thin Controllers

Controllers focus only on:

* receiving requests
* validating inputs
* sending responses

---

### Reusability

Service functions can be reused across multiple endpoints or workflows.

---

### Maintainability

Changes to domain rules are implemented in **one place**.

---

### Testability

Services can be tested independently without requiring HTTP requests.

---

# Design Principles

The service layer follows several design principles:

### Separation of Concerns

Business logic is isolated from HTTP handling and routing.

---

### Ownership Enforcement

Services validate ownership rules to prevent unauthorized access.

---

### Modular Design

Each domain area has its own service module.

---

### Database Encapsulation

All database operations are executed through a shared query interface.

---

# Summary

The service layer is the **core of the Mentora backend**.

It is responsible for:

* implementing domain rules
* interacting with the database
* enforcing authorization boundaries
* aggregating data for API responses
* integrating external services such as LLM providers

By centralizing business logic in services, the backend remains **clean, modular, and scalable** as new features are introduced.
