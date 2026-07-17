const User = require("../models/User");
const FaceProfile = require("../models/FaceProfile");
const FaceSecurityLog = require("../models/FaceSecurityLog");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "absenceflow_jwt_secret_key_12345";

const registerFace = async (req, res) => {
  try {
    const { employeeId, token, image } = req.body;

    if (!employeeId || !image) {
      return res.status(400).json({ success: false, message: "Employee ID and image are required" });
    }

    let targetUser = null;

    // Authentication Validation
    if (token) {
      const user = await User.getByActivationToken(token);
      if (!user) {
        return res.status(400).json({ success: false, message: "Invalid or expired activation link" });
      }
      if (user.employee_id !== parseInt(employeeId, 10)) {
        return res.status(403).json({ success: false, message: "Biometric profile mismatch with activation link" });
      }
      targetUser = user;
    } else {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      
      const isSelf = req.user.role === 'employee' && req.user.employee_id === parseInt(employeeId, 10);
      const isPrivileged = req.user.role === 'admin' || req.user.role === 'manager';
      
      if (!isSelf && !isPrivileged) {
        return res.status(403).json({ success: false, message: "Access forbidden: you can only register your own face" });
      }
    }

    // Call Local AI Service
    let aiResponse;
    try {
      aiResponse = await fetch("http://localhost:5001/api/ai/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image })
      });
    } catch (err) {
      console.error("❌ AI Microservice connection failed:", err);
      return res.status(502).json({ success: false, message: "AI Face Microservice is offline or unreachable." });
    }

    const aiResult = await aiResponse.json();
    if (!aiResponse.ok || !aiResult.success) {
      const reason = aiResult.reason || "Failed to generate face signature";
      await FaceSecurityLog.record(employeeId, 'REGISTER', 'FAILED', null);
      return res.status(400).json({ success: false, message: reason, reason: aiResult.reason });
    }

    if (!aiResult.liveness) {
      await FaceSecurityLog.record(employeeId, 'REGISTER', 'FAILED', null);
      return res.status(400).json({ success: false, message: "Liveness verification failed (spoofing detected).", reason: "LIVENESS_FAILED" });
    }

    // Save profile to database
    const existingProfile = await FaceProfile.getByEmployeeId(employeeId);
    if (existingProfile) {
      await FaceProfile.update(employeeId, aiResult.embedding);
    } else {
      await FaceProfile.create(employeeId, aiResult.embedding);
    }

    await FaceSecurityLog.record(employeeId, 'REGISTER', 'SUCCESS', null);

    // If part of activation, activate user
    if (token && targetUser) {
      await User.completeActivation(targetUser.id);
    }

    return res.status(200).json({ success: true, message: "Face profile registered successfully via local AI" });

  } catch (err) {
    console.error("Local AI Register face error:", err);
    await FaceSecurityLog.record(req.body.employeeId, 'REGISTER', 'ERROR', null);
    return res.status(500).json({ success: false, message: "AI Registration failed: " + err.message });
  }
};

const updateFace = async (req, res) => {
  try {
    const { verifyToken, image } = req.body;

    if (!verifyToken || !image) {
      return res.status(400).json({ success: false, message: "Verify token and image are required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(verifyToken, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired verify token" });
    }

    const employeeId = decoded.employeeId;
    if (req.user.employee_id !== employeeId) {
      return res.status(403).json({ success: false, message: "Face profile mismatch with logged in user" });
    }

    let aiResponse;
    try {
      aiResponse = await fetch("http://localhost:5001/api/ai/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image })
      });
    } catch (err) {
      return res.status(502).json({ success: false, message: "AI Microservice unreachable" });
    }

    const aiResult = await aiResponse.json();
    if (!aiResponse.ok || !aiResult.success) {
      return res.status(400).json({ success: false, message: aiResult.reason || "AI processing failed", reason: aiResult.reason });
    }

    if (!aiResult.liveness) {
      await FaceSecurityLog.record(employeeId, 'UPDATE', 'FAILED', null);
      return res.status(400).json({ success: false, message: "Liveness verification failed.", reason: "LIVENESS_FAILED" });
    }

    // Update DB
    await FaceProfile.update(employeeId, aiResult.embedding);
    await FaceSecurityLog.record(employeeId, 'UPDATE', 'SUCCESS', null);

    return res.status(200).json({ success: true, message: "Face profile updated successfully" });
  } catch (err) {
    console.error("Local AI Update face error:", err);
    return res.status(500).json({ success: false, message: "AI Update failed: " + err.message });
  }
};

const getFaceStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Check permission
    const isSelf = req.user.role === 'employee' && req.user.employee_id === parseInt(employeeId, 10);
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'manager';
    
    if (!isSelf && !isPrivileged) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const profile = await FaceProfile.getByEmployeeId(employeeId);
    
    if (!profile) {
      return res.status(200).json({ 
        success: true, 
        registered: false,
        status: 'none'
      });
    }

    return res.status(200).json({ 
      success: true, 
      registered: true,
      status: profile.status,
      registeredAt: profile.face_registered_at,
      lastVerification: profile.last_face_verification
    });
  } catch (err) {
    console.error("Get face status error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const verifyCurrentFace = async (req, res) => {
  try {
    const { image } = req.body;
    const employeeId = req.user.employee_id;

    if (!image) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }

    const profile = await FaceProfile.getByEmployeeId(employeeId);
    if (!profile || !profile.face_embedding) {
      return res.status(400).json({ success: false, message: "No registered face profile found." });
    }

    let aiResponse;
    try {
      aiResponse = await fetch("http://localhost:5001/api/ai/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, embedding: profile.face_embedding })
      });
    } catch (err) {
      console.error("❌ AI Microservice connection failed:", err);
      return res.status(502).json({ success: false, message: "AI Microservice unreachable" });
    }

    const aiResult = await aiResponse.json();
    if (!aiResponse.ok || !aiResult.success) {
      await FaceSecurityLog.record(employeeId, 'VERIFY', 'FAILED', null);
      return res.status(400).json({ success: false, message: aiResult.reason || "Verification failed", reason: aiResult.reason });
    }

    if (!aiResult.liveness) {
      await FaceSecurityLog.record(employeeId, 'VERIFY', 'FAILED', null);
      return res.status(400).json({ success: false, message: "Liveness verification failed.", reason: "LIVENESS_FAILED" });
    }

    if (!aiResult.match) {
      await FaceSecurityLog.record(employeeId, 'VERIFY', 'FAILED', null);
      return res.status(400).json({ success: false, message: "Face does not match your current profile.", reason: "FACE_NOT_MATCHED" });
    }

    await FaceSecurityLog.record(employeeId, 'VERIFY', 'SUCCESS', null);

    // Generate secure token for update-face step
    const verifyToken = jwt.sign(
      { employeeId, faceVerified: true },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.status(200).json({
      success: true,
      verified: true,
      verifyToken
    });

  } catch (err) {
    console.error("Local AI Verify current face error:", err);
    return res.status(500).json({ success: false, message: "AI Verification failed: " + err.message });
  }
};

module.exports = {
  registerFace,
  updateFace,
  getFaceStatus,
  verifyCurrentFace
};
