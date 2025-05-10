const Bottle = require('../models/bottle.model');
const Batch = require('../models/batch.model');
const Department = require('../models/department.model');

// @desc    Create new bottle
// @route   POST /api/bottles
// @access  Private
const createBottle = async (req, res) => {
  try {
    const { code } = req.body;

    // Check if bottle already exists
    const bottleExists = await Bottle.findOne({ code });

    if (bottleExists) {
      return res.status(400).json({ message: 'Chai với mã này đã tồn tại' });
    }

    const bottle = await Bottle.create({
      code,
      status: 'available',
    });

    if (bottle) {
      res.status(201).json(bottle);
    } else {
      res.status(400).json({ message: 'Dữ liệu chai không hợp lệ' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// @desc    Get all bottles
// @route   GET /api/bottles
// @access  Private
const getBottles = async (req, res) => {
  try {
    const bottles = await Bottle.find({})
      .populate('currentDepartment', 'name code')
      .populate('currentUser', 'name email');
    res.json(bottles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// @desc    Get bottle by code
// @route   GET /api/bottles/code/:code
// @access  Private
const getBottleByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const bottle = await Bottle.findOne({ code })
      .populate('currentDepartment', 'name code')
      .populate('currentUser', 'name email')
      .populate({
        path: 'history.department',
        select: 'name code',
      })
      .populate({
        path: 'history.user',
        select: 'name email',
      });

    if (bottle) {
      res.json(bottle);
    } else {
      res.status(404).json({ message: 'Không tìm thấy chai' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// @desc    Distribute bottles
// @route   POST /api/bottles/distribute
// @access  Private
const distributeBottles = async (req, res) => {
  try {
    const { bottles, departmentId, userId, notes } = req.body;

    if (!bottles || !Array.isArray(bottles) || bottles.length === 0) {
      return res.status(400).json({ message: 'Không có chai nào được cung cấp để phân phối' });
    }

    // Check if department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Không tìm thấy khoa' });
    }

    // Generate batch ID (timestamp + random string)
    const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Create new batch
    const batch = await Batch.create({
      batchId,
      sourceDepartment: req.user.department,
      targetDepartment: departmentId,
      distributedBy: req.user._id,
      receivedBy: userId,
      bottleCount: bottles.length,
      notes,
    });

    // Process each bottle
    const bottlePromises = bottles.map(async (bottleCode) => {
      const bottle = await Bottle.findOne({ code: bottleCode });
      
      if (!bottle) {
        return { code: bottleCode, status: 'error', message: 'Không tìm thấy chai' };
      }
      
      if (bottle.status !== 'available') {
        return { 
          code: bottleCode, 
          status: 'error', 
          message: 'Chai không khả dụng để phân phối' 
        };
      }
      
      await bottle.distribute(departmentId, userId, batchId, notes);
      
      // Add bottle to batch
      batch.bottles.push(bottle._id);
      
      return { code: bottleCode, status: 'success', bottle };
    });

    const results = await Promise.all(bottlePromises);
    
    // Update department's bottlesOut count
    await department.updateBottleCount(
      results.filter(result => result.status === 'success').length
    );
    
    // Save updated batch with bottle references
    await batch.save();

    res.json({
      batchId,
      results,
      successCount: results.filter(r => r.status === 'success').length,
      errorCount: results.filter(r => r.status === 'error').length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// @desc    Return bottle
// @route   POST /api/bottles/return
// @access  Private
const returnBottle = async (req, res) => {
  try {
    const { code, notes } = req.body;

    // Find bottle by code
    const bottle = await Bottle.findOne({ code }).populate('currentDepartment');

    if (!bottle) {
      return res.status(404).json({ message: 'Không tìm thấy chai' });
    }

    if (bottle.status !== 'distributed') {
      return res.status(400).json({ message: 'Chai hiện không được phân phối' });
    }

    // Store department and batch ID before returning
    const departmentId = bottle.currentDepartment._id;
    const batchId = bottle.batchId;

    // Return the bottle
    await bottle.returnBottle(req.user._id, notes);

    // Update department's bottlesOut count
    const department = await Department.findById(departmentId);
    if (department) {
      await department.updateBottleCount(-1); // Decrease by 1
    }

    // Update batch's returnedCount
    if (batchId) {
      const batch = await Batch.findOne({ batchId });
      if (batch) {
        batch.returnedCount += 1;
        
        // If all bottles are returned, mark batch as completed
        if (batch.returnedCount >= batch.bottleCount) {
          batch.status = 'completed';
        }
        
        await batch.save();
      }
    }

    // Fetch batch information for the response
    const batchInfo = batchId ? await Batch.findOne({ batchId })
      .populate('sourceDepartment', 'name code')
      .populate('targetDepartment', 'name code')
      .populate('distributedBy', 'name')
      .populate('receivedBy', 'name') : null;

    res.json({
      message: 'Trả chai thành công',
      bottle: await Bottle.findOne({ code })
        .populate('history.department', 'name code')
        .populate('history.user', 'name'),
      batch: batchInfo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// @desc    Get batch info
// @route   GET /api/bottles/batch/:batchId
// @access  Private
const getBatchInfo = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const batch = await Batch.findOne({ batchId })
      .populate('sourceDepartment', 'name code')
      .populate('targetDepartment', 'name code')
      .populate('distributedBy', 'name email')
      .populate('receivedBy', 'name email')
      .populate({
        path: 'bottles',
        populate: {
          path: 'history.department',
          select: 'name code',
        },
      });

    if (!batch) {
      return res.status(404).json({ message: 'Không tìm thấy lô' });
    }

    res.json(batch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

module.exports = {
  createBottle,
  getBottles,
  getBottleByCode,
  distributeBottles,
  returnBottle,
  getBatchInfo,
};
