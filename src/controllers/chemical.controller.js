const { ChemicalType, ChemicalItem, ChemicalHistory, UnknownBarcodeLog, User, Department, Batch, sequelize } = require('../models');
const { Transaction } = require('sequelize');

// @desc    Import chemicals (Type 1 or Type 2)
// @route   POST /api/chemicals/import
// @access  Private
exports.importChemicals = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { chemicalTypeId, quantity, batchId, notes } = req.body;
    const userId = req.user.id; // Assuming user is authenticated

    if (!chemicalTypeId || !quantity || quantity <= 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Vui lòng cung cấp loại hóa chất và số lượng hợp lệ' });
    }

    const chemicalType = await ChemicalType.findByPk(chemicalTypeId, { transaction: t });

    if (!chemicalType) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy loại hóa chất' });
    }

    // Update stock based on barcode type
    if (chemicalType.barcodeType === 'Type1') {
      chemicalType.stockQuantity += quantity;
    } else if (chemicalType.barcodeType === 'Type2') {
      chemicalType.stockQuantityType2 += quantity;
    } else {
      await t.rollback();
      return res.status(400).json({ message: 'Loại mã vạch không hợp lệ cho loại hóa chất này' });
    }

    await chemicalType.save({ transaction: t });

    // If batchId is provided, check if batch exists
    let batch = null;
    if (batchId) {
      batch = await Batch.findOne({
        where: { batchId: batchId },
        transaction: t
      });
      
      if (!batch) {
        // Create a new batch if it doesn't exist
        try {
          batch = await Batch.create({
            batchId: batchId,
            bottleCount: quantity,
            notes: notes || null,
            // Other batch fields can be set to default or provided values
            status: 'active'
          }, { transaction: t });
        } catch (batchError) {
          console.error('Error creating batch:', batchError);
          // If there's an error creating the batch, continue without linking to batch
        }
      }
    }
    
    // Create history record
    await ChemicalHistory.create({
      action: 'import',
      chemicalTypeId: chemicalType.id,
      quantity: quantity,
      userId: userId,
      batchId: batch ? batch.id : null, // Link to batch ID if found or created
      notes: notes || null
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ message: `Nhập ${quantity} ${chemicalType.unit} ${chemicalType.name} thành công` });

  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ khi nhập hóa chất', error: error.message });
  }
};

// @desc    Distribute chemicals (Type 1 or Type 2)
// @route   POST /api/chemicals/distribute
// @access  Private
exports.distributeChemicals = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { barcode, departmentId, recipientName, notes } = req.body;
    const userId = req.user.id; // Assuming user is authenticated

    if (!barcode || !departmentId || !recipientName) {
      await t.rollback();
      return res.status(400).json({ message: 'Vui lòng cung cấp mã vạch, khoa nhận và tên người nhận' });
    }

    const department = await Department.findByPk(departmentId, { transaction: t });
    if (!department) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy khoa nhận' });
    }

    // Try to find ChemicalType by representativeCode (for Type 1)
    let chemicalType = await ChemicalType.findOne({
      where: { representativeCode: barcode, barcodeType: 'Type1' },
      transaction: t
    });

    if (chemicalType) {
      // Found a Type 1 chemical
      if (chemicalType.stockQuantity <= 0) {
        await t.rollback();
        return res.status(400).json({ message: `Hóa chất ${chemicalType.name} đã hết hàng` });
      }

      // For Type 1, need quantity. Ask user for quantity.
      // This controller cannot directly ask the user. The frontend must handle getting the quantity
      // after receiving a response indicating it's a Type 1 chemical.
      // For now, assume quantity is provided in the request body for Type 1 distribution.
      // A better approach might be a separate endpoint for Type 1 distribution with quantity.
      // Let's assume for this implementation that if a Type 1 barcode is scanned,
      // the request body *must* also contain the 'quantity' field.

      const { quantity } = req.body;
      if (!quantity || quantity <= 0) {
         await t.rollback();
         return res.status(400).json({ message: 'Vui lòng cung cấp số lượng cho hóa chất này' });
      }

      if (chemicalType.stockQuantity < quantity) {
        await t.rollback();
        return res.status(400).json({ message: `Số lượng tồn kho của ${chemicalType.name} không đủ (${chemicalType.stockQuantity})` });
      }

      chemicalType.stockQuantity -= quantity;
      await chemicalType.save({ transaction: t });

      // Create history record for Type 1 distribution
      await ChemicalHistory.create({
        action: 'distribute',
        chemicalTypeId: chemicalType.id,
        quantity: quantity,
        departmentId: department.id,
        userId: userId,
        recipientName: recipientName,
        notes: notes || null
      }, { transaction: t });

      await t.commit();
      return res.status(200).json({
        message: `Phân phối ${quantity} ${chemicalType.unit} ${chemicalType.name} thành công`,
        chemicalType: chemicalType,
        distributedQuantity: quantity
      });

    } else {
      // Not a Type 1 chemical, check for Type 2 prefix match
      const chemicalTypesType2 = await ChemicalType.findAll({
        where: { barcodeType: 'Type2' },
        transaction: t
      });

      let matchedChemicalType = null;
      for (const type of chemicalTypesType2) {
        if (type.representativeCode && barcode.startsWith(type.representativeCode)) {
          matchedChemicalType = type;
          break;
        }
      }

      if (matchedChemicalType) {
        // Found a Type 2 chemical prefix match
        if (matchedChemicalType.stockQuantityType2 <= 0) {
           await t.rollback();
           return res.status(400).json({ message: `Hóa chất ${matchedChemicalType.name} đã hết hàng` });
        }

        // Check if this specific item barcode is already distributed or lost
        const existingItem = await ChemicalItem.findOne({
          where: { barcode: barcode },
          transaction: t
        });

        if (existingItem && (existingItem.status === 'distributed' || existingItem.status === 'lost')) {
           await t.rollback();
           return res.status(400).json({ message: `Chai/lọ với mã vạch ${barcode} đã được phân phối hoặc bị mất` });
        }

        // Decrease Type 2 stock count
        matchedChemicalType.stockQuantityType2 -= 1;
        await matchedChemicalType.save({ transaction: t });

        let chemicalItem;
        if (existingItem && existingItem.status === 'returned') {
          // If item was previously returned, update its status and details
          chemicalItem = existingItem;
          chemicalItem.status = 'distributed';
          chemicalItem.distributionDate = new Date();
          chemicalItem.returnDate = null; // Clear return date
          chemicalItem.currentDepartmentId = department.id;
          chemicalItem.currentUserId = userId;
          chemicalItem.recipientName = recipientName;
          chemicalItem.notes = notes || null;
          await chemicalItem.save({ transaction: t });
        } else {
          // Create a new ChemicalItem record for this unique barcode
           chemicalItem = await ChemicalItem.create({
            barcode: barcode,
            chemicalTypeId: matchedChemicalType.id,
            status: 'distributed',
            distributionDate: new Date(),
            currentDepartmentId: department.id,
            currentUserId: userId,
            recipientName: recipientName,
            notes: notes || null
          }, { transaction: t });
        }


        // Create history record for Type 2 distribution
        await ChemicalHistory.create({
          action: 'distribute',
          chemicalTypeId: matchedChemicalType.id,
          chemicalItemId: chemicalItem.id,
          departmentId: department.id,
          userId: userId,
          recipientName: recipientName,
          notes: notes || null
        }, { transaction: t });

        await t.commit();
        return res.status(200).json({
          message: `Phân phối chai/lọ ${barcode} (${matchedChemicalType.name}) thành công`,
          chemicalItem: chemicalItem
        });

      } else {
        // Barcode not found in either Type 1 representative codes or Type 2 prefixes
        await t.rollback();
        return res.status(404).json({ message: `Không tìm thấy loại hóa chất phù hợp với mã vạch ${barcode}` });
      }
    }

  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ khi phân phối hóa chất', error: error.message });
  }
};

