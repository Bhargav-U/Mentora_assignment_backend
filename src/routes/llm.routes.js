import { Router } from "express";
import rateLimit from "express-rate-limit";
import authMiddleware from "../middleware/auth.middleware.js";
import { summarizeController } from "../controllers/llm.controller.js";
import env from "../config/env.js";

const router = Router();

const summarizeRateLimiter = rateLimit({
  windowMs: env.llmRateLimitWindowMs,
  max: env.llmRateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many summarize requests. Please try again later.",
  },
});

router.post(
  "/summarize",
  authMiddleware,
  summarizeRateLimiter,
  summarizeController
);

export default router;