const express = require('express');
const router = express.Router();
const controller = require('../controllers/chemicaltype.controller');
const { protect } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(protect);

// Get all chemical types
router.get('/', controller.getAllChemicalTypes);

// Create new chemical type
router.post('/', controller.createChemicalType);

// Get single chemical type
router.get('/:id', controller.getChemicalTypeById);

// Update chemical type
router.put('/:id', controller.updateChemicalType);

// Delete chemical type
router.delete('/:id', controller.deleteChemicalType);

module.exports = router;
