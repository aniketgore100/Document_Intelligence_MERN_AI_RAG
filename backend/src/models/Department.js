import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
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
    Owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

departmentSchema.index({ organization: 1, slug: 1 }, { unique: true });

departmentSchema.pre("validate", function () {
  if (this.name) this.name = this.name.trim();
  if (this.slug) this.slug = this.slug.trim().toLowerCase();
});

departmentSchema.methods.toPublic = function () {
  return {
    id: this._id,
    organization: this.organization,
    name: this.name,
    slug: this.slug,
    status: this.status,
    createdBy: this.createdBy,
    Owner: this.Owner,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model("Department", departmentSchema);
