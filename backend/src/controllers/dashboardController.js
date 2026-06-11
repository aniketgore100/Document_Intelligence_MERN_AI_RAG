import { DashboardService } from "../services/dashboardService.js";

const dashboardService = new DashboardService();

export const getOrgAdminSummary = async (req, res, next) => {
  try {
    const result = await dashboardService.getOrgAdminSummary({
      userId: req.user?._id || req.user?.id || null,
      days: req.query?.days,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
};
