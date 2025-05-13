const { 
  BloodBottleType, 
  BloodBottleItem, 
  BloodBottleHistory, 
  Department, 
  User 
} = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

exports.getAllBloodBottleTypes = async (req, res) => {
  try {
    const types = await BloodBottleType.findAll({
      order: [['name', 'ASC']]
    });
    res.status(200).json({ success: true, data: types });
  } catch (error) {
    console.error('Error fetching blood bottle types:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách loại chai máu' });
  }
};

exports.createBloodBottleType = async (req, res) => {
  try {
    const { name, unit, prefixCode, description } = req.body;

    // Validate prefixCode uniqueness if provided
    if (prefixCode) {
      const existingWithPrefix = await BloodBottleType.findOne({ where: { prefixCode } });
      if (existingWithPrefix) {
        return res.status(400).json({ success: false, message: 'Tiền tố mã này đã được sử dụng bởi loại chai máu khác' });
      }
    }

    const newType = await BloodBottleType.create({
      name,
      unit: unit || 'chai',
      prefixCode,
      stockQuantity: 0,
      description
    });

    res.status(201).json({ success: true, data: newType });
  } catch (error) {
    console.error('Error creating blood bottle type:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    res.status(500).json({ success: false, message: 'Lỗi khi tạo loại chai máu' });
  }
};

exports.updateBloodBottleType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit, prefixCode, description } = req.body;
    
    const type = await BloodBottleType.findByPk(id);
    if (!type) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy loại chai máu' });
    }

    // Validate prefixCode uniqueness if changed
    if (prefixCode && prefixCode !== type.prefixCode) {
      const existingWithPrefix = await BloodBottleType.findOne({ 
        where: { 
          prefixCode,
          id: { [Op.ne]: id } // Exclude current type
        } 
      });
      
      if (existingWithPrefix) {
        return res.status(400).json({ success: false, message: 'Tiền tố mã này đã được sử dụng bởi loại chai máu khác' });
      }
    }

    await type.update({
      name,
      unit: unit || type.unit,
      prefixCode,
      description
    });

    res.status(200).json({ success: true, data: type });
  } catch (error) {
    console.error('Error updating blood bottle type:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật loại chai máu' });
  }
};

exports.deleteBloodBottleType = async (req, res) => {
  try {
    const { id } = req.params;
    
    const type = await BloodBottleType.findByPk(id);
    if (!type) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy loại chai máu' });
    }

    // Check if there are any items of this type
    const itemCount = await BloodBottleItem.count({ where: { bloodBottleTypeId: id } });
    if (itemCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể xóa loại chai máu này vì đã có chai máu thuộc loại này trong hệ thống' 
      });
    }

    // Check if there's any history
    const historyCount = await BloodBottleHistory.count({ where: { bloodBottleTypeId: id } });
    if (historyCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể xóa loại chai máu này vì đã có lịch sử nhập/xuất trong hệ thống' 
      });
    }

    await type.destroy();
    res.status(200).json({ success: true, message: 'Xóa loại chai máu thành công' });
  } catch (error) {
    console.error('Error deleting blood bottle type:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa loại chai máu' });
  }
};

