import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = [
  "PORT",
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "GEMINI_API_KEY",
  "NODE_ENV",
  "LLM_RATE_LIMIT_WINDOW_MS",
  "LLM_RATE_LIMIT_MAX_REQUESTS",
  "LLM_MODEL",
  "LLM_SUMMARIZE_PROMPT",
];

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const env = {
  port: Number(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  geminiApiKey: process.env.GEMINI_API_KEY,
  nodeEnv: process.env.NODE_ENV,

  llmRateLimitWindowMs: Number(process.env.LLM_RATE_LIMIT_WINDOW_MS),
  llmRateLimitMaxRequests: Number(process.env.LLM_RATE_LIMIT_MAX_REQUESTS),

  llmModel: process.env.LLM_MODEL,
  llmSummarizePrompt: process.env.LLM_SUMMARIZE_PROMPT,
};

export default env;