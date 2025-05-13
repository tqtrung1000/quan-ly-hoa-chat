module.exports = (sequelize, DataTypes) => {
  const ChemicalStockEntry = sequelize.define('ChemicalStockEntry', {
    // chemicalTypeId will be added by association
    lotNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Vui lòng nhập số lô' }
      }
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    quantityImported: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [1], msg: 'Số lượng nhập kho phải lớn hơn 0' }
      }
    },
    quantityRemaining: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'Số lượng còn lại không thể âm' }
      }
    },
    importDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  return ChemicalStockEntry;
};
