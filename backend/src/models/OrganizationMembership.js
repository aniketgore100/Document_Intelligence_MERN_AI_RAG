import mongoose from "mongoose";

const organizationMembershipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    roleName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "invited", "disabled"],
      default: "active",
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

organizationMembershipSchema.index(
  { user: 1, organization: 1, roleName: 1, department: 1 },
  { unique: true }
);

organizationMembershipSchema.methods.toPublic = function () {
  return {
    id: this._id,
    user: this.user,
    organization: this.organization,
    roleName: this.roleName,
    department: this.department,
    status: this.status,
    invitedBy: this.invitedBy,
    joinedAt: this.joinedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model("OrganizationMembership", organizationMembershipSchema);
