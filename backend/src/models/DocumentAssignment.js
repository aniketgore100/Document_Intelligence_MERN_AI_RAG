import mongoose from 'mongoose';

const documentAssignmentSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['DEPARTMENT', 'USER'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

documentAssignmentSchema.index({ document: 1, targetType: 1, status: 1 });
documentAssignmentSchema.index({ organization: 1, department: 1, targetType: 1, status: 1 });
documentAssignmentSchema.index({ organization: 1, user: 1, targetType: 1, status: 1 });
documentAssignmentSchema.index(
  { document: 1, department: 1, targetType: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { targetType: 'DEPARTMENT', status: 'active' },
  },
);
documentAssignmentSchema.index(
  { document: 1, user: 1, targetType: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { targetType: 'USER', status: 'active' },
  },
);

documentAssignmentSchema.methods.toPublic = function () {
  return {
    id: this._id,
    document: this.document,
    organization: this.organization,
    department: this.department,
    user: this.user,
    targetType: this.targetType,
    status: this.status,
    assignedBy: this.assignedBy,
    revokedBy: this.revokedBy,
    assignedAt: this.assignedAt,
    revokedAt: this.revokedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model('DocumentAssignment', documentAssignmentSchema);
