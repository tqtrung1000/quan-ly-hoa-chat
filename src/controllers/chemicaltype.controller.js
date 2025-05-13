const { ChemicalType } = require('../models'); // Import ChemicalType model

// Get all chemical types
exports.getAllChemicalTypes = async (req, res) => {
  try {
    const chemicalTypes = await ChemicalType.findAll();
    res.status(200).json(chemicalTypes);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách loại hóa chất', error: error.message });
  }
};

// Get a single chemical type by ID
exports.getChemicalTypeById = async (req, res) => {
  try {
    const chemicalType = await ChemicalType.findByPk(req.params.id);
    if (chemicalType) {
      res.status(200).json(chemicalType);
    } else {
      res.status(404).json({ message: 'Không tìm thấy loại hóa chất' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy thông tin loại hóa chất', error: error.message });
  }
};

// Create a new chemical type
exports.createChemicalType = async (req, res) => {
  try {
    const newChemicalType = await ChemicalType.create(req.body);
    res.status(201).json(newChemicalType);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi khi tạo loại hóa chất mới', error: error.message });
  }
};

// Update a chemical type by ID
exports.updateChemicalType = async (req, res) => {
  try {
    const chemicalType = await ChemicalType.findByPk(req.params.id);
    if (chemicalType) {
      await chemicalType.update(req.body);
      res.status(200).json({ message: 'Cập nhật loại hóa chất thành công', chemicalType });
    } else {
      res.status(404).json({ message: 'Không tìm thấy loại hóa chất để cập nhật' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Lỗi khi cập nhật loại hóa chất', error: error.message });
  }
};

// Delete a chemical type by ID
exports.deleteChemicalType = async (req, res) => {
  try {
    const chemicalType = await ChemicalType.findByPk(req.params.id);
    if (chemicalType) {
      await chemicalType.destroy();
      res.status(200).json({ message: 'Xóa loại hóa chất thành công' });
    } else {
      res.status(404).json({ message: 'Không tìm thấy loại hóa chất để xóa' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa loại hóa chất', error: error.message });
  }
};
