const express = require('express');
const router = express.Router();
const controller = require('../controllers/chemical.controller');
const { protect } = require('../middleware/auth.middleware'); // Corrected middleware import

// Apply authentication middleware to all routes
router.use(protect); // Corrected middleware usage

// Import chemicals
router.post('/import', controller.importChemicals);

// Distribute chemicals
router.post('/distribute', controller.distributeChemicals);

// Return chemicals
router.post('/return', controller.returnChemicals);

module.exports = router;
