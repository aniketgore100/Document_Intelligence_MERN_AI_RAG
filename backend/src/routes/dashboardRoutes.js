import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { getOrgAdminSummary } from "../controllers/dashboardController.js";

const router = Router();

router.get("/org-admin/summary", protect, getOrgAdminSummary);

export default router;
