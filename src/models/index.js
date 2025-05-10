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
const Bottle = BottleModel(sequelize, DataTypes);
const Batch = BatchModel(sequelize, DataTypes);

// Create BottleHistory model
const BottleHistory = sequelize.define('BottleHistory', {
  action: {
    type: DataTypes.ENUM('distributed', 'returned'),
    allowNull: false
  },
  batchId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  updatedAt: false
});

// Define relationships
User.belongsTo(Department, { foreignKey: { allowNull: true } });
Department.hasMany(User);

Bottle.belongsTo(Department, { as: 'currentDepartment', foreignKey: 'currentDepartmentId' });
Bottle.belongsTo(User, { as: 'currentUser', foreignKey: 'currentUserId' });

// BottleHistory relationships
BottleHistory.belongsTo(Bottle, { foreignKey: 'bottleId' });
Bottle.hasMany(BottleHistory, { foreignKey: 'bottleId' });

BottleHistory.belongsTo(Department, { foreignKey: 'departmentId' });
BottleHistory.belongsTo(User, { foreignKey: 'userId' });

// Batch relationships
Batch.belongsTo(Department, { as: 'sourceDepartment', foreignKey: 'sourceDepartmentId' });
Batch.belongsTo(Department, { as: 'targetDepartment', foreignKey: 'targetDepartmentId' });
Batch.belongsTo(User, { as: 'distributedBy', foreignKey: 'distributedById' });
Batch.belongsTo(User, { as: 'receivedBy', foreignKey: 'receivedById' });
Batch.belongsToMany(Bottle, { through: 'BatchBottles' });
Bottle.belongsToMany(Batch, { through: 'BatchBottles' });

// Sync all models with the database
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true }); // Use { force: true } to drop tables and recreate
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
