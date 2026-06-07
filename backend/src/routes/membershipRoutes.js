import { Router } from "express";
import { body, param } from "express-validator";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { ACTIONS } from "../constants/actions.js";
import { updateMembershipPermissions } from "../controllers/membershipController.js";

const router = Router();

router.patch(
  "/:id/permissions",
  protect,
  authorize(ACTIONS.ACCESS.UPDATE),
  validate([
    param("id").isMongoId().withMessage("Invalid membership id"),
    body("permissions")
      .isArray()
      .withMessage("permissions must be an array"),
    body("permissions.*")
      .isString()
      .withMessage("Each permission must be a string"),
  ]),
  updateMembershipPermissions
);

export default router;
