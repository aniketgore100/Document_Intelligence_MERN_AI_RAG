import { Router } from "express";
import { body, param, query } from "express-validator";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { ACTIONS } from "../constants/actions.js";
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
  getDepartmentById,
  getDepartmentAnalytics,
  getMemberAnalytics,
} from "../controllers/departmentController.js";

const router = Router();

router.post("/create",
  protect,
  authorize(ACTIONS.DEPARTMENT.CREATE),
  validate([
    body("name")
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage("Department name must be 2-120 characters"),
    body("adminEmail")
      .isEmail()
      .withMessage("Valid adminEmail is required")
      .normalizeEmail(),
    body("status")
      .optional()
      .isIn(["active", "suspended", "archived"])
      .withMessage("status must be one of: active, suspended, archived"),
  ]),
  createDepartment
);
 
router.get("/list",
  protect,
  authorize(ACTIONS.DEPARTMENT.READ),
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
  listDepartments
);

router.patch("/:id",
  protect,
  authorize(ACTIONS.DEPARTMENT.UPDATE),
  validate([
    param("id").isMongoId().withMessage("Invalid department id"),
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage("Department name must be 2-120 characters"),
    body("status")
      .optional()
      .isIn(["active", "suspended", "archived"])
      .withMessage("status must be one of: active, suspended, archived"),
  ]),
  updateDepartment
);

router.delete("/:id",
  protect,
  authorize(ACTIONS.DEPARTMENT.DELETE),
  validate([param("id").isMongoId().withMessage("Invalid department id")]),
  deleteDepartment
);

router.get("/department/:orgId/:deptId", protect, 
    authorize(ACTIONS.DEPARTMENT.READ),
    validate([
      param("orgId").isMongoId().withMessage("Invalid organization id"),
      param("deptId").isMongoId().withMessage("Invalid department id"),
    ]), getDepartmentById
)

router.get("/department/:orgId/:deptId/analytics", protect,
    authorize(ACTIONS.DEPARTMENT.READ),
    validate([
      param("orgId").isMongoId().withMessage("Invalid organization id"),
      param("deptId").isMongoId().withMessage("Invalid department id"),
    ]), getDepartmentAnalytics
)

router.get("/department/:orgId/:deptId/members/:memberId/analytics",
  protect,
  authorize(ACTIONS.DEPARTMENT.READ),
  validate([
    param("orgId").isMongoId().withMessage("Invalid organization id"),
    param("deptId").isMongoId().withMessage("Invalid department id"),
    param("memberId").isMongoId().withMessage("Invalid member id"),
  ]),
  getMemberAnalytics
);

export default router;
