const express = require('express');
const router = express.Router();
const bloodBottleController = require('../controllers/bloodbottle.controller');
const { protect } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(protect);

// Blood bottle type management routes
router.get('/types', bloodBottleController.getAllBloodBottleTypes);
router.post('/types', bloodBottleController.createBloodBottleType);
router.put('/types/:id', bloodBottleController.updateBloodBottleType);
router.delete('/types/:id', bloodBottleController.deleteBloodBottleType);

// Blood bottle operations
router.post('/import', bloodBottleController.importBloodBottles);
router.post('/distribute', bloodBottleController.distributeBloodBottle);
router.post('/return', bloodBottleController.returnBloodBottle);
router.post('/mark-used', bloodBottleController.markBloodBottleUsed);

// Statistics and reporting
router.get('/stats', bloodBottleController.getBloodBottleStats);

module.exports = router;
