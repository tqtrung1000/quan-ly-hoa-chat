module.exports = (sequelize, DataTypes) => {
  const BloodBottleType = sequelize.define('BloodBottleType', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Vui lòng nhập tên loại chai máu' }
      }
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'chai',
      validate: {
        notEmpty: { msg: 'Vui lòng nhập đơn vị tính' }
      }
    },
    prefixCode: { // Optional prefix for barcode identification
      type: DataTypes.STRING,
      allowNull: true,
      unique: true // Prefix should be unique if provided
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  return BloodBottleType;
};
