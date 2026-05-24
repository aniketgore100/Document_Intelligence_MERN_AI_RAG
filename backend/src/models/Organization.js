import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: [true, "Organization slug is required"],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"],
      minlength: 2,
      maxlength: 80,
    },
    status: {
      type: String,
      enum: ["active", "suspended", "archived"],
      default: "active",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
    Owner : {
       type : mongoose.Schema.Types.ObjectId,
       ref : 'User',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Optional safety: normalize before validation/save
organizationSchema.pre("validate", function (next) {
  if (this.name) this.name = this.name.trim();
  if (this.slug) this.slug = this.slug.trim().toLowerCase();
  next();
});

organizationSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    slug: this.slug,
    status: this.status,
    createdBy: this.createdBy,
    Owner: this.Owner,
    metadata: this.metadata ? Object.fromEntries(this.metadata) : {},
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model("Organization", organizationSchema);
