import { OrganizationService } from "../services/organizationService.js";

const organizationService = new OrganizationService();

export const createOrganization = async (req, res, next) => {
  try {
    const { name } = req.body;
    const org = await organizationService.createOrganization({
      name,
      createdBy: req.user?.id || req.user?._id || null,
    });

    return res.status(201).json({
      organization: org.toPublic(),
    });
  } catch (err) {
    next(err);
  }
};
