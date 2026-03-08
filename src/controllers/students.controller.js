import { createStudentSchema } from "../validators/students.validator.js";
import {
  createStudent,
  getStudentsByParentId,
} from "../services/students.service.js";

export const createStudentController = async (req, res, next) => {
  try {
    const data = createStudentSchema.parse(req.body);
    const student = await createStudent(data, req.user.id);

    res.status(201).json(student);
  } catch (error) {
    next(error);
  }
};

export const getStudentsController = async (req, res, next) => {
  try {
    const students = await getStudentsByParentId(req.user.id);
    res.status(200).json(students);
  } catch (error) {
    next(error);
  }
};