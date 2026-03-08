import { query } from "../config/db.js";

export const createBooking = async (data, parentId) => {
  const studentResult = await query(
    `SELECT id, parent_id
     FROM students
     WHERE id = $1`,
    [data.student_id]
  );

  if (studentResult.rows.length === 0) {
    const error = new Error("Student not found");
    error.status = 404;
    throw error;
  }

  const student = studentResult.rows[0];

  if (student.parent_id !== parentId) {
    const error = new Error("You can only book lessons for your own students");
    error.status = 403;
    throw error;
  }

  const lessonResult = await query(
    `SELECT id
     FROM lessons
     WHERE id = $1`,
    [data.lesson_id]
  );

  if (lessonResult.rows.length === 0) {
    const error = new Error("Lesson not found");
    error.status = 404;
    throw error;
  }

  try {
    const result = await query(
      `INSERT INTO bookings (student_id, lesson_id)
       VALUES ($1, $2)
       RETURNING id, student_id, lesson_id, created_on`,
      [data.student_id, data.lesson_id]
    );

    return result.rows[0];
  } catch (dbError) {
    if (dbError.code === "23505") {
      const error = new Error("This student is already booked into this lesson");
      error.status = 409;
      throw error;
    }
    throw dbError;
  }
};