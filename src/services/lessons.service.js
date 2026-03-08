import { query } from "../config/db.js";

export const createLesson = async (data, mentorId) => {
  const result = await query(
    `INSERT INTO lessons (title, description, mentor_id)
     VALUES ($1, $2, $3)
     RETURNING id, title, description, mentor_id, created_on`,
    [data.title, data.description || null, mentorId]
  );

  return result.rows[0];
};

export const getAllLessons = async () => {
  const result = await query(
    `SELECT
       l.id,
       l.title,
       l.description,
       l.mentor_id,
       l.created_on,
       u.first_name AS mentor_first_name,
       u.last_name AS mentor_last_name,
       u.username AS mentor_username
     FROM lessons l
     JOIN users u ON l.mentor_id = u.id
     ORDER BY l.created_on DESC`
  );

  return result.rows;
};

export const getLessonsByStudentId = async (studentId, requester) => {
  const studentResult = await query(
    `SELECT id, parent_id
     FROM students
     WHERE id = $1`,
    [studentId]
  );

  if (studentResult.rows.length === 0) {
    const error = new Error("Student not found");
    error.status = 404;
    throw error;
  }

  const student = studentResult.rows[0];

  if (requester.role === "PARENT" && student.parent_id !== requester.id) {
    const error = new Error("You can only view lessons for your own students");
    error.status = 403;
    throw error;
  }

  if (requester.role === "STUDENT" && requester.id !== studentId) {
    const error = new Error("You can only view your own lessons");
    error.status = 403;
    throw error;
  }

  const result = await query(
    `SELECT
       l.id,
       l.title,
       l.description,
       l.mentor_id,
       l.created_on,
       u.first_name AS mentor_first_name,
       u.last_name AS mentor_last_name,
       u.username AS mentor_username,
       b.id AS booking_id,
       b.created_on AS booked_on
     FROM bookings b
     JOIN lessons l ON b.lesson_id = l.id
     JOIN users u ON l.mentor_id = u.id
     WHERE b.student_id = $1
     ORDER BY b.created_on DESC`,
    [studentId]
  );

  return result.rows;
};

export const getLessonsForCurrentStudent = async (studentId) => {
  const result = await query(
    `SELECT
       l.id,
       l.title,
       l.description,
       l.mentor_id,
       l.created_on,
       u.first_name AS mentor_first_name,
       u.last_name AS mentor_last_name,
       u.username AS mentor_username,
       b.id AS booking_id,
       b.created_on AS booked_on
     FROM bookings b
     JOIN lessons l ON b.lesson_id = l.id
     JOIN users u ON l.mentor_id = u.id
     WHERE b.student_id = $1
     ORDER BY b.created_on DESC`,
    [studentId]
  );

  return result.rows;
};

export const getLessonsByMentorId = async (mentorId) => {
  const result = await query(
    `SELECT
       l.id,
       l.title,
       l.description,
       l.mentor_id,
       l.created_on,
       COUNT(DISTINCT b.student_id)::int AS student_count,
       COUNT(DISTINCT s.id)::int AS session_count
     FROM lessons l
     LEFT JOIN bookings b ON l.id = b.lesson_id
     LEFT JOIN sessions s ON l.id = s.lesson_id
     WHERE l.mentor_id = $1
     GROUP BY l.id
     ORDER BY l.created_on DESC`,
    [mentorId]
  );

  return result.rows;
};

export const getStudentsByLessonId = async (lessonId, mentorId) => {
  const lessonResult = await query(
    `SELECT id, mentor_id
     FROM lessons
     WHERE id = $1`,
    [lessonId]
  );

  if (lessonResult.rows.length === 0) {
    const error = new Error("Lesson not found");
    error.status = 404;
    throw error;
  }

  if (lessonResult.rows[0].mentor_id !== mentorId) {
    const error = new Error("You can only view students for your own lessons");
    error.status = 403;
    throw error;
  }

  const result = await query(
    `SELECT
       s.id,
       s.first_name,
       s.last_name,
       s.username,
       b.id AS booking_id,
       b.created_on AS booked_on
     FROM bookings b
     JOIN students s ON b.student_id = s.id
     WHERE b.lesson_id = $1
     ORDER BY b.created_on DESC`,
    [lessonId]
  );

  return result.rows;
};