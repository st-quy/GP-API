const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("JWT_SECRET is not defined. Please set it in your .env file.");
  process.exit(1); // Exit if JWT_SECRET is missing
}

/**
 * Middleware for role-based authorization
 * @param {Array<string>} allowedRoles - List of roles allowed to access the route.
 */
function authorize(allowedRoles = []) {
  return (req, res, next) => {
    try {
      // Allow anonymous flag (if set by `allowAnonymous` middleware)
      if (req.allowAnonymous) {
        return next();
      }

      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ message: "Unauthorized: Missing or malformed token" });
      }

      const token = authHeader.split(" ")[1];

      try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Attach the decoded user information to the request object
        req.user = decoded;

        // Role-based authorization check - only check if allowedRoles has items
        if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
          return res
            .status(403)
            .json({ message: "Forbidden: Insufficient permissions" });
        }

        // Always proceed if we get here (user is authenticated)
        next();
      } catch (err) {
        console.error("JWT verification error:", err.message);
        return res.status(401).json({ message: "Invalid or expired token" });
      }
    } catch (err) {
      console.error("Authorization middleware error:", err.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}

/**
 * Middleware to mark routes as AllowAnonymous
 */
function allowAnonymous(req, res, next) {
  req.allowAnonymous = true;
  next();
}

module.exports = { authorize, allowAnonymous };
