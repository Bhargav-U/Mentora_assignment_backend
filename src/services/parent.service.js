import { query } from "../config/db.js";

export const getStudentsByParentId = async (parentId) => {
  const result = await query(
    `SELECT
        id,
        first_name,
        last_name,
        username,
        created_on
     FROM students
     WHERE parent_id = $1
     ORDER BY created_on DESC`,
    [parentId]
  );

  return result.rows;
};

export const getLessonsByParentStudentId = async (parentId, studentId) => {
  const studentResult = await query(
    `SELECT id, parent_id, first_name, last_name, username
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

  if (student.parent_id !== parentId) {
    const error = new Error("You can only view lessons for your own students");
    error.status = 403;
    throw error;
  }

  const lessonsResult = await query(
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

  return {
    student: {
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      username: student.username,
    },
    lessons: lessonsResult.rows,
  };
};