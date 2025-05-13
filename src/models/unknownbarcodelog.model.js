module.exports = (sequelize, DataTypes) => {
  const UnknownBarcodeLog = sequelize.define('UnknownBarcodeLog', {
    barcode: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Mã vạch không được rỗng' }
      }
    },
    scanTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    // userId will be added by association (nullable)
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: false // No need for createdAt/updatedAt here, scanTime is sufficient
  });

  // Associations will be set up in the model index file

  return UnknownBarcodeLog;
};
