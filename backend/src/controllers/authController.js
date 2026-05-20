import { AuthService } from "../services/authService.js";

const authService = new AuthService();


export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const result = await authService.register({ name, email, password, role });
    res.status(201).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return next(err);
  }
};



export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return next(err);
  }
};

export const getMe = async (req, res) => {
  res.json(authService.getMe(req.user));
};
