module.exports = (sequelize, DataTypes) => {
  const ChemicalType = sequelize.define('ChemicalType', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Vui lòng nhập tên hóa chất' }
      }
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Vui lòng nhập đơn vị' }
      }
    },
    barcodeType: {
      type: DataTypes.ENUM('Type1', 'Type2'),
      allowNull: false
    },
    representativeCode: {
      type: DataTypes.STRING,
      allowNull: true // Can be null if not applicable (though plan implies it's needed for both types)
    },
    stockQuantity: { // For Type 1 chemicals (managed by quantity)
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    stockQuantityType2: { // For Type 2 chemicals (managed by item count in stock)
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    }
  }, {
    timestamps: true
  });

  return ChemicalType;
};
