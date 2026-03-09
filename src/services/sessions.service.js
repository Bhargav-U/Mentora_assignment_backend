import { query } from "../config/db.js";

export const createSession = async (data, mentorId) => {
  const lessonResult = await query(
    `SELECT id, mentor_id
     FROM lessons
     WHERE id = $1`,
    [data.lesson_id]
  );

  if (lessonResult.rows.length === 0) {
    const error = new Error("Lesson not found");
    error.status = 404;
    throw error;
  }

  const lesson = lessonResult.rows[0];

  if (lesson.mentor_id !== mentorId) {
    const error = new Error("You can only create sessions for your own lessons");
    error.status = 403;
    throw error;
  }

  const result = await query(
    `INSERT INTO sessions (lesson_id, date, topic, summary)
     VALUES ($1, $2, $3, $4)
     RETURNING id, lesson_id, date, topic, summary, created_on`,
    [
      data.lesson_id,
      data.date,
      data.topic,
      data.summary || null,
    ]
  );

  return result.rows[0];
};

export const getSessionsByLessonId = async (lessonId, requester) => {
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

  const lesson = lessonResult.rows[0];

  if (!requester || !requester.role) {
    const error = new Error("Unauthorized");
    error.status = 401;
    throw error;
  }

  if (requester.role === "MENTOR" && lesson.mentor_id !== requester.id) {
    const error = new Error("You can only view sessions for your own lessons");
    error.status = 403;
    throw error;
  }

  if (requester.role === "PARENT") {
    const accessResult = await query(
      `SELECT 1
       FROM bookings b
       JOIN students s ON b.student_id = s.id
       WHERE b.lesson_id = $1 AND s.parent_id = $2
       LIMIT 1`,
      [lessonId, requester.id]
    );

    if (accessResult.rows.length === 0) {
      const error = new Error("You can only view sessions for your own students");
      error.status = 403;
      throw error;
    }
  }

  if (requester.role === "STUDENT") {
    const accessResult = await query(
      `SELECT 1
       FROM bookings
       WHERE lesson_id = $1 AND student_id = $2
       LIMIT 1`,
      [lessonId, requester.id]
    );

    if (accessResult.rows.length === 0) {
      const error = new Error("You can only view sessions for your own lessons");
      error.status = 403;
      throw error;
    }
  }

  if (!["MENTOR", "PARENT", "STUDENT"].includes(requester.role)) {
    const error = new Error("Forbidden");
    error.status = 403;
    throw error;
  }

  const result = await query(
    `SELECT id, lesson_id, date, topic, summary, created_on
     FROM sessions
     WHERE lesson_id = $1
     ORDER BY date ASC`,
    [lessonId]
  );

  return result.rows;
};
