# Mentora Database Schema

This document describes the database schema used by the Mentora backend service.

The schema supports authentication, student management, lesson management, bookings, and session tracking.

![Simplified ER Diagram](ER_Diagram_simplified.png)
---

# Tables Overview

1. users
2. students
3. lessons
4. bookings
5. sessions

---

# 1. users

| Column        | Type      | Required | Constraints / Notes       |
| ------------- | --------- | -------- | ------------------------- |
| id            | UUID      | Yes      | Primary Key               |
| first_name    | TEXT      | Yes      |                           |
| last_name     | TEXT      | No       | Optional                  |
| email         | TEXT      | Yes      | Unique                    |
| phone         | TEXT      | No       | Optional                  |
| role          | TEXT      | Yes      | PARENT or MENTOR          |
| username      | TEXT      | Yes      | Unique within users       |
| password_hash | TEXT      | Yes      | Store hashed password     |
| created_on    | TIMESTAMP | Yes      | Default current timestamp |

---

# 2. students

| Column        | Type      | Required | Constraints / Notes       |
| ------------- | --------- | -------- | ------------------------- |
| id            | UUID      | Yes      | Primary Key               |
| first_name    | TEXT      | Yes      |                           |
| last_name     | TEXT      | No       | Optional                  |
| username      | TEXT      | Yes      | Unique within students    |
| password_hash | TEXT      | Yes      | Store hashed password     |
| parent_id     | UUID      | Yes      | Foreign Key -> users.id   |
| created_on    | TIMESTAMP | Yes      | Default current timestamp |

---

# 3. lessons

| Column      | Type      | Required | Constraints / Notes       |
| ----------- | --------- | -------- | ------------------------- |
| id          | UUID      | Yes      | Primary Key               |
| title       | TEXT      | Yes      | Not unique                |
| description | TEXT      | No       | Optional                  |
| mentor_id   | UUID      | Yes      | Foreign Key -> users.id   |
| created_on  | TIMESTAMP | Yes      | Default current timestamp |

---

# 4. bookings

| Column     | Type      | Required | Constraints / Notes        |
| ---------- | --------- | -------- | -------------------------- |
| id         | UUID      | Yes      | Primary Key                |
| student_id | UUID      | Yes      | Foreign Key -> students.id |
| lesson_id  | UUID      | Yes      | Foreign Key -> lessons.id  |
| created_on | TIMESTAMP | Yes      | Default current timestamp  |

Constraint:

* (student_id, lesson_id) must be unique

This ensures the same student cannot book the same lesson twice.

---

# 5. sessions

| Column     | Type      | Required | Constraints / Notes       |
| ---------- | --------- | -------- | ------------------------- |
| id         | UUID      | Yes      | Primary Key               |
| lesson_id  | UUID      | Yes      | Foreign Key -> lessons.id |
| date       | TIMESTAMP | Yes      | Session date/time         |
| topic      | TEXT      | Yes      | Topic covered             |
| summary    | TEXT      | No       | Optional                  |
| created_on | TIMESTAMP | Yes      | Default current timestamp |

---

# Relationships

Parent -> Students

* One parent can create multiple students.

Mentor -> Lessons

* One mentor can create multiple lessons.

Students -> Lessons

* Students are assigned lessons through the bookings table.

Lessons -> Sessions

* One lesson can contain multiple sessions.

---

![Full ER Diagram](ER_Diagram.png)

# Notes

* Passwords are stored only as hashed values.
* UUID is used as the primary identifier for all core entities.
* The bookings table implements the many-to-many relationship between students and lessons.