exports.importBloodBottles = async (req, res) => {
  try {
    const { bloodBottleTypeId, quantity, lotNumber, expiryDate, notes } = req.body;
    const userId = req.user.id; // From auth middleware
    
    // Validate inputs
    if (!bloodBottleTypeId || !quantity || !lotNumber || !expiryDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp đầy đủ thông tin: loại chai máu, số lượng, số lô và hạn sử dụng' 
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Số lượng phải lớn hơn 0' });
    }

    // Check if the blood bottle type exists
    const bloodBottleType = await BloodBottleType.findByPk(bloodBottleTypeId);
    if (!bloodBottleType) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy loại chai máu' });
    }

    // Validate expiry date
    const parsedExpiryDate = moment(expiryDate);
    if (!parsedExpiryDate.isValid() || parsedExpiryDate.isBefore(moment(), 'day')) {
      return res.status(400).json({ success: false, message: 'Hạn sử dụng không hợp lệ hoặc đã hết hạn' });
    }

    // Update stock quantity
    await bloodBottleType.increment('stockQuantity', { by: quantity });

    // Create history record for import
    const historyRecord = await BloodBottleHistory.create({
      action: 'import',
      bloodBottleTypeId,
      quantity,
      lotNumber,
      expiryDate: parsedExpiryDate.format('YYYY-MM-DD'),
      userId,
      notes
    });

    // Fetch the updated bloodBottleType
    const updatedType = await BloodBottleType.findByPk(bloodBottleTypeId);

    res.status(200).json({ 
      success: true, 
      message: `Nhập kho ${quantity} ${bloodBottleType.unit} thành công`,
      data: { 
        historyRecord,
        updatedType
      }
    });
  } catch (error) {
    console.error('Error importing blood bottles:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi nhập kho chai máu' });
  }
};

exports.distributeBloodBottle = async (req, res) => {
  try {
    const { barcode, departmentId, recipientName, notes, lotNumber, expiryDate } = req.body;
    const userId = req.user.id; // From auth middleware

    // Validate required fields
    if (!barcode || !departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: mã vạch và khoa nhận'
      });
    }

    // Check if the department exists
    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khoa' });
    }

    // Check if the blood bottle item already exists
    let bloodBottleItem = await BloodBottleItem.findOne({ where: { barcode } });
    
    if (bloodBottleItem) {
      // Item exists, check if it can be distributed
      if (bloodBottleItem.status !== 'returned') {
        let statusMessage;
        switch (bloodBottleItem.status) {
          case 'distributed': statusMessage = 'đã được phân phối'; break;
          case 'used': statusMessage = 'đã được sử dụng'; break;
          case 'expired': statusMessage = 'đã hết hạn'; break;
          case 'lost': statusMessage = 'đã mất'; break;
          default: statusMessage = 'không thể phân phối';
        }
        
        return res.status(400).json({
          success: false,
          message: `Chai máu này ${statusMessage} và không thể phân phối lại`
        });
      }

      // Update the returned item for redistribution
      await bloodBottleItem.update({
        status: 'distributed',
        currentDepartmentId: departmentId,
        currentUserId: userId,
        distributionDate: new Date(),
        recipientName: recipientName || null,
        notes: notes || bloodBottleItem.notes
      });
    } else {
      // New item, try to determine the blood bottle type from barcode prefix
      const allTypes = await BloodBottleType.findAll();
      let matchedType = null;

      // Check if any type's prefixCode matches the barcode's prefix
      for (const type of allTypes) {
        if (type.prefixCode && barcode.startsWith(type.prefixCode)) {
          matchedType = type;
          break;
        }
      }

      // If no type matched by prefix, require explicit type information
      if (!matchedType) {
        if (!req.body.bloodBottleTypeId || !lotNumber || !expiryDate) {
          return res.status(400).json({
            success: false,
            message: 'Không thể xác định loại chai máu từ mã vạch. Vui lòng cung cấp loại chai máu, số lô và hạn sử dụng'
          });
        }

        matchedType = await BloodBottleType.findByPk(req.body.bloodBottleTypeId);
        if (!matchedType) {
          return res.status(404).json({ success: false, message: 'Không tìm thấy loại chai máu' });
        }
      }

      // For new items, validate lot and expiry
      if (!lotNumber || !expiryDate) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp số lô và hạn sử dụng'
        });
      }

      const parsedExpiryDate = moment(expiryDate);
      if (!parsedExpiryDate.isValid()) {
        return res.status(400).json({ success: false, message: 'Hạn sử dụng không hợp lệ' });
      }

      // Check for shorter expiry dates to show warning
      const shorterExpiryEntries = await BloodBottleHistory.findAll({
        where: {
          bloodBottleTypeId: matchedType.id,
          action: 'import',
          expiryDate: { [Op.lt]: parsedExpiryDate.format('YYYY-MM-DD') }
        },
        order: [['expiryDate', 'ASC']],
        limit: 1
      });

      let hasWarning = false;
      let warningMessage = '';
      
      if (shorterExpiryEntries.length > 0) {
        hasWarning = true;
        warningMessage = `Còn chai máu ${matchedType.name} với hạn sử dụng ngắn hơn (${shorterExpiryEntries[0].expiryDate}) trong kho`;
      }

      // Create new blood bottle item
      bloodBottleItem = await BloodBottleItem.create({
        barcode,
        bloodBottleTypeId: matchedType.id,
        lotNumber,
        expiryDate: parsedExpiryDate.format('YYYY-MM-DD'),
        status: 'distributed',
        currentDepartmentId: departmentId,
        currentUserId: userId,
        distributionDate: new Date(),
        recipientName: recipientName || null,
        notes: notes || null
      });

      // Decrement stock quantity
      await matchedType.decrement('stockQuantity', { by: 1 });
    }

    // Create history record for distribution
    await BloodBottleHistory.create({
      action: 'distribute',
      bloodBottleTypeId: bloodBottleItem.bloodBottleTypeId,
      bloodBottleItemId: bloodBottleItem.id,
      departmentId,
      userId,
      recipientName: recipientName || null,
      notes: notes || null
    });

    const responseData = {
      success: true,
      message: 'Phân phối chai máu thành công',
      data: { bloodBottleItem }
    };

    // Add warning if present
    if (typeof hasWarning !== 'undefined' && hasWarning) {
      responseData.warning = warningMessage;
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error distributing blood bottle:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi phân phối chai máu' });
  }
};

