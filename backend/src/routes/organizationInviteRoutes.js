import { Router } from "express";
import { body, query } from "express-validator";
import { validate } from "../middleware/validate.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { ACTIONS } from "../constants/actions.js";
import {
  acceptOrganizationInvite,
  createOrganizationInvite,
  validateOrganizationInvite,
} from "../controllers/organizationInviteController.js";

const router = Router();

router.post(
  "/create",
  protect,
  authorize(ACTIONS.ORGANIZATION.CREATE),
  validate([
    body("organizationId").isMongoId().withMessage("organizationId must be a valid id"),
    body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
    body("roleName").optional().isString().trim().notEmpty().withMessage("roleName must be a non-empty string"),
  ]),
  createOrganizationInvite
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