// @desc    Return chemicals (Type 2 only)
// @route   POST /api/chemicals/return
// @access  Private
exports.returnChemicals = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { barcode, notes } = req.body;
    const userId = req.user.id; // Assuming user is authenticated

    if (!barcode) {
      await t.rollback();
      return res.status(400).json({ message: 'Vui lòng cung cấp mã vạch' });
    }

    // Find the ChemicalItem by barcode and status 'distributed'
    const chemicalItem = await ChemicalItem.findOne({
      where: { barcode: barcode, status: 'distributed' },
      include: [{ model: ChemicalType }], // Include ChemicalType to update stock
      transaction: t
    });

    if (chemicalItem) {
      // Found a distributed ChemicalItem, process return
      chemicalItem.status = 'returned';
      chemicalItem.returnDate = new Date();
      chemicalItem.notes = notes || null;
      // Clear current location/recipient info upon return? Depends on requirement.
      // For now, let's keep it for history context, but set to null if needed.
      // chemicalItem.currentDepartmentId = null;
      // chemicalItem.currentUserId = null;
      // chemicalItem.recipientName = null;

      await chemicalItem.save({ transaction: t });

      // Increase Type 2 stock count
      const chemicalType = chemicalItem.ChemicalType;
      if (chemicalType && chemicalType.barcodeType === 'Type2') {
         chemicalType.stockQuantityType2 += 1;
         await chemicalType.save({ transaction: t });
      } else {
         // This should not happen if associations are correct and item is Type 2
         console.warn(`Returned ChemicalItem ${chemicalItem.id} is not linked to a Type 2 ChemicalType or ChemicalType not found.`);
      }


      // Create history record for Type 2 return
      await ChemicalHistory.create({
        action: 'return',
        chemicalTypeId: chemicalItem.chemicalTypeId,
        chemicalItemId: chemicalItem.id,
        departmentId: chemicalItem.currentDepartmentId, // Record department it was returned from
        userId: userId, // User performing the return
        recipientName: chemicalItem.recipientName, // Record who had it
        notes: notes || null
      }, { transaction: t });

      await t.commit();
      return res.status(200).json({
        message: `Thu hồi chai/lọ ${barcode} (${chemicalType ? chemicalType.name : 'Không rõ loại'}) thành công`,
        chemicalItem: chemicalItem
      });

    } else {
      // ChemicalItem not found with 'distributed' status. Log as unknown barcode.
      await UnknownBarcodeLog.create({
        barcode: barcode,
        scanTime: new Date(),
        userId: userId,
        notes: `Scanned during return process. ${notes || ''}`.trim()
      }, { transaction: t });

      await t.commit(); // Commit the log entry
      return res.status(404).json({ message: `Không tìm thấy chai/lọ với mã vạch ${barcode} đang được phân phối. Mã vạch đã được ghi nhận.` });
    }

  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ khi thu hồi hóa chất', error: error.message });
  }
};
