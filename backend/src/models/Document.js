import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
      maxlength: 255,
    },
    extension: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 12,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: 1,
    },
    bucket: {
      type: String,
      required: true,
      trim: true,
    },
    s3Key: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'DELETED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    processingStatus: {
      type: String,
      enum: ['NOT_PROCESSED', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'NOT_PROCESSED',
      index: true,
    },
    processingError: {
      type: String,
      default: null,
      trim: true,
      maxlength: 1000,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    checksum: {
      type: String,
      default: null,
      trim: true,
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
    uploadedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

documentSchema.index({ organization: 1, status: 1, createdAt: -1 });
documentSchema.index({ organization: 1, department: 1, status: 1, createdAt: -1 });
documentSchema.index({ organization: 1, processingStatus: 1, createdAt: -1 });

documentSchema.methods.toPublic = function () {
  return {
    id: this._id,
    organization: this.organization,
    department: this.department,
    uploadedBy: this.uploadedBy,
    originalName: this.originalName,
    extension: this.extension,
    mimeType: this.mimeType,
    sizeBytes: this.sizeBytes,
    status: this.status,
    processingStatus: this.processingStatus,
    processingError: this.processingError,
    version: this.version,
    checksum: this.checksum,
    metadata: this.metadata ? Object.fromEntries(this.metadata) : {},
    uploadedAt: this.uploadedAt,
    deletedAt: this.deletedAt,
    deletedBy: this.deletedBy,
    failureReason: this.failureReason,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model('Document', documentSchema);
