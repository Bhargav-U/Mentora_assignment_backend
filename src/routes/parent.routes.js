import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";
import {
  getParentStudentsController,
  getParentStudentLessonsController,
} from "../controllers/parent.controller.js";

const router = Router();

router.get(
  "/students",
  authMiddleware,
  allowRoles("PARENT"),
  getParentStudentsController
);

router.get(
  "/students/:studentId/lessons",
  authMiddleware,
  allowRoles("PARENT"),
  getParentStudentLessonsController
);

export default router;