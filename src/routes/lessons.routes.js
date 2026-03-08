import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";
import {
  createLessonController,
  getAllLessonsController,
  getLessonStudentsController,
} from "../controllers/lessons.controller.js";
import { getLessonSessionsController } from "../controllers/sessions.controller.js";

const router = Router();

router.get("/", authMiddleware, getAllLessonsController);

router.post(
  "/",
  authMiddleware,
  allowRoles("MENTOR"),
  createLessonController
);

router.get(
  "/:lessonId/students",
  authMiddleware,
  allowRoles("MENTOR"),
  getLessonStudentsController
);

router.get("/:id/sessions", authMiddleware, getLessonSessionsController);

export default router;