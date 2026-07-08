const AppError = require("./AppError");

class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(409, message);
  }
}

module.exports = ConflictError;
