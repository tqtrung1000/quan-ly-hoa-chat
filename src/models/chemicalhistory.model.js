module.exports = (sequelize, DataTypes) => {
  const ChemicalHistory = sequelize.define('ChemicalHistory', {
    action: {
      type: DataTypes.ENUM('import', 'distribute', 'return'),
      allowNull: false
    },
    // chemicalTypeId will be added by association
    // chemicalItemId will be added by association (nullable)
    quantity: { // For Type 1 import/distribute and Type 2 import
      type: DataTypes.INTEGER,
      allowNull: true, // Nullable because Type 2 distribute/return is item-based
      validate: {
        min: 1 // Quantity must be at least 1 when provided
      }
    },
    recipientName: { // For distribute/return actions
      type: DataTypes.STRING,
      allowNull: true
    },
    // departmentId will be added by association (nullable)
    // userId will be added by association (nullable)
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: true, // createdAt serves as timestamp
    updatedAt: false // No need for updatedAt
  });

  // Associations will be set up in the model index file

  return ChemicalHistory;
};
