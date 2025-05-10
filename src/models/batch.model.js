const mongoose = require('mongoose');

const batchSchema = mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
    },
    sourceDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    targetDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    distributedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bottles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bottle',
      },
    ],
    bottleCount: {
      type: Number,
      required: true,
      min: 1,
    },
    returnedCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for calculating unreturned bottles
batchSchema.virtual('unreturnedCount').get(function () {
  return this.bottleCount - this.returnedCount;
});

// Set to ensure virtuals are included when converting to JSON
batchSchema.set('toJSON', { virtuals: true });
batchSchema.set('toObject', { virtuals: true });

const Batch = mongoose.model('Batch', batchSchema);

module.exports = Batch;
