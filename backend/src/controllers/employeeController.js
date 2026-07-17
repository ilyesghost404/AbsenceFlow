const Employee = require("../models/Employee");
const FaceProfile = require("../models/FaceProfile");

const getEmployees = async (req, res) => {
    try {
        const { page, limit, search } = req.query;
        const result = await Employee.getAll({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 10,
            search: search || ''
        });
        res.json({ success: true, ...result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch employees" });
    }
};

const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.getById(id);
        
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }
        
        res.json({ success: true, data: employee });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch employee" });
    }
};

const createEmployee = async (req, res) => {
    try {
        const { matricule, first_name, last_name, hire_date } = req.body;
        
        if (!matricule || !first_name || !last_name || !hire_date) {
            return res.status(400).json({ 
                success: false, 
                message: "Matricule, first name, last name, and hire date are required" 
            });
        }
        
        const employee = await Employee.create(req.body);
        res.status(201).json({ success: true, data: employee });
    } catch (error) {
        console.error(error);
        
        if (error.code === "23505") {
            return res.status(400).json({ success: false, message: "Matricule or email already exists" });
        }
        
        res.status(500).json({ success: false, message: "Failed to create employee" });
    }
};

const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { matricule, first_name, last_name, hire_date } = req.body;
        
        if (!matricule || !first_name || !last_name || !hire_date) {
            return res.status(400).json({ 
                success: false, 
                message: "Matricule, first name, last name, and hire date are required" 
            });
        }
        
        const employee = await Employee.update(id, req.body);
        
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }
        
        res.json({ success: true, data: employee });
    } catch (error) {
        console.error(error);
        
        if (error.code === "23505") {
            return res.status(400).json({ success: false, message: "Matricule or email already exists" });
        }
        
        res.status(500).json({ success: false, message: "Failed to update employee" });
    }
};

const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.delete(id);
        
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }
        
        res.json({ success: true, data: employee });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to delete employee" });
    }
};

const registerFace = async (req, res) => {
  try {
    const { id } = req.params;
    const { images } = req.body; // Array of 3 base64 strings
    
    if (!images || !Array.isArray(images) || images.length !== 3) {
      return res.status(400).json({ success: false, message: "Exactly three facial captures (front, left, right) are required" });
    }

    const employee = await Employee.getById(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Prevent duplicate registration
    const existing = await FaceProfile.getByEmployeeId(id);
    if (existing) {
      return res.status(400).json({ success: false, message: "Face profile is already registered for this employee" });
    }

    // Call AI service to generate embedding
    const aiResponse = await fetch("http://localhost:5001/api/ai/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images })
    });
    
    const aiResult = await aiResponse.json();
    if (!aiResponse.ok || !aiResult.success) {
      return res.status(400).json({ success: false, message: aiResult.reason || "Failed to generate facial signature" });
    }

    const embeddings = aiResult.embeddings;
    await FaceProfile.create(id, embeddings, aiResult.qualityScore || 95);

    res.json({ success: true, message: "Face profile registered successfully" });
  } catch (error) {
    console.error("Register face error:", error);
    res.status(500).json({ success: false, message: "An error occurred during face registration. Please try again." });
  }
};

module.exports = {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    registerFace
};
