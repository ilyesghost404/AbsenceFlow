const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "absenceflow_jwt_secret_key_12345";

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return res.status(401).json({ success: false, message: "Token is not valid" });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access forbidden: insufficient permissions" });
    }
    next();
  };
};

module.exports = {
  requireAuth,
  authorizeRoles
};