exports.returnBloodBottle = async (req, res) => {
  try {
    const { barcode, notes } = req.body;
    const userId = req.user.id; // From auth middleware

    // Validate required fields
    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã vạch chai máu'
      });
    }

    // Find the blood bottle item
    const bloodBottleItem = await BloodBottleItem.findOne({ 
      where: { barcode },
      include: [{ model: BloodBottleType }]
    });

    if (!bloodBottleItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy chai máu với mã vạch này trong hệ thống' 
      });
    }

    // Check if the item is in a status that can be returned
    if (bloodBottleItem.status !== 'distributed') {
      let statusMessage;
      switch (bloodBottleItem.status) {
        case 'returned': statusMessage = 'đã được trả lại'; break;
        case 'used': statusMessage = 'đã được sử dụng'; break;
        case 'expired': statusMessage = 'đã hết hạn'; break;
        case 'lost': statusMessage = 'đã mất'; break;
        default: statusMessage = 'không thể trả lại';
      }
      
      return res.status(400).json({
        success: false,
        message: `Chai máu này ${statusMessage} và không thể trả lại`
      });
    }

    // Update item status to 'returned'
    await bloodBottleItem.update({
      status: 'returned',
      returnDate: new Date(),
      notes: notes || bloodBottleItem.notes
    });

    // Increment stock quantity
    await bloodBottleItem.BloodBottleType.increment('stockQuantity', { by: 1 });

    // Create history record for return
    await BloodBottleHistory.create({
      action: 'return',
      bloodBottleTypeId: bloodBottleItem.bloodBottleTypeId,
      bloodBottleItemId: bloodBottleItem.id,
      departmentId: bloodBottleItem.currentDepartmentId,
      userId,
      notes: notes || null
    });

    res.status(200).json({
      success: true,
      message: 'Trả lại chai máu thành công',
      data: { bloodBottleItem }
    });
  } catch (error) {
    console.error('Error returning blood bottle:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi trả lại chai máu' });
  }
};

