const AppError = require("./AppError");

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

module.exports = UnauthorizedError;
