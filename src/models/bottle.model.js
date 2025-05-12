module.exports = (sequelize, DataTypes) => {
  const Bottle = sequelize.define('Bottle', {
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Vui lòng nhập mã chai' }
      }
    },
    status: {
      type: DataTypes.ENUM('available', 'distributed', 'returned'),
      allowNull: false,
      defaultValue: 'available'
    },
    batchId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    currentRecipientName: { // Thêm trường tên người nhận hiện tại
      type: DataTypes.STRING,
      allowNull: true
    }
    // currentDepartmentId and currentUserId will be added by associations
  }, {
    timestamps: true
  });

  // Setup additional models needed for the history
  const initHistory = (sequelize, DataTypes) => {
    const BottleHistory = sequelize.define('BottleHistory', {
      action: {
        type: DataTypes.ENUM('distributed', 'returned'),
        allowNull: false
      },
      recipientName: { // Thêm trường tên người nhận vào lịch sử
        type: DataTypes.STRING,
        allowNull: true
      },
      batchId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    }, {
      timestamps: true, // This will give us createdAt which serves as timestamp
      updatedAt: false  // We don't need updatedAt for history entries
    });

    // Associations for history will be set up in the model index file
    return BottleHistory;
  };

  // Methods
  
  // Mark bottle as distributed
  Bottle.prototype.distribute = async function(departmentId, userId, recipientName, batchId, notes = '', transaction) { // Thêm transaction làm tham số
    const BottleHistory = sequelize.models.BottleHistory;
    
    this.status = 'distributed';
    this.currentDepartmentId = departmentId;
    this.currentUserId = userId; // userId có thể là null nếu chỉ có recipientName
    this.currentRecipientName = recipientName;
    this.batchId = batchId;
    
    await this.save({ transaction }); // Sử dụng transaction
    
    // Create history record
    await BottleHistory.create({
      action: 'distributed',
      bottleId: this.id,
      departmentId: departmentId,
      userId: userId, // userId có thể là null
      recipientName: recipientName, // Lưu tên người nhận
      batchId: batchId,
      notes: notes
    }, { transaction }); // Sử dụng transaction
    
    return this;
  };
  
  // Mark bottle as returned
  Bottle.prototype.returnBottle = async function(userId, notes = '') {
    const BottleHistory = sequelize.models.BottleHistory;
    
    const previousDepartmentId = this.currentDepartmentId;
    const previousBatchId = this.batchId;
    
    this.status = 'available';
    this.currentDepartmentId = null;
    this.currentUserId = null;
    this.currentRecipientName = null; // Xóa tên người nhận khi trả lại
    this.batchId = null;
    
    await this.save();
    
    // Create history record
    await BottleHistory.create({
      action: 'returned',
      bottleId: this.id,
      departmentId: previousDepartmentId,
      userId: userId, // Người dùng thực hiện hành động trả lại
      // recipientName không cần thiết ở đây vì đây là hành động trả lại
      batchId: previousBatchId,
      notes: notes
    });
    
    return this;
  };
  
  // Method to get last distribution
  Bottle.prototype.getLastDistribution = async function() {
    const BottleHistory = sequelize.models.BottleHistory;
    
    const distributions = await BottleHistory.findAll({
      where: {
        bottleId: this.id,
        action: 'distributed'
      },
      order: [['createdAt', 'DESC']],
      limit: 1,
      include: [
        { model: sequelize.models.Department },
        { model: sequelize.models.User }
      ]
    });
    
    return distributions.length ? distributions[0] : null;
  };

  // Return both Bottle and the initHistory function
  return { Bottle, initHistory };
};
