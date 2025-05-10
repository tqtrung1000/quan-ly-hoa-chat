const mongoose = require('mongoose');

const departmentSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên khoa'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Vui lòng nhập mã khoa'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    bottlesOut: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for calculating unreturned bottles
departmentSchema.virtual('unreturnedBottleCount').get(function () {
  return this.bottlesOut;
});

// Method to update bottlesOut count
departmentSchema.methods.updateBottleCount = function (count) {
  this.bottlesOut += count;
  return this.save();
};

// Set to ensure virtuals are included when converting to JSON
departmentSchema.set('toJSON', { virtuals: true });
departmentSchema.set('toObject', { virtuals: true });

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;
