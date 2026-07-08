const AppError = require("./AppError");

class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(400, message);
  }
}

module.exports = ValidationError;
