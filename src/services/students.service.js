import bcrypt from "bcryptjs";
import { query } from "../config/db.js";

export const createStudent = async (data, parentId) => {
  const existingStudent = await query(
    "SELECT id FROM students WHERE username = $1",
    [data.username]
  );

  if (existingStudent.rows.length > 0) {
    const error = new Error("Student username already exists");
    error.status = 409;
    throw error;
  }

  const existingUser = await query(
    "SELECT id FROM users WHERE username = $1",
    [data.username]
  );

  if (existingUser.rows.length > 0) {
    const error = new Error("Username already exists");
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const result = await query(
    `INSERT INTO students (first_name, last_name, username, password_hash, parent_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, first_name, last_name, username, parent_id, created_on`,
    [
      data.first_name,
      data.last_name || null,
      data.username,
      hashedPassword,
      parentId,
    ]
  );

  return result.rows[0];
};

export const getStudentsByParentId = async (parentId) => {
  const result = await query(
    `SELECT id, first_name, last_name, username, parent_id, created_on
     FROM students
     WHERE parent_id = $1
     ORDER BY created_on DESC`,
    [parentId]
  );

  return result.rows;
};