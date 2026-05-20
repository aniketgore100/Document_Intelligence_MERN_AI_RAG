import { Router } from "express";
import { body } from "express-validator";
import { createOrganization } from "../controllers/organizationController.js";
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
  ]),
  createOrganization
);

export default router;
