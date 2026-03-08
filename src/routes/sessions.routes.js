import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";
import { createSessionController } from "../controllers/sessions.controller.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  allowRoles("MENTOR"),
  createSessionController
);

export default router;