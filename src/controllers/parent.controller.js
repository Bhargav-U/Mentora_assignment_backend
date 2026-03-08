import {
  getStudentsByParentId,
  getLessonsByParentStudentId,
} from "../services/parent.service.js";

export const getParentStudentsController = async (req, res, next) => {
  try {
    const students = await getStudentsByParentId(req.user.id);
    res.status(200).json(students);
  } catch (error) {
    next(error);
  }
};

export const getParentStudentLessonsController = async (req, res, next) => {
  try {
    const result = await getLessonsByParentStudentId(
      req.user.id,
      req.params.studentId
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};