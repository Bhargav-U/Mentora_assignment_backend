import { signupSchema, loginSchema } from "../validators/auth.validator.js";
import { createUser, loginUser, getCurrentUser } from "../services/auth.service.js";

export const signup = async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body);
    const user = await createUser(data);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await loginUser(data.username, data.password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};