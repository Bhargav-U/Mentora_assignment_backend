
---

# Config

## Purpose

The `config/` directory centralizes **environment configuration and infrastructure setup** for the application.

Instead of hardcoding values inside the application logic, configuration values are read from environment variables and exposed through a single configuration module.

This approach ensures that:

* sensitive values are **not stored in source code**
* application behavior can be **configured per environment**
* controllers and services remain **clean and focused on business logic**

---

# Files in This Directory

| File     | Purpose                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------- |
| `env.js` | Loads environment variables, validates required configuration, and exports a typed configuration object |
| `db.js`  | Initializes the PostgreSQL connection pool and exposes database helpers                                 |

---

# Environment Configuration (`env.js`)

The `env.js` module loads environment variables using **dotenv** and validates that all required configuration values are present before the server starts.

If any required variable is missing, the application will **fail fast during startup**, preventing runtime errors later.

Example logic:

```
dotenv.config()

validate required variables

export configuration object
```

Other modules import configuration like this:

```
import env from "../config/env.js"
```

This ensures that **all environment configuration is accessed through a single source of truth**.

---

# Environment Variables

The backend requires the following environment variables.

### Server Configuration

| Variable | Description                                   |
| -------- | --------------------------------------------- |
| `PORT`   | The port on which the Express server will run |

Example

```
PORT=3000
```

---

### Database Configuration

| Variable       | Description                                                       |
| -------------- | ----------------------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string used to initialize the database pool |

Example

```
DATABASE_URL=postgresql://user:password@localhost:5432/mentora
```

This value is consumed by `db.js` to establish the database connection.

---

### Authentication Configuration

| Variable         | Description                                        |
| ---------------- | -------------------------------------------------- |
| `JWT_SECRET`     | Secret key used to sign and verify JSON Web Tokens |
| `JWT_EXPIRES_IN` | Expiration time for issued tokens                  |

Example

```
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=1d
```

The secret must remain **private** and must never be committed to version control.

---

### AI Integration Configuration

These variables configure the LLM summarization feature.

| Variable               | Description                                                 |
| ---------------------- | ----------------------------------------------------------- |
| `GEMINI_API_KEY`       | API key used to authenticate with Google Gemini             |
| `LLM_MODEL`            | The Gemini model used for summarization                     |
| `LLM_SUMMARIZE_PROMPT` | System instruction used to guide the summarization behavior |

Example

```
GEMINI_API_KEY=your_api_key_here
LLM_MODEL=gemini-2.5-flash
LLM_SUMMARIZE_PROMPT=Summarize the text into 3–6 concise bullet points under 120 words.
```

Keeping the model and prompt configurable allows the summarization behavior to be adjusted **without modifying application code**.

---

### Rate Limiting Configuration

These variables control the request limit applied to the AI summarization endpoint.

| Variable                      | Description                                |
| ----------------------------- | ------------------------------------------ |
| `LLM_RATE_LIMIT_WINDOW_MS`    | Time window for rate limiting              |
| `LLM_RATE_LIMIT_MAX_REQUESTS` | Maximum requests allowed within the window |

Example

```
LLM_RATE_LIMIT_WINDOW_MS=60000
LLM_RATE_LIMIT_MAX_REQUESTS=10
```

This configuration protects the LLM endpoint from excessive usage and potential abuse.

---

### Environment Mode

| Variable   | Description                                                         |
| ---------- | ------------------------------------------------------------------- |
| `NODE_ENV` | Defines the runtime environment (`development`, `production`, etc.) |

Example

```
NODE_ENV=development
```

This variable allows the application to adjust behavior depending on environment.

---

# Why Configuration Is Isolated

Configuration is placed in the `config` layer to enforce **separation of concerns**.

Without this separation, environment logic would leak into controllers, services, and other parts of the application.

Benefits of this approach:

* **Clean architecture** — business logic does not depend on environment setup
* **Maintainability** — configuration changes occur in one place
* **Testability** — services can be tested with mocked configuration
* **Security** — sensitive credentials remain outside source code

---

# Security Considerations

Sensitive information must **never be committed to the repository**.

Examples of sensitive values include:

* database credentials
* JWT secrets
* API keys

Instead, these values should be stored in:

* `.env` files during development
* environment variables in production environments

The `.env` file should be listed in `.gitignore`.

---

# Database Configuration (`db.js`)

The `db.js` module is responsible for initializing the PostgreSQL connection.

It typically exports:

| Function             | Purpose                                                       |
| -------------------- | ------------------------------------------------------------- |
| `query()`            | Executes SQL queries using the connection pool                |
| `testDbConnection()` | Verifies that the database is reachable during server startup |

By isolating database initialization here, the rest of the application can interact with the database through a **consistent abstraction layer**.

---

# Summary

The `config` layer ensures that:

* environment variables are validated early
* secrets remain outside the codebase
* infrastructure configuration is centralized
* application modules remain focused on their responsibilities

This structure improves **security, maintainability, and scalability** of the backend architecture.
