import mongoose from 'mongoose';

const { Schema } = mongoose;

const workspaceSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      default: 'Untitled Workspace',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    content: {
      type: Schema.Types.Mixed,
      default: () => ({ type: 'doc', content: [] }),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

workspaceSchema.index({ owner: 1, updatedAt: -1 });

export default mongoose.model('Workspace', workspaceSchema);
