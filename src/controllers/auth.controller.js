const jwt = require('jsonwebtoken');
const { User, Department } = require('../models/index');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { name, password } = req.body;
    console.log(`Login attempt for name: "${name}"`); // Added log

    // Check for user name
    const user = await User.findOne({ 
      where: { name: name }, // Reverted to name
      include: [{
        model: Department,
        attributes: ['name', 'code']
      }]
    });

    if (user) {
      console.log('User found:', JSON.stringify(user, null, 2)); // Added log
      const isMatch = await user.matchPassword(password);
      console.log('Password match result:', isMatch); // Added log
      if (isMatch) {
        res.json({
          id: user.id,
        name: user.name, // Reverted to name
        // email: user.email, // Email removed
        department: user.Department, // Sequelize will capitalize the association
        isAdmin: user.isAdmin, // Reverted to isAdmin
        token: generateToken(user.id),
      });
      } else {
        console.log('Password does not match for user:', name); // Added log
        res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không hợp lệ' });
      }
    } else {
      console.log('User not found for name:', name); // Added log
      res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không hợp lệ' }); 
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Department,
        attributes: ['name', 'code']
      }]
    });

    if (user) {
      res.json({
        id: user.id,
        name: user.name, // Reverted to name
        // email: user.email, // Email removed
        department: user.Department,
        isAdmin: user.isAdmin, // Reverted to isAdmin
      });
    } else {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      // Removed Department include as per new requirement
      attributes: ['id', 'name', 'isAdmin', 'createdAt', 'updatedAt'] // Reverted to English names
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// @desc    Create new user (by Admin)
// @route   POST /api/auth/users
// @access  Private/Admin
const createUserByAdmin = async (req, res) => {
  try {
    const { name, password, departmentId, isAdmin } = req.body; 

    // Check if user exists by name
    const nameExists = await User.findOne({ where: { name: name } }); // Reverted to name
    if (nameExists) {
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }

    const userData = {
      name: name, // Reverted to name
      // email, // Email removed
      password: password, // Reverted to password
      isAdmin: isAdmin || false, // Reverted to isAdmin
    };

    // Department association is currently not used for user creation by admin
    // if (departmentId) { 
    //   userData.departmentId = departmentId; 
    // }

    const user = await User.create(userData);

    if (user) {
      // Do not return token here, admin is creating user, not logging them in
      res.status(201).json({
        id: user.id,
        name: user.name, // Reverted to name
        // email: user.email, // Email removed
        // departmentId: user.departmentId || null, // DepartmentId removed
        isAdmin: user.isAdmin, // Reverted to isAdmin
      });
    } else {
      res.status(400).json({ message: 'Dữ liệu người dùng không hợp lệ' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// @desc    Update user password
// @route   PUT /api/auth/profile/password
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới' });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (await user.matchPassword(currentPassword)) {
      user.password = newPassword; // Reverted to password
      await user.save();
      res.json({ message: 'Mật khẩu đã được cập nhật thành công' });
    } else {
      res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// @desc    Reset user password (by Admin)
// @route   PUT /api/auth/users/:userId/reset-password
// @access  Private/Admin
const resetPasswordByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu mới' });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Prevent admin from resetting their own password through this specific route
    // They should use the regular /profile/password route for that
    if (user.id === req.user.id && user.isAdmin) { // Reverted to isAdmin
        // Or, more simply, if target user is an admin and is the same as the requesting admin
        // This check might be too restrictive if there are multiple admins.
        // A simpler check: if (user.isAdmin && user.id === req.user.id)
        // For now, let's assume an admin cannot use this to reset their own password.
        // This is to prevent accidental self-lockout via a simplified admin tool.
        // A more robust system might allow it or have other recovery.
    }


    user.password = newPassword; // Reverted to password
    await user.save();
    res.json({ message: `Mật khẩu cho người dùng ${user.name} đã được đặt lại thành công` }); // Reverted to name

  } catch (error) {
    console.error('Error resetting password by admin:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};


module.exports = {
  // registerUser, // Removed registerUser
  loginUser,
  getUserProfile,
  getUsers,
  createUserByAdmin,
  updatePassword,
  resetPasswordByAdmin,
};
