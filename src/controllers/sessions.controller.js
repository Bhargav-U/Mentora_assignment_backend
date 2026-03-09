import { createSessionSchema } from "../validators/sessions.validator.js";
import {
  createSession,
  getSessionsByLessonId,
} from "../services/sessions.service.js";

export const createSessionController = async (req, res, next) => {
  try {
    const data = createSessionSchema.parse(req.body);
    const session = await createSession(data, req.user.id);
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

export const getLessonSessionsController = async (req, res, next) => {
  try {
    const sessions = await getSessionsByLessonId(req.params.id, req.user);
    res.status(200).json(sessions);
  } catch (error) {
    next(error);
  }
};
