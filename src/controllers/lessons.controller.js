import { createLessonSchema } from "../validators/lessons.validator.js";
import {
  createLesson,
  getAllLessons,
  getLessonsByStudentId,
  getLessonsForCurrentStudent,
  getLessonsByMentorId,
  getStudentsByLessonId,
} from "../services/lessons.service.js";

export const createLessonController = async (req, res, next) => {
  try {
    const data = createLessonSchema.parse(req.body);
    const lesson = await createLesson(data, req.user.id);
    res.status(201).json(lesson);
  } catch (error) {
    next(error);
  }
};

export const getAllLessonsController = async (req, res, next) => {
  try {
    const lessons = await getAllLessons();
    res.status(200).json(lessons);
  } catch (error) {
    next(error);
  }
};

export const getStudentLessonsController = async (req, res, next) => {
  try {
    const lessons = await getLessonsByStudentId(req.params.studentId, req.user);
    res.status(200).json(lessons);
  } catch (error) {
    next(error);
  }
};

export const getCurrentStudentLessonsController = async (req, res, next) => {
  try {
    const lessons = await getLessonsForCurrentStudent(req.user.id);
    res.status(200).json(lessons);
  } catch (error) {
    next(error);
  }
};

export const getMentorLessonsController = async (req, res, next) => {
  try {
    const lessons = await getLessonsByMentorId(req.user.id);
    res.status(200).json(lessons);
  } catch (error) {
    next(error);
  }
};

export const getLessonStudentsController = async (req, res, next) => {
  try {
    const students = await getStudentsByLessonId(req.params.lessonId, req.user.id);
    res.status(200).json(students);
  } catch (error) {
    next(error);
  }
};