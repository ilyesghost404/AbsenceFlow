const Holiday = require("../models/Holiday");

const getHolidays = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const result = await Holiday.getAll({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        search: search || ''
    });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("Error fetching holidays:", error);
    res.status(500).json({ success: false, message: "Failed to fetch holidays" });
  }
};

const getHolidayById = async (req, res) => {
  try {
    const { id } = req.params;
    const holiday = await Holiday.getById(id);

    if (!holiday) {
      return res.status(404).json({ success: false, message: "Holiday not found" });
    }

    res.json({ success: true, data: holiday });
  } catch (error) {
    console.error("Error fetching holiday:", error);
    res.status(500).json({ success: false, message: "Failed to fetch holiday" });
  }
};

const createHoliday = async (req, res) => {
  try {
    const { holiday_date, name } = req.body;

    if (!holiday_date || !name) {
      return res.status(400).json({
        success: false,
        message: "Holiday date and name are required"
      });
    }

    const holiday = await Holiday.create(req.body);
    res.status(201).json({ success: true, data: holiday });
  } catch (error) {
    console.error("Error creating holiday:", error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: "A holiday already exists on this date" });
    }
    res.status(500).json({ success: false, message: "Failed to create holiday" });
  }
};

const updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const { holiday_date, name } = req.body;

    if (!holiday_date || !name) {
      return res.status(400).json({
        success: false,
        message: "Holiday date and name are required"
      });
    }

    const holiday = await Holiday.update(id, req.body);

    if (!holiday) {
      return res.status(404).json({ success: false, message: "Holiday not found" });
    }

    res.json({ success: true, data: holiday });
  } catch (error) {
    console.error("Error updating holiday:", error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: "A holiday already exists on this date" });
    }
    res.status(500).json({ success: false, message: "Failed to update holiday" });
  }
};

const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const holiday = await Holiday.delete(id);

    if (!holiday) {
      return res.status(404).json({ success: false, message: "Holiday not found" });
    }

    res.json({ success: true, data: holiday });
  } catch (error) {
    console.error("Error deleting holiday:", error);
    res.status(500).json({ success: false, message: "Failed to delete holiday" });
  }
};

module.exports = {
  getHolidays,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday
};
