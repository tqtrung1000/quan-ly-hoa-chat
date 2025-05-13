module.exports = (sequelize, DataTypes) => {
  const ChemicalItem = sequelize.define('ChemicalItem', {
    barcode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Vui lòng nhập mã vạch' }
      }
    },
    status: {
      type: DataTypes.ENUM('distributed', 'returned', 'lost'), // Added 'lost' as per plan
      allowNull: false,
      defaultValue: 'distributed' // Default status when an item is first recorded (upon distribution)
    },
    distributionDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    returnDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    currentRecipientName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // chemicalTypeId, currentDepartmentId, currentUserId will be added by associations
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: true // createdAt will be the record creation date (likely distribution date), updatedAt for status changes
  });

  // Associations will be set up in the model index file

  return ChemicalItem;
};
