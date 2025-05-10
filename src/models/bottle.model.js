const mongoose = require('mongoose');

const bottleSchema = mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Vui lòng nhập mã chai'],
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['available', 'distributed', 'returned'],
      default: 'available',
    },
    currentDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    currentUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    batchId: {
      type: String,
      trim: true,
    },
    history: [
      {
        action: {
          type: String,
          enum: ['distributed', 'returned'],
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        department: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Department',
          required: true,
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        batchId: {
          type: String,
          trim: true,
        },
        notes: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Methods

// Mark bottle as distributed
bottleSchema.methods.distribute = function (departmentId, userId, batchId, notes = '') {
  this.status = 'distributed';
  this.currentDepartment = departmentId;
  this.currentUser = userId;
  this.batchId = batchId;
  
  this.history.push({
    action: 'distributed',
    department: departmentId,
    user: userId,
    batchId,
    notes,
  });
  
  return this.save();
};

// Mark bottle as returned
bottleSchema.methods.returnBottle = function (userId, notes = '') {
  const previousDepartment = this.currentDepartment;
  const previousBatchId = this.batchId;
  
  this.status = 'available';
  this.currentDepartment = null;
  this.currentUser = null;
  this.batchId = null;
  
  this.history.push({
    action: 'returned',
    department: previousDepartment,
    user: userId,
    batchId: previousBatchId,
    notes,
  });
  
  return this.save();
};

// Get last distribution data
bottleSchema.virtual('lastDistribution').get(function () {
  const distributions = this.history.filter(record => record.action === 'distributed');
  return distributions.length ? distributions[distributions.length - 1] : null;
});

// Set to ensure virtuals are included when converting to JSON
bottleSchema.set('toJSON', { virtuals: true });
bottleSchema.set('toObject', { virtuals: true });

const Bottle = mongoose.model('Bottle', bottleSchema);

module.exports = Bottle;
