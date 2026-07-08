// TODO: verify JWT from HTTP-only cookie
// TODO: attach decoded user payload to req.user
// TODO: call next() on success, return 401 on failure
function authenticate(req, res, next) {
  next();
}

module.exports = { authenticate };
