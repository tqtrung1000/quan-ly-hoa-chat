module.exports = (sequelize, DataTypes) => {
  const BloodBottleHistory = sequelize.define('BloodBottleHistory', {
    action: {
      type: DataTypes.ENUM('import', 'distribute', 'return', 'mark_used', 'mark_expired'),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Vui lòng chọn hành động' }
      }
    },
    // bloodBottleTypeId will be added by association
    // bloodBottleItemId will be added by association (nullable for import actions)
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true, // Required only for 'import' action
      validate: {
        min: { args: [1], msg: 'Số lượng phải lớn hơn 0' }
      }
    },
    lotNumber: {
      type: DataTypes.STRING,
      allowNull: true, // Required only for 'import' action
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true, // Required only for 'import' action
    },
    // departmentId will be added by association
    // userId will be added by association (user who performed the action)
    recipientName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: true // We want createdAt to track when the action happened
  });

  return BloodBottleHistory;
};
