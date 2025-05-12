const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', { // Reverted table name
    name: { // Reverted field name
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, 
      validate: {
        notEmpty: { msg: 'Vui lòng nhập tên đăng nhập' } 
      }
      // field: 'name' // Sequelize uses key as field name by default
    },
    // Email field remains removed
    password: { // Reverted field name
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Vui lòng nhập mật khẩu' },
        len: {
          args: [6, 100],
          msg: 'Mật khẩu phải có ít nhất 6 ký tự'
        }
      }
      // field: 'password'
    },
    isAdmin: { // Reverted field name
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
      // field: 'isAdmin'
    }
    // departmentId will be handled by association if re-added
  }, {
    timestamps: true, // This will create createdAt and updatedAt by default
    // createdAt: 'TaoLuc', // Removed explicit mapping
    // updatedAt: 'CapNhatLuc', // Removed explicit mapping
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) { // Reverted to password
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt); // Reverted to password
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) { // Reverted to password
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt); // Reverted to password
        }
      }
    }
  });

  // Instance method to match password
  User.prototype.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password); // Reverted to password
  };

  return User;
};
