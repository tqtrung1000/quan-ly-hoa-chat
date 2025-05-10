module.exports = (sequelize, DataTypes) => {
  const Batch = sequelize.define('Batch', {
    batchId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    bottleCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    returnedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('active', 'completed'),
      defaultValue: 'active'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
    // Foreign keys will be added by associations:
    // sourceDepartmentId, targetDepartmentId, distributedById, receivedById
  }, {
    timestamps: true
  });

  // Virtual getter for unreturned count
  Batch.prototype.getUnreturnedCount = function() {
    return this.bottleCount - this.returnedCount;
  };

  return Batch;
};
