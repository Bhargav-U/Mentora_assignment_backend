import { ZodError } from "zod";

const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.errors,
    });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
};

export default errorHandler;
