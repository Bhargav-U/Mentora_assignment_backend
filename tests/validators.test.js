import test from "node:test";
import assert from "node:assert/strict";
import { createBookingSchema } from "../src/validators/bookings.validator.js";
import { createSessionSchema } from "../src/validators/sessions.validator.js";

const uuid = "550e8400-e29b-41d4-a716-446655440000";

test("createBookingSchema accepts snake_case", () => {
  const parsed = createBookingSchema.parse({
    student_id: uuid,
    lesson_id: uuid,
  });

  assert.equal(parsed.student_id, uuid);
  assert.equal(parsed.lesson_id, uuid);
});

test("createBookingSchema accepts camelCase", () => {
  const parsed = createBookingSchema.parse({
    studentId: uuid,
    lessonId: uuid,
  });

  assert.equal(parsed.student_id, uuid);
  assert.equal(parsed.lesson_id, uuid);
});

test("createSessionSchema accepts snake_case", () => {
  const parsed = createSessionSchema.parse({
    lesson_id: uuid,
    date: "2026-03-08T10:00:00.000Z",
    topic: "Test",
    summary: "Summary",
  });

  assert.equal(parsed.lesson_id, uuid);
  assert.equal(parsed.topic, "Test");
});

test("createSessionSchema accepts camelCase", () => {
  const parsed = createSessionSchema.parse({
    lessonId: uuid,
    date: "2026-03-08T10:00:00.000Z",
    topic: "Test",
    summary: "Summary",
  });

  assert.equal(parsed.lesson_id, uuid);
  assert.equal(parsed.topic, "Test");
});