exports.markBloodBottleUsed = async (req, res) => {
  try {
    const { barcode, notes } = req.body;
    const userId = req.user.id; // From auth middleware

    // Validate required fields
    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã vạch chai máu'
      });
    }

    // Find the blood bottle item
    const bloodBottleItem = await BloodBottleItem.findOne({ where: { barcode } });

    if (!bloodBottleItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy chai máu với mã vạch này trong hệ thống' 
      });
    }

    // Check if the item is in a status that can be marked as used
    if (bloodBottleItem.status !== 'distributed') {
      let statusMessage;
      switch (bloodBottleItem.status) {
        case 'returned': statusMessage = 'đã được trả lại'; break;
        case 'used': statusMessage = 'đã được sử dụng'; break;
        case 'expired': statusMessage = 'đã hết hạn'; break;
        case 'lost': statusMessage = 'đã mất'; break;
        default: statusMessage = 'không thể đánh dấu là đã sử dụng';
      }
      
      return res.status(400).json({
        success: false,
        message: `Chai máu này ${statusMessage} và không thể đánh dấu là đã sử dụng`
      });
    }

    // Update item status to 'used'
    await bloodBottleItem.update({
      status: 'used',
      usageDate: new Date(),
      notes: notes || bloodBottleItem.notes
    });

    // Create history record for usage
    await BloodBottleHistory.create({
      action: 'mark_used',
      bloodBottleTypeId: bloodBottleItem.bloodBottleTypeId,
      bloodBottleItemId: bloodBottleItem.id,
      departmentId: bloodBottleItem.currentDepartmentId,
      userId,
      notes: notes || null
    });

    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu chai máu là đã sử dụng',
      data: { bloodBottleItem }
    });
  } catch (error) {
    console.error('Error marking blood bottle as used:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi đánh dấu chai máu là đã sử dụng' });
  }
};

exports.getBloodBottleStats = async (req, res) => {
  try {
    const { startDate, endDate, departmentId, bloodBottleTypeId, status, lotNumber } = req.query;
    
    // Base query conditions
    const whereConditions = {};
    const itemWhereConditions = {};
    
    // Add filters if provided
    if (startDate && endDate) {
      whereConditions.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereConditions.createdAt = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      whereConditions.createdAt = { [Op.lte]: new Date(endDate) };
    }
    
    if (departmentId) {
      whereConditions.departmentId = departmentId;
    }
    
    if (bloodBottleTypeId) {
      whereConditions.bloodBottleTypeId = bloodBottleTypeId;
    }
    
    if (status) {
      itemWhereConditions.status = status;
    }
    
    if (lotNumber) {
      itemWhereConditions.lotNumber = lotNumber;
    }

    // Get history stats
    const historyStats = await BloodBottleHistory.findAll({
      where: whereConditions,
      include: [
        { model: BloodBottleType },
        { model: Department },
        { model: User },
        { 
          model: BloodBottleItem,
          where: Object.keys(itemWhereConditions).length > 0 ? itemWhereConditions : undefined
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Get items stats
    const itemStats = await BloodBottleItem.findAll({
      where: { ...itemWhereConditions },
      include: [
        { model: BloodBottleType },
        { model: Department, as: 'currentDepartment' },
        { model: User, as: 'currentUser' }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Get current stock by type
    const stockByType = await BloodBottleType.findAll({
      attributes: ['id', 'name', 'unit', 'stockQuantity']
    });

    // Get expiry stats (items expiring soon)
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const expiringItems = await BloodBottleItem.findAll({
      where: {
        expiryDate: {
          [Op.between]: [today, nextMonth]
        },
        status: {
          [Op.in]: ['distributed', 'returned'] // Only count active items
        }
      },
      include: [{ model: BloodBottleType }]
    });

    res.status(200).json({
      success: true,
      data: {
        history: historyStats,
        items: itemStats,
        stock: stockByType,
        expiring: expiringItems
      }
    });
  } catch (error) {
    console.error('Error getting blood bottle stats:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thống kê chai máu' });
  }
};
