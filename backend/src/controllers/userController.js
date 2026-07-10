const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "absenceflow_jwt_secret_key_12345";

const login = async (req, res) => {
  const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username/email and password are required" });
    }

    const user = await User.getByUsernameOrEmail(username);

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: "Account is disabled. Please contact your administrator." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      // Record failed login attempt
      await User.recordLogin(user.id, ipAddress, false);
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Record successful login
    await User.recordLogin(user.id, ipAddress, true);

    // Log activity
    await User.recordActivity(user.id, "login", user.id, `User '${user.username}' logged in`, ipAddress);

    // Create JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        employee_id: user.employee_id
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          employee_id: user.employee_id,
          employee_name: user.employee_name
        }
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Failed to login user" });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.getById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        employee_id: user.employee_id,
        employee_name: user.employee_name,
        is_active: user.is_active
      }
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user details" });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("GetUsers error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users list" });
  }
};

const createUser = async (req, res) => {
  const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  try {
    const { username, email, password, role, employee_id } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "Username, email, password, and role are required" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password_hash,
      role,
      employee_id
    });

    // Log activity
    await User.recordActivity(
      req.user.id,
      "user_created",
      newUser.id,
      `User '${username}' created with role '${role}' by admin '${req.user.username}'`,
      ipAddress
    );

    res.status(201).json({ success: true, data: newUser });

  } catch (error) {
    console.error("CreateUser error:", error);
    if (error.code === "23505") {
      return res.status(400).json({ success: false, message: "Username or email already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to create user" });
  }
};

const updateUser = async (req, res) => {
  const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  try {
    const { id } = req.params;
    const { username, email, password, role, employee_id, is_active } = req.body;

    if (!username || !email || !role) {
      return res.status(400).json({ success: false, message: "Username, email, and role are required" });
    }

    // Fetch original user to detect changes
    const originalUser = await User.getById(id);

    let password_hash = null;
    if (password) {
      password_hash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.update(id, {
      username,
      email,
      password_hash,
      role,
      employee_id,
      is_active: is_active === undefined ? true : is_active
    });

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const actorName = req.user.username;
    const targetName = username;

    // Log role change
    if (originalUser && originalUser.role !== role) {
      await User.recordActivity(
        req.user.id,
        "role_changed",
        parseInt(id),
        `Role of '${targetName}' changed from '${originalUser.role}' to '${role}' by '${actorName}'`,
        ipAddress
      );
    }

    // Log account enable/disable
    if (originalUser && originalUser.is_active !== is_active) {
      const actionType = is_active ? "account_enabled" : "account_disabled";
      const actionLabel = is_active ? "enabled" : "disabled";
      await User.recordActivity(
        req.user.id,
        actionType,
        parseInt(id),
        `Account '${targetName}' ${actionLabel} by '${actorName}'`,
        ipAddress
      );
    }

    // Log password change
    if (password) {
      await User.recordActivity(
        req.user.id,
        "password_changed",
        parseInt(id),
        `Password changed for '${targetName}' by '${actorName}'`,
        ipAddress
      );
    }

    // Log general update (if nothing else specific changed)
    if (originalUser && originalUser.role === role && originalUser.is_active === is_active && !password) {
      await User.recordActivity(
        req.user.id,
        "user_updated",
        parseInt(id),
        `User '${targetName}' updated by '${actorName}'`,
        ipAddress
      );
    }

    res.json({ success: true, data: updatedUser });

  } catch (error) {
    console.error("UpdateUser error:", error);
    if (error.code === "23505") {
      return res.status(400).json({ success: false, message: "Username or email already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
};

const deleteUser = async (req, res) => {
  const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  try {
    const { id } = req.params;
    
    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account" });
    }

    // Fetch user info before deleting
    const targetUser = await User.getById(id);

    const deletedUser = await User.delete(id);

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Log activity (target_user_id will be NULL after deletion due to ON DELETE SET NULL)
    await User.recordActivity(
      req.user.id,
      "user_deleted",
      null,
      `User '${targetUser?.username || id}' deleted by '${req.user.username}'`,
      ipAddress
    );

    res.json({ success: true, message: "User deleted successfully", data: deletedUser });

  } catch (error) {
    console.error("DeleteUser error:", error);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};

module.exports = {
  login,
  getMe,
  getUsers,
  createUser,
  updateUser,
  deleteUser
};
