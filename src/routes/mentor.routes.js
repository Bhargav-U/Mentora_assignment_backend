import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";
import { getMentorLessonsController } from "../controllers/lessons.controller.js";

const router = Router();

router.get(
  "/lessons",
  authMiddleware,
  allowRoles("MENTOR"),
  getMentorLessonsController
);

export default router;