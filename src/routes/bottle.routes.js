const express = require('express');
const router = express.Router();
const {
  createBottle,
  getBottles,
  getBottleByCode,
  distributeBottles,
  returnBottle,
  getBatchInfo,
} = require('../controllers/bottle.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// All routes are protected
router.route('/')
  .get(protect, getBottles)
  .post(protect, admin, createBottle);

router.route('/code/:code')
  .get(protect, getBottleByCode);

router.route('/distribute')
  .post(protect, distributeBottles);

router.route('/return')
  .post(protect, returnBottle);

router.route('/batch/:batchId')
  .get(protect, getBatchInfo);

module.exports = router;
