import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";
import env from "../config/env.js";

export const createUser = async (data) => {
  const existingEmail = await query(
    "SELECT id FROM users WHERE email = $1",
    [data.email]
  );

  if (existingEmail.rows.length > 0) {
    const error = new Error("Email already exists");
    error.status = 409;
    throw error;
  }

  const existingUsername = await query(
    "SELECT id FROM users WHERE username = $1",
    [data.username]
  );

  if (existingUsername.rows.length > 0) {
    const error = new Error("Username already exists");
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const result = await query(
    `INSERT INTO users
      (first_name, last_name, email, phone, role, username, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, first_name, last_name, email, phone, role, username, created_on`,
    [
      data.first_name,
      data.last_name || null,
      data.email,
      data.phone || null,
      data.role,
      data.username,
      hashedPassword,
    ]
  );

  return result.rows[0];
};

export const loginUser = async (username, password) => {
  // 1. Try parent / mentor login from users table
  const userResult = await query(
    `SELECT id, first_name, last_name, email, phone, role, username, password_hash, created_on
     FROM users
     WHERE username = $1`,
    [username]
  );

  if (userResult.rows.length > 0) {
    const user = userResult.rows[0];

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      const error = new Error("Invalid credentials");
      error.status = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        account_type: "USER",
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    return {
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        username: user.username,
        created_on: user.created_on,
      },
    };
  }

  // 2. Try student login from students table
  const studentResult = await query(
    `SELECT id, first_name, last_name, username, password_hash, parent_id, created_on
     FROM students
     WHERE username = $1`,
    [username]
  );

  if (studentResult.rows.length > 0) {
    const student = studentResult.rows[0];

    const isValidPassword = await bcrypt.compare(password, student.password_hash);

    if (!isValidPassword) {
      const error = new Error("Invalid credentials");
      error.status = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        id: student.id,
        role: "STUDENT",
        parent_id: student.parent_id,
        account_type: "STUDENT",
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    return {
      token,
      user: {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        role: "STUDENT",
        username: student.username,
        parent_id: student.parent_id,
        created_on: student.created_on,
      },
    };
  }

  const error = new Error("Invalid credentials");
  error.status = 401;
  throw error;
};

export const getCurrentUser = async (authUser) => {
  if (authUser.role === "STUDENT") {
    const result = await query(
      `SELECT id, first_name, last_name, username, parent_id, created_on
       FROM students
       WHERE id = $1`,
      [authUser.id]
    );

    if (result.rows.length === 0) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    return {
      ...result.rows[0],
      role: "STUDENT",
    };
  }

  const result = await query(
    `SELECT id, first_name, last_name, email, phone, role, username, created_on
     FROM users
     WHERE id = $1`,
    [authUser.id]
  );

  if (result.rows.length === 0) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  return result.rows[0];
};