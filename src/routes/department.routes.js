const express = require('express');
const router = express.Router();
const {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  getUnreturnedCount,
  searchDepartments,
} = require('../controllers/department.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// Protected routes
router.route('/')
  .get(protect, getDepartments)
  .post(protect, admin, createDepartment);

router.route('/search/:term')
  .get(protect, searchDepartments);

router.route('/:id')
  .get(protect, getDepartmentById)
  .put(protect, admin, updateDepartment);

router.route('/:id/unreturned')
  .get(protect, getUnreturnedCount);

module.exports = router;
