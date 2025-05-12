module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define('Department', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Vui lòng nhập tên khoa' }
      }
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Vui lòng nhập mã khoa' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    bottlesOut: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    timestamps: true
  });

  // Virtual getter for unreturned bottle count
  Department.prototype.getUnreturnedBottleCount = function() {
    return this.bottlesOut;
  };

  // Method to update bottlesOut count
  Department.prototype.updateBottleCount = async function(count, options = {}) { // Thêm options
    this.bottlesOut += count;
    return await this.save(options); // Truyền options (chứa transaction) vào save
  };

  return Department;
};
