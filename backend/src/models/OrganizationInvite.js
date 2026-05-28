import mongoose from "mongoose";

const organizationInviteSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    roleName: {
      type: String,
      required: true,
      trim: true,
      default: "ORG_ADMIN",
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired", "revoked"],
      default: "pending",
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

organizationInviteSchema.index(
  { organization: 1, department: 1, email: 1, status: 1 },
  { partialFilterExpression: { status: "pending" } }
);

organizationInviteSchema.methods.toPublic = function () {
  return {
    id: this._id,
    organization: this.organization,
    department: this.department,
    email: this.email,
    roleName: this.roleName,
    status: this.status,
    expiresAt: this.expiresAt,
    invitedBy: this.invitedBy,
    acceptedAt: this.acceptedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model("OrganizationInvite", organizationInviteSchema);
