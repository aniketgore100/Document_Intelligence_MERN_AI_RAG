import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { DepartmentRepository } from "../repositories/departmentRepository.js";
import { OrganizationMembershipRepository } from "../repositories/organizationMembershipRepository.js";
import { AuthRepository } from "../repositories/authRepository.js";
import { OrganizationInviteService } from "../services/organizationInviteService.js";
import { ROLES } from "../constants/roles.js";

dotenv.config();

const DEFAULT_DEPARTMENT_ID = "6a2535063e9269159a9dba47";
const DEFAULT_COUNT = 10;
const DEFAULT_PASSWORD = process.env.SEED_USER_PASSWORD || "ChangeMe123!";
const DEFAULT_NAME_PREFIX = "Department User";
const DEFAULT_EMAIL_DOMAIN = process.env.SEED_EMAIL_DOMAIN || "example.com";

const departmentRepository = new DepartmentRepository();
const organizationMembershipRepository = new OrganizationMembershipRepository();
const authRepository = new AuthRepository();
const inviteService = new OrganizationInviteService();

const parseArgs = (argv) => {
  const parsed = {};

  for (let index = 2; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith("--")) continue;

    const [keyPart, inlineValue] = current.slice(2).split("=");
    const nextValue = argv[index + 1];
    const value = inlineValue ?? (nextValue && !nextValue.startsWith("--") ? nextValue : "true");

    parsed[keyPart] = value;

    if (inlineValue === undefined && nextValue && !nextValue.startsWith("--")) {
      index += 1;
    }
  }

  return parsed;
};

const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeName = (value) => value.trim().replace(/\s+/g, " ");

const buildEmail = (index, departmentId, domain) => {
  const shortDepartmentId = departmentId.slice(-6);
  const sequence = String(index + 1).padStart(2, "0");
  return `dept-user-${shortDepartmentId}-${sequence}@${domain}`.toLowerCase();
};

const createOneUser = async ({
  department,
  departmentId,
  inviterId,
  inviterRoleName,
  index,
  password,
  namePrefix,
  emailDomain,
}) => {
  const email = buildEmail(index, departmentId, emailDomain);
  const displayName = normalizeName(`${namePrefix} ${String(index + 1).padStart(2, "0")}`);

  const existingUser = await authRepository.findByEmail(email);
  if (existingUser) {
    const existingMembership = await organizationMembershipRepository.findByUserOrgRole({
      userId: existingUser._id,
      organizationId: department.organization,
      roleName: ROLES.USER,
      department: departmentId,
    });

    if (existingMembership) {
      console.log(`- Skipped ${email} (already completed)`);
      return { email, skipped: true };
    }

    throw new Error(
      `Email already exists without the expected department membership: ${email}`
    );
  }

  const invite = await inviteService.createInvite({
    organizationId: department.organization,
    departmentId,
    email,
    roleName: ROLES.USER,
    invitedBy: inviterId,
    inviterRoleName,
  });

  const accepted = await inviteService.acceptInvite({
    token: invite.rawToken,
    name: displayName,
    password,
  });

  const createdUser = await authRepository.findByEmail(email);
  const createdMembership = await organizationMembershipRepository.findByUserOrgRole({
    userId: createdUser?._id,
    organizationId: department.organization,
    roleName: ROLES.USER,
    department: departmentId,
  });

  if (!createdUser || !createdMembership) {
    throw new Error(`Flow verification failed for ${email}`);
  }

  console.log(`- Created ${email}`);
  console.log(`  invite: ${accepted.invite?.status}`);
  console.log(`  membership: ${createdMembership.status}`);

  return {
    email,
    inviteId: accepted.invite?.id || accepted.invite?._id,
    userId: createdUser._id,
    membershipId: createdMembership._id,
    skipped: false,
  };
};

const main = async () => {
  const args = parseArgs(process.argv);
  const departmentId = args.departmentId || args.department || DEFAULT_DEPARTMENT_ID;
  const count = toNumber(args.count, DEFAULT_COUNT);
  const password = args.password || DEFAULT_PASSWORD;
  const namePrefix = args.namePrefix || DEFAULT_NAME_PREFIX;
  const emailDomain = args.emailDomain || DEFAULT_EMAIL_DOMAIN;

  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    throw new Error(`Invalid department id: ${departmentId}`);
  }

  if (!password || password.length < 6) {
    throw new Error("A password of at least 6 characters is required");
  }

  await connectDB();

  const department = await departmentRepository.findByIdPlain(departmentId);
  if (!department) {
    throw new Error(`Department not found: ${departmentId}`);
  }

  const inviterMembership =
    (await organizationMembershipRepository.findActiveDepartmentMembershipByRole({
      userId: department.Owner,
      roleName: ROLES.DEPT_ADMIN,
      departmentId,
    })) ||
    (await organizationMembershipRepository.findActiveDepartmentMembershipByRole({
      roleName: ROLES.DEPT_ADMIN,
      departmentId,
    }));

  if (!inviterMembership) {
    throw new Error(
      `No active department admin found for department ${departmentId}. The script needs a dept admin inviter.`
    );
  }

  const inviterId = inviterMembership.user?._id || inviterMembership.user;
  if (!inviterId) {
    throw new Error("Unable to resolve inviter user id");
  }

  const inviterRoleName = ROLES.DEPT_ADMIN;

  console.log(`Department: ${department.name} (${departmentId})`);
  console.log(`Inviter: ${inviterMembership.user?.email || inviterId}`);
  console.log(`Creating ${count} department users with shared password...`);

  const results = [];
  for (let index = 0; index < count; index += 1) {
    const result = await createOneUser({
      department,
      departmentId,
      inviterId,
      inviterRoleName,
      index,
      password,
      namePrefix,
      emailDomain,
    });
    results.push(result);
  }

  const createdCount = results.filter((item) => !item.skipped).length;
  const skippedCount = results.filter((item) => item.skipped).length;

  console.log("");
  console.log(`Done. Created ${createdCount} users, skipped ${skippedCount}.`);
};

main()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    process.exit(process.exitCode || 0);
  });
