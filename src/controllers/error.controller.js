const AppError = require("../utils/appError");

const globalHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (err.name === "CastError") {
    const message = "Resource not found";
    error = new AppError(message, 404);
  }

  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = new AppError(message, 409);
  }

  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message);
    error = new AppError(message, 403);
  }

  return res.status(error.statusCode || 400).json({
    success: false,
    error: error.message || "Server error",
  });
};

module.exports = globalHandler;
