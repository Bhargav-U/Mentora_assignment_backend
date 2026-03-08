import { Router } from "express";
import authRoutes from "./auth.routes.js";
import studentsRoutes from "./students.routes.js";
import lessonsRoutes from "./lessons.routes.js";
import bookingsRoutes from "./bookings.routes.js";
import sessionsRoutes from "./sessions.routes.js";
import parentRoutes from "./parent.routes.js";
import mentorRoutes from "./mentor.routes.js";
import llmRoutes from "./llm.routes.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    message: "Mentora Backend API",
    status: "running",
  });
});

router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

router.use("/auth", authRoutes);
router.use("/students", studentsRoutes);
router.use("/lessons", lessonsRoutes);
router.use("/bookings", bookingsRoutes);
router.use("/sessions", sessionsRoutes);
router.use("/parent", parentRoutes);
router.use("/mentor", mentorRoutes);
router.use("/llm", llmRoutes);


export default router;