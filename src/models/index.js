const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// Import models
const UserModel = require('./user.model');
const DepartmentModel = require('./department.model');
const BottleModel = require('./bottle.model');
const BatchModel = require('./batch.model');

// Initialize models with sequelize instance
const User = UserModel(sequelize, DataTypes);
const Department = DepartmentModel(sequelize, DataTypes);
const { Bottle, initHistory: initBottleHistory } = BottleModel(sequelize, DataTypes); // Lấy Bottle và hàm initHistory
const Batch = BatchModel(sequelize, DataTypes);

// Create BottleHistory model using the function from bottle.model
const BottleHistory = initBottleHistory(sequelize, DataTypes);

// Define relationships
User.belongsTo(Department, { foreignKey: { name: 'departmentId', allowNull: true } }); // Sửa tên FK cho rõ ràng
Department.hasMany(User, { foreignKey: { name: 'departmentId', allowNull: true } });

Bottle.belongsTo(Department, { as: 'currentDepartment', foreignKey: 'currentDepartmentId' });
// Cho phép currentUserId là null trong Bottle
Bottle.belongsTo(User, { as: 'currentUser', foreignKey: { name: 'currentUserId', allowNull: true } });

// BottleHistory relationships
BottleHistory.belongsTo(Bottle, { foreignKey: 'bottleId' });
Bottle.hasMany(BottleHistory, { foreignKey: 'bottleId' });

BottleHistory.belongsTo(Department, { foreignKey: 'departmentId' });
// Cho phép userId là null trong BottleHistory
BottleHistory.belongsTo(User, { foreignKey: { name: 'userId', allowNull: true } });

// Batch relationships
Batch.belongsTo(Department, { as: 'sourceDepartment', foreignKey: 'sourceDepartmentId' });
Batch.belongsTo(Department, { as: 'targetDepartment', foreignKey: 'targetDepartmentId' });
Batch.belongsTo(User, { as: 'distributedBy', foreignKey: 'distributedById' });
// Cho phép receivedById là null trong Batch
Batch.belongsTo(User, { as: 'receivedBy', foreignKey: { name: 'receivedById', allowNull: true } });
Batch.belongsToMany(Bottle, { through: 'BatchBottles' });
Bottle.belongsToMany(Batch, { through: 'BatchBottles' });

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
  Bottle,
  Batch,
  BottleHistory,
  syncDatabase
};
