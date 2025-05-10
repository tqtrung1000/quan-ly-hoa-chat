const { Bottle, Batch, Department, User, sequelize } = require('../models/index');

// @desc    Create new bottle
// @route   POST /api/bottles
// @access  Private
const createBottle = async (req, res) => {
  try {
    const { code } = req.body;

    // Check if bottle already exists
    const bottleExists = await Bottle.findOne({ 
      where: { code }
    });

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
    const bottles = await Bottle.findAll({
      include: [
        { 
          model: Department, 
          as: 'currentDepartment',
          attributes: ['name', 'code'] 
        },
        { 
          model: User, 
          as: 'currentUser',
          attributes: ['name', 'email'] 
        }
      ]
    });
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
    const BottleHistory = sequelize.models.BottleHistory;
    
    const bottle = await Bottle.findOne({
      where: { code },
      include: [
        { 
          model: Department, 
          as: 'currentDepartment',
          attributes: ['name', 'code'] 
        },
        { 
          model: User, 
          as: 'currentUser',
          attributes: ['name', 'email'] 
        }
      ]
    });

    if (!bottle) {
      return res.status(404).json({ message: 'Không tìm thấy chai' });
    }

    // Get bottle history
    const history = await BottleHistory.findAll({
      where: { bottleId: bottle.id },
      include: [
        { 
          model: Department,
          attributes: ['name', 'code'] 
        },
        { 
          model: User,
          attributes: ['name', 'email'] 
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Add history to bottle response
    const response = bottle.toJSON();
    response.history = history;
    
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// @desc    Distribute bottles
// @route   POST /api/bottles/distribute
// @access  Private
const distributeBottles = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { bottles, departmentId, userId, notes } = req.body;

    if (!bottles || !Array.isArray(bottles) || bottles.length === 0) {
      return res.status(400).json({ message: 'Không có chai nào được cung cấp để phân phối' });
    }

    // Check if department exists
    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Không tìm thấy khoa' });
    }

    // Generate batch ID (timestamp + random string)
    const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Create new batch
    const batch = await Batch.create({
      batchId,
      sourceDepartmentId: req.user.departmentId,
      targetDepartmentId: departmentId,
      distributedById: req.user.id,
      receivedById: userId,
      bottleCount: bottles.length,
      notes,
    }, { transaction });

    // Process each bottle
    const bottlePromises = bottles.map(async (bottleCode) => {
      const bottle = await Bottle.findOne({ 
        where: { code: bottleCode }
      });
      
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
      
      // Add bottle to batch through the junction table
      await batch.addBottle(bottle, { transaction });
      
      return { code: bottleCode, status: 'success', bottle };
    });

    const results = await Promise.all(bottlePromises);
    
    // Update department's bottlesOut count
    await department.updateBottleCount(
      results.filter(result => result.status === 'success').length
    );
    
    await transaction.commit();

    res.json({
      batchId,
      results,
      successCount: results.filter(r => r.status === 'success').length,
      errorCount: results.filter(r => r.status === 'error').length,
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// @desc    Return bottle
// @route   POST /api/bottles/return
// @access  Private
const returnBottle = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { code, notes } = req.body;

    // Find bottle by code
    const bottle = await Bottle.findOne({ 
      where: { code },
      include: [{ model: Department, as: 'currentDepartment' }]
    });

    if (!bottle) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy chai' });
    }

    if (bottle.status !== 'distributed') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Chai hiện không được phân phối' });
    }

    // Store department and batch ID before returning
    const departmentId = bottle.currentDepartmentId;
    const batchId = bottle.batchId;

    // Return the bottle
    await bottle.returnBottle(req.user.id, notes);

    // Update department's bottlesOut count
    const department = await Department.findByPk(departmentId);
    if (department) {
      await department.updateBottleCount(-1); // Decrease by 1
    }

    // Update batch's returnedCount
    if (batchId) {
      const batch = await Batch.findOne({ 
        where: { batchId },
        transaction
      });
      
      if (batch) {
        batch.returnedCount += 1;
        
        // If all bottles are returned, mark batch as completed
        if (batch.returnedCount >= batch.bottleCount) {
          batch.status = 'completed';
        }
        
        await batch.save({ transaction });
      }
    }

    await transaction.commit();

    // Fetch batch information for the response
    const batchInfo = batchId ? await Batch.findOne({
      where: { batchId },
      include: [
        { 
          model: Department, 
          as: 'sourceDepartment',
          attributes: ['name', 'code'] 
        },
        { 
          model: Department, 
          as: 'targetDepartment',
          attributes: ['name', 'code'] 
        },
        { 
          model: User, 
          as: 'distributedBy',
          attributes: ['name'] 
        },
        { 
          model: User, 
          as: 'receivedBy',
          attributes: ['name'] 
        }
      ]
    }) : null;

    // Get bottle with history for response
    const BottleHistory = sequelize.models.BottleHistory;
    const updatedBottle = await Bottle.findOne({
      where: { code },
      include: [{
        model: Department,
        as: 'currentDepartment',
        attributes: ['name', 'code']
      }]
    });
    
    const history = await BottleHistory.findAll({
      where: { bottleId: updatedBottle.id },
      include: [
        { 
          model: Department,
          attributes: ['name', 'code'] 
        },
        { 
          model: User,
          attributes: ['name'] 
        }
      ],
      order: [['createdAt', 'ASC']]
    });
    
    const bottleWithHistory = updatedBottle.toJSON();
    bottleWithHistory.history = history;

    res.json({
      message: 'Trả chai thành công',
      bottle: bottleWithHistory,
      batch: batchInfo,
    });
  } catch (error) {
    await transaction.rollback();
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
    
    const batch = await Batch.findOne({
      where: { batchId },
      include: [
        { 
          model: Department, 
          as: 'sourceDepartment',
          attributes: ['name', 'code'] 
        },
        { 
          model: Department, 
          as: 'targetDepartment',
          attributes: ['name', 'code'] 
        },
        { 
          model: User, 
          as: 'distributedBy',
          attributes: ['name', 'email'] 
        },
        { 
          model: User, 
          as: 'receivedBy',
          attributes: ['name', 'email'] 
        },
        {
          model: Bottle,
          through: 'BatchBottles'
        }
      ]
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
