const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// Import models
const UserModel = require('./user.model');
const DepartmentModel = require('./department.model');
const BatchModel = require('./batch.model');
const ChemicalTypeModel = require('./chemicaltype.model');
const ChemicalItemModel = require('./chemicalitem.model');
const ChemicalHistoryModel = require('./chemicalhistory.model');
const UnknownBarcodeLogModel = require('./unknownbarcodelog.model');
const BloodBottleTypeModel = require('./bloodbottletype.model');
const BloodBottleItemModel = require('./bloodbottleitem.model');
const BloodBottleHistoryModel = require('./bloodbottlehistory.model');
const ChemicalStockEntryModel = require('./chemicalstockentry.model');

// Initialize models with sequelize instance
const User = UserModel(sequelize, DataTypes);
const Department = DepartmentModel(sequelize, DataTypes);
const Batch = BatchModel(sequelize, DataTypes);
const ChemicalType = ChemicalTypeModel(sequelize, DataTypes);
const ChemicalItem = ChemicalItemModel(sequelize, DataTypes);
const ChemicalHistory = ChemicalHistoryModel(sequelize, DataTypes);
const UnknownBarcodeLog = UnknownBarcodeLogModel(sequelize, DataTypes);
const BloodBottleType = BloodBottleTypeModel(sequelize, DataTypes);
const BloodBottleItem = BloodBottleItemModel(sequelize, DataTypes);
const BloodBottleHistory = BloodBottleHistoryModel(sequelize, DataTypes);
const ChemicalStockEntry = ChemicalStockEntryModel(sequelize, DataTypes);

// Define relationships
User.belongsTo(Department, { foreignKey: { name: 'departmentId', allowNull: true } });
Department.hasMany(User, { foreignKey: { name: 'departmentId', allowNull: true } });

// UnknownBarcodeLog relationships
UnknownBarcodeLog.belongsTo(User, { foreignKey: { name: 'userId', allowNull: true } });
User.hasMany(UnknownBarcodeLog, { foreignKey: { name: 'userId', allowNull: true } });

// ChemicalType relationships
ChemicalType.hasMany(ChemicalItem, { foreignKey: 'chemicalTypeId' });
ChemicalType.hasMany(ChemicalHistory, { foreignKey: 'chemicalTypeId' });
ChemicalType.hasMany(ChemicalStockEntry, { foreignKey: 'chemicalTypeId' });

// ChemicalStockEntry relationships
ChemicalStockEntry.belongsTo(ChemicalType, { foreignKey: 'chemicalTypeId' });

// ChemicalItem relationships
ChemicalItem.belongsTo(ChemicalType, { foreignKey: 'chemicalTypeId' });
ChemicalItem.belongsTo(Department, { as: 'currentDepartment', foreignKey: 'currentDepartmentId' });
ChemicalItem.belongsTo(User, { as: 'currentUser', foreignKey: { name: 'currentUserId', allowNull: true } });
ChemicalItem.hasMany(ChemicalHistory, { foreignKey: 'chemicalItemId' });

// ChemicalHistory relationships
ChemicalHistory.belongsTo(ChemicalType, { foreignKey: 'chemicalTypeId' });
ChemicalHistory.belongsTo(ChemicalItem, { foreignKey: { name: 'chemicalItemId', allowNull: true } }); // Nullable for Type 1 history
ChemicalHistory.belongsTo(Department, { foreignKey: { name: 'departmentId', allowNull: true } }); // Nullable for import action
ChemicalHistory.belongsTo(User, { foreignKey: { name: 'userId', allowNull: true } }); // Nullable for import action
ChemicalHistory.belongsTo(Batch, { foreignKey: { name: 'batchId', allowNull: true } }); // Link history to batch
ChemicalHistory.belongsTo(ChemicalStockEntry, { foreignKey: { name: 'chemicalStockEntryId', allowNull: true } }); // Link history to stock entry when appropriate

// BloodBottleType relationships
BloodBottleType.hasMany(BloodBottleItem, { foreignKey: 'bloodBottleTypeId' });
BloodBottleType.hasMany(BloodBottleHistory, { foreignKey: 'bloodBottleTypeId' });

// BloodBottleItem relationships
BloodBottleItem.belongsTo(BloodBottleType, { foreignKey: 'bloodBottleTypeId' });
BloodBottleItem.belongsTo(Department, { as: 'currentDepartment', foreignKey: 'currentDepartmentId' });
BloodBottleItem.belongsTo(User, { as: 'currentUser', foreignKey: { name: 'currentUserId', allowNull: true } });
BloodBottleItem.hasMany(BloodBottleHistory, { foreignKey: 'bloodBottleItemId' });

// BloodBottleHistory relationships
BloodBottleHistory.belongsTo(BloodBottleType, { foreignKey: 'bloodBottleTypeId' });
BloodBottleHistory.belongsTo(BloodBottleItem, { foreignKey: { name: 'bloodBottleItemId', allowNull: true } }); // Nullable for 'import' action
BloodBottleHistory.belongsTo(Department, { foreignKey: { name: 'departmentId', allowNull: true } }); // Nullable for import action
BloodBottleHistory.belongsTo(User, { foreignKey: { name: 'userId', allowNull: true } }); // User who performed the action

// Batch relationships
Batch.belongsTo(Department, { as: 'sourceDepartment', foreignKey: 'sourceDepartmentId' });
Batch.belongsTo(Department, { as: 'targetDepartment', foreignKey: 'targetDepartmentId' });
Batch.belongsTo(User, { as: 'distributedBy', foreignKey: 'distributedById' });
Batch.belongsTo(User, { as: 'receivedBy', foreignKey: { name: 'receivedById', allowNull: true } });
// Remove BatchBottles relationship as Bottle is replaced by ChemicalItem
// Batch.belongsToMany(Bottle, { through: 'BatchBottles' });
// Bottle.belongsToMany(Batch, { through: 'BatchBottles' });
Batch.hasMany(ChemicalHistory, { foreignKey: 'batchId' }); // Link batch to history

// Sync all models with the database
const syncDatabase = async () => {
  try {
    // Removed { alter: true } to avoid potential SQLite sync issues.
    // Consider using migrations for schema changes.
    await sequelize.sync();
    console.log('Database synchronized successfully');
    return true;
  } catch (error) {
    console.error('Error syncing database:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  User,
  Department,
  Batch,
  ChemicalType,
  ChemicalItem,
  ChemicalHistory,
  ChemicalStockEntry,
  UnknownBarcodeLog,
  BloodBottleType,
  BloodBottleItem,
  BloodBottleHistory,
  syncDatabase
};
