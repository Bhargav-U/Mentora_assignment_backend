import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";
import {
  createStudentController,
  getStudentsController,
} from "../controllers/students.controller.js";
import { getStudentLessonsController } from "../controllers/lessons.controller.js";

const router = Router();

router.post("/", authMiddleware, allowRoles("PARENT"), createStudentController);
router.get("/", authMiddleware, allowRoles("PARENT"), getStudentsController);

router.get(
  "/:studentId/lessons",
  authMiddleware,
  allowRoles("PARENT", "STUDENT"),
  getStudentLessonsController
);

export default router;