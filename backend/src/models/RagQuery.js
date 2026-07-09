import mongoose from 'mongoose';

const ragQuerySchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    answer: {
      type: String,
      default: null,
    },
    chunks: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true,
    },
    errorMessage: {
      type: String,
      default: null,
      maxlength: 1000,
    },
    responseTimeMs: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

ragQuerySchema.index({ document: 1, createdAt: -1 });
ragQuerySchema.index({ organization: 1, createdAt: -1 });
ragQuerySchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('RagQuery', ragQuerySchema);
