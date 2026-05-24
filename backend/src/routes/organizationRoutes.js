import { Router } from "express";
import { body, query } from "express-validator";
import { createOrganization, getOrganizations } from "../controllers/organizationController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { authorize } from "../middleware/authorize.js";
import { ACTIONS } from "../constants/actions.js";

const router = Router();

router.post(
  "/createOrg",
  protect,
  authorize(ACTIONS.ORGANIZATION.CREATE),
  validate([
    body("name")
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage("Organization name must be 2-120 characters"),
    body("status")
      .optional()
      .isIn(["active", "suspended", "archived"])
      .withMessage("status must be one of: active, suspended, archived"),
    body("metadata")
      .optional()
      .isObject()
      .withMessage("metadata must be an object"),
    body("Owner")
      .optional()
      .isMongoId()
      .withMessage("Owner must be a valid user id"),
  ]),
  createOrganization
);

router.get(
  "/getOrgs",
  protect,
  authorize(ACTIONS.ORGANIZATION.READ),
  validate([
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("limit must be between 1 and 100"),
    query("status")
      .optional()
      .isIn(["active", "suspended", "archived"])
      .withMessage("status must be one of: active, suspended, archived"),
  ]),
  getOrganizations
);

export default router;
