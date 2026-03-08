
---

# Middleware

## Purpose

The `middleware/` directory contains **Express middleware functions** that operate on requests before they reach controllers or after an error occurs.

Middleware provides reusable logic for:

* authentication
* authorization
* request validation layers
* error handling
* route fallbacks

By isolating these concerns in middleware, the application maintains a **clean separation between infrastructure concerns and business logic**.

---

# What Is Middleware

In Express, middleware functions execute **during the request–response lifecycle**.

They have access to:

```
req
res
next
```

Middleware can:

* modify the request object
* terminate the response
* pass control to the next handler
* throw or forward errors

Typical usage:

```javascript
(req, res, next) => {
  // logic
  next()
}
```

---

# Middleware Flow in the Application

The application processes requests in the following order:

```
Incoming Request
      ↓
Global Middleware
      ↓
Authentication Middleware
      ↓
Role Authorization Middleware
      ↓
Route Handler
      ↓
Controller
      ↓
Service Layer
      ↓
Database
      ↓
Response
```

If an error occurs at any stage, it is passed to the **error handling middleware**.

---

# Files in This Directory

| File                     | Purpose                                     |
| ------------------------ | ------------------------------------------- |
| `auth.middleware.js`     | Verifies JWT tokens and authenticates users |
| `role.middleware.js`     | Enforces role-based access control          |
| `notFound.middleware.js` | Handles unknown routes                      |
| `error.middleware.js`    | Centralized error handler                   |

---

# Authentication Middleware

## `auth.middleware.js`

This middleware verifies **JWT Bearer tokens** sent by clients.

Clients must include the token in the request header:

```
Authorization: Bearer <JWT_TOKEN>
```

The middleware performs the following steps:

1. Extracts the token from the header
2. Verifies the token using the `JWT_SECRET`
3. Decodes the payload
4. Attaches the authenticated user data to:

```
req.user
```

Example structure:

```json
{
  "id": "user-id",
  "role": "PARENT"
}
```

Controllers and services can then use this information to enforce ownership rules.

If the token is:

* missing
* invalid
* expired

the middleware returns:

```
401 Unauthorized
```

---

# Role Authorization Middleware

## `role.middleware.js`

This middleware enforces **role-based access control**.

Mentora supports the following roles:

```
PARENT
MENTOR
STUDENT
```

Certain API endpoints should only be accessible to specific roles.

Examples:

| Endpoint             | Allowed Role      |
| -------------------- | ----------------- |
| Create student       | PARENT            |
| Create lesson        | MENTOR            |
| Book lesson          | PARENT            |
| View student lessons | PARENT or STUDENT |

The role middleware checks:

```
req.user.role
```

If the user does not have the required role, the middleware returns:

```
403 Forbidden
```

This ensures that users cannot perform actions outside their permitted scope.

---

# Not Found Middleware

## `notFound.middleware.js`

This middleware handles requests for **unknown routes**.

If a request does not match any registered route, the request reaches this middleware.

The response returned is:

```
404 Not Found
```

Example response:

```json
{
  "message": "Route not found"
}
```

This prevents the server from returning ambiguous responses when invalid endpoints are accessed.

---

# Error Handling Middleware

## `error.middleware.js`

This middleware is responsible for **centralized error handling** across the application.

Instead of each controller implementing its own error response logic, all uncaught errors are forwarded to this middleware.

Typical usage:

```javascript
next(error)
```

The error handler then formats a consistent JSON response.

Example:

```json
{
  "message": "Internal server error"
}
```

The middleware also ensures that:

* sensitive stack traces are not exposed in production
* consistent error formatting is maintained
* proper HTTP status codes are returned

---

# Middleware Placement in `app.js`

Middleware is registered in `app.js` in the following order:

```
1. Global middleware
   - helmet
   - cors
   - express.json
   - morgan

2. API routes
   - /api/* endpoints

3. notFound middleware
   - catches unknown routes

4. error middleware
   - handles all uncaught errors
```

Example structure:

```javascript
app.use("/api", routes)

app.use(notFoundMiddleware)

app.use(errorMiddleware)
```

The order is important because Express processes middleware **sequentially**.

---

# Why Middleware Is Important

Middleware provides several architectural benefits:

### Security

Authentication and authorization are enforced before requests reach controllers.

---

### Reusability

Middleware logic can be applied across multiple routes without duplication.

---

### Clean Architecture

Controllers remain focused on business logic rather than infrastructure concerns.

---

### Centralized Error Handling

Errors are processed consistently across the entire API.

---

# Summary

The middleware layer ensures that requests are:

* authenticated
* authorized
* validated
* routed correctly
* handled consistently in case of errors

This layer is critical for maintaining **security, stability, and maintainability** of the Mentora backend.
