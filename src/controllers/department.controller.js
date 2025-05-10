const Department = require('../models/department.model');
const Bottle = require('../models/bottle.model');

// @desc    Create new department
// @route   POST /api/departments
// @access  Private/Admin
const createDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    // Check if department with name or code already exists
    const departmentExists = await Department.findOne({
      $or: [{ name }, { code }],
    });

    if (departmentExists) {
      return res.status(400).json({
        message: 'Khoa với tên hoặc mã này đã tồn tại',
      });
    }

    const department = await Department.create({
      name,
      code,
      description,
    });

    if (department) {
      res.status(201).json(department);
    } else {
      res.status(400).json({ message: 'Dữ liệu khoa không hợp lệ' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({});
    res.json(departments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// @desc    Get department by ID
// @route   GET /api/departments/:id
// @access  Private
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (department) {
      res.json(department);
    } else {
      res.status(404).json({ message: 'Không tìm thấy khoa' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private/Admin
const updateDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ message: 'Không tìm thấy khoa' });
    }

    if (name !== department.name || code !== department.code) {
      // Check if another department has the same name or code
      const conflictingDepartment = await Department.findOne({
        $or: [{ name }, { code }],
        _id: { $ne: req.params.id },
      });

      if (conflictingDepartment) {
        return res.status(400).json({
          message: 'Đã có khoa khác với tên hoặc mã này',
        });
      }
    }

    department.name = name || department.name;
    department.code = code || department.code;
    department.description = description || department.description;

    const updatedDepartment = await department.save();
    res.json(updatedDepartment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// @desc    Get unreturned bottles count for a department
// @route   GET /api/departments/:id/unreturned
// @access  Private
const getUnreturnedCount = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ message: 'Không tìm thấy khoa' });
    }

    const unreturnedBottles = await Bottle.find({
      currentDepartment: req.params.id,
      status: 'distributed',
    });

    res.json({
      department: {
        _id: department._id,
        name: department.name,
        code: department.code,
      },
      unreturnedCount: unreturnedBottles.length,
      bottles: unreturnedBottles,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// @desc    Search departments
// @route   GET /api/departments/search/:term
// @access  Private
const searchDepartments = async (req, res) => {
  try {
    const searchTerm = req.params.term;
    if (!searchTerm || searchTerm.trim() === '') {
      return res.status(400).json({ message: 'Từ khóa tìm kiếm là bắt buộc' });
    }

    const departments = await Department.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { code: { $regex: searchTerm, $options: 'i' } },
      ],
    });

    res.json(departments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  getUnreturnedCount,
  searchDepartments,
};
