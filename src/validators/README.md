
---

# Validators

## Purpose

The `validators/` directory contains **schema-based validation logic** for incoming API requests.

Validation is implemented using **Zod**, a TypeScript-first schema validation library that works well with JavaScript projects.

The goal of this layer is to ensure that **only well-formed and valid data enters the service layer**.

By validating inputs early in the request lifecycle, the application prevents invalid data from reaching business logic or the database.

---

# Role in the Architecture

Validators are used inside controllers before invoking services.

```
Client Request
      ↓
Routes
      ↓
Controllers
      ↓
Validators (Zod)
      ↓
Services
      ↓
Database
```

Controllers call validation schemas to verify request payloads.

Example usage:

```javascript
schema.parse(req.body)
```

If validation fails, Zod throws an error which is then handled by the centralized error middleware.

---

# Why Schema Validation Is Important

Using schema validation provides several benefits:

### Input Safety

Ensures that required fields are present and properly formatted.

---

### Early Error Detection

Invalid requests are rejected immediately before reaching the business logic layer.

---

### Consistent API Behavior

Clients receive predictable validation errors when request data does not match the expected format.

---

### Cleaner Service Layer

Services can assume that the data they receive has already been validated.

---

# Validator Files

Each domain area has its own validator module.

| File                    | Purpose                             |
| ----------------------- | ----------------------------------- |
| `auth.validator.js`     | Validates signup and login requests |
| `students.validator.js` | Validates student creation payloads |
| `lessons.validator.js`  | Validates lesson creation payloads  |
| `bookings.validator.js` | Validates lesson booking requests   |
| `sessions.validator.js` | Validates session creation requests |

Each file exports one or more Zod schemas used by the controllers.

---

# Example Validation Schema

Example schema for creating a lesson:

```javascript
import { z } from "zod";

export const createLessonSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10)
});
```

In the controller:

```javascript
createLessonSchema.parse(req.body);
```

If the payload is invalid, Zod throws an error and the request returns a `400 Bad Request`.

---

# Validation Strategy

The Mentora backend follows a **controller-level validation strategy**.

This means:

* controllers perform request validation
* services assume validated data
* database queries operate only on trusted inputs

This separation keeps each layer focused on its responsibilities.

---

# Error Handling

If validation fails, Zod generates an error that is caught by the application's centralized error handler.

Example error response:

```json
{
  "message": "Invalid request data"
}
```

This ensures that validation failures return **consistent error responses** across all endpoints.

---

# Summary

The `validators/` layer ensures that incoming requests are:

* properly structured
* complete
* type-safe

By validating request payloads with Zod before executing business logic, the backend maintains **data integrity, predictable behavior, and improved security**.
