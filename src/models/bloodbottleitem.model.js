module.exports = (sequelize, DataTypes) => {
  const BloodBottleItem = sequelize.define('BloodBottleItem', {
    barcode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Vui lòng nhập mã vạch chai máu' }
      }
    },
    // bloodBottleTypeId will be added by association
    lotNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Vui lòng nhập số lô' }
      }
    },
    expiryDate: {
      type: DataTypes.DATEONLY, // Using DATEONLY as time is not relevant for expiry
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('distributed', 'returned', 'used', 'expired', 'lost'),
      allowNull: false,
      defaultValue: 'distributed'
    },
    distributionDate: {
      type: DataTypes.DATE,
      allowNull: true // Null if item is created through other means before distribution
    },
    returnDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    usageDate: { // Date when the bottle was marked as used
      type: DataTypes.DATE,
      allowNull: true
    },
    // currentDepartmentId will be added by association
    // currentUserId will be added by association (user who received/returned/used)
    recipientName: { // Name of the patient or recipient
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: true // createdAt, updatedAt
  });

  return BloodBottleItem;
};
