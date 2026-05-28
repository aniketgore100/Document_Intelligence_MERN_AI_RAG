import { Router } from "express";
import { body, param, query } from "express-validator";
import { validate } from "../middleware/validate.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { ACTIONS } from "../constants/actions.js";
import {
  acceptOrganizationInvite,
  createDepartmentAdminInvite,
  createDepartmentUserInvite,
  createOrgAdminInvite,
  listDepartmentUsers,
  validateOrganizationInvite,
} from "../controllers/organizationInviteController.js";

const router = Router();

router.post(
  "/org-admin",
  protect,
  authorize(ACTIONS.ORGANIZATION.CREATE),
  validate([
    body("organizationId").isMongoId().withMessage("organizationId must be a valid id"),
    body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
  ]),
  createOrgAdminInvite
);

router.post(
  "/department-admin",
  protect,
  authorize(ACTIONS.DEPARTMENT.CREATE),
  validate([
    body("organizationId").isMongoId().withMessage("organizationId must be a valid id"),
    body("departmentId").isMongoId().withMessage("departmentId must be a valid id"),
    body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
  ]),
  createDepartmentAdminInvite
);

router.post(
  "/department-user",
  protect,
  authorize(ACTIONS.USER.CREATE),
  validate([
    body("organizationId").isMongoId().withMessage("organizationId must be a valid id"),
    body("departmentId").isMongoId().withMessage("departmentId must be a valid id"),
    body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
  ]),
  createDepartmentUserInvite
);

router.get(
  "/department-users/:departmentId",
  protect,
  authorize(ACTIONS.USER.READ),
  validate([param("departmentId").isMongoId().withMessage("departmentId must be a valid id")]),
  listDepartmentUsers
);

router.get(
  "/validate",
  validate([query("token").isString().trim().notEmpty().withMessage("token is required")]),
  validateOrganizationInvite
);

router.post(
  "/accept",
  validate([
    body("token").isString().trim().notEmpty().withMessage("token is required"),
    body("name").trim().isLength({ min: 2, max: 60 }).withMessage("Name must be 2-60 characters"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ]),
  acceptOrganizationInvite
);

export default router;
