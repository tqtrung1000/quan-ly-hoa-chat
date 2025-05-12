const { Bottle, Batch, Department, User, sequelize } = require('../models/index');
const { Transaction } = require('sequelize');

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
          attributes: ['name'] // Removed email
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
          attributes: ['name'] // Removed email
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
          attributes: ['name'] // Removed email
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
  try {
    const { bottles, departmentId, recipientName, notes } = req.body;

    if (!bottles || !Array.isArray(bottles) || bottles.length === 0) {
      return res.status(400).json({ message: 'Không có chai nào được cung cấp để phân phối' });
    }

    const result = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    }, async (t) => {
      const department = await Department.findByPk(departmentId, { transaction: t });
      if (!department) {
        // This error will cause the transaction to rollback
        const err = new Error('Không tìm thấy khoa');
        err.statusCode = 404;
        throw err;
      }

      const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      const batch = await Batch.create({
        batchId,
        sourceDepartmentId: req.user.departmentId,
        targetDepartmentId: departmentId,
        distributedById: req.user.id,
        recipientName: recipientName,
        bottleCount: bottles.length,
        notes,
      }, { transaction: t });

      const results = [];
      let successCount = 0;
      for (const bottleCode of bottles) {
        const bottle = await Bottle.findOne({ 
          where: { code: bottleCode },
          transaction: t 
        });
        
        if (!bottle) {
          results.push({ code: bottleCode, status: 'error', message: 'Không tìm thấy chai' });
          continue;
        }
        
        if (bottle.status !== 'available') {
          results.push({ 
            code: bottleCode, 
            status: 'error', 
            message: 'Chai không khả dụng để phân phối' 
          });
          continue;
        }
        
        await bottle.distribute(departmentId, null, recipientName, batchId, notes, t); 
        await batch.addBottle(bottle, { transaction: t });
        
        results.push({ code: bottleCode, status: 'success', bottle });
        successCount++;
      }
      
      if (successCount > 0) {
        await department.updateBottleCount(successCount, { transaction: t });
      }
      
      return { // This value is returned if the transaction commits
        batchId,
        results,
        successCount,
        errorCount: results.length - successCount,
      };
    });

    res.json(result);

  } catch (error) {
    console.error(error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// @desc    Return bottle
// @route   POST /api/bottles/return
// @access  Private
const returnBottle = async (req, res) => {
  try {
    const { code, notes } = req.body;

    const returnedData = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    }, async (t) => {
      const bottle = await Bottle.findOne({ 
        where: { code },
        include: [{ model: Department, as: 'currentDepartment' }],
        transaction: t 
      });

      if (!bottle) {
        const err = new Error('Không tìm thấy chai');
        err.statusCode = 404;
        throw err;
      }

      if (bottle.status !== 'distributed') {
        const err = new Error('Chai hiện không được phân phối');
        err.statusCode = 400;
        throw err;
      }

      const departmentId = bottle.currentDepartmentId;
      const originalBatchId = bottle.batchId; // Renamed to avoid conflict

      await bottle.returnBottle(req.user.id, notes, t);

      const department = await Department.findByPk(departmentId, { transaction: t });
      if (department) {
        await department.updateBottleCount(-1, { transaction: t });
      }

      if (originalBatchId) {
        const batch = await Batch.findOne({ 
          where: { batchId: originalBatchId }, // Use originalBatchId
          transaction: t
        });
        
        if (batch) {
          batch.returnedCount += 1;
          if (batch.returnedCount >= batch.bottleCount) {
            batch.status = 'completed';
          }
          await batch.save({ transaction: t });
        }
      }
      // Data to be used for fetching details after commit
      return { code, batchId: originalBatchId }; 
    });

    // Fetch details after transaction has committed
    const batchInfo = returnedData.batchId ? await Batch.findOne({
      where: { batchId: returnedData.batchId },
      include: [
        { model: Department, as: 'sourceDepartment', attributes: ['name', 'code'] },
        { model: Department, as: 'targetDepartment', attributes: ['name', 'code'] },
        { model: User, as: 'distributedBy', attributes: ['name'] },
        { model: User, as: 'receivedBy', attributes: ['name'] }
      ]
    }) : null;

    const BottleHistory = sequelize.models.BottleHistory;
    const updatedBottle = await Bottle.findOne({
      where: { code: returnedData.code },
      include: [{ model: Department, as: 'currentDepartment', attributes: ['name', 'code'] }]
    });
    
    const history = await BottleHistory.findAll({
      where: { bottleId: updatedBottle.id },
      include: [
        { model: Department, attributes: ['name', 'code'] },
        { model: User, attributes: ['name'] }
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
    console.error(error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
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
          attributes: ['name'] // Removed email
        },
        { 
          model: User, 
          as: 'receivedBy',
          attributes: ['name'] // Removed email
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
