import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";
import { createBookingController } from "../controllers/bookings.controller.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  allowRoles("PARENT"),
  createBookingController
);

export default router;