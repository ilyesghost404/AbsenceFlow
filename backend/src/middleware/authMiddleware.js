const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "absenceflow_jwt_secret_key_12345";

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if session exists in DB (for tracking and revocation)
    if (decoded.jti) {
      const session = await User.getSession(decoded.jti);
      if (!session) {
        return res.status(401).json({ success: false, message: "Session expired or revoked" });
      }
      
      // Optional: check session timeout (e.g., 30 minutes of inactivity)
      // Done mostly on frontend, but backend can enforce it
      const lastActivity = new Date(session.last_activity);
      const now = new Date();
      const diffMins = (now - lastActivity) / 60000;
      
      // If we strictly want to enforce 30 min backend timeout for non-remember-me sessions
      // We could add logic here. For now, we update activity.
      await User.updateSessionActivity(decoded.jti);
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return res.status(401).json({ success: false, message: "Token is not valid or expired" });
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
