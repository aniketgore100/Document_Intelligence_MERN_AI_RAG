import { OrganizationService } from "../services/organizationService.js";

const organizationService = new OrganizationService();

export const createOrganization = async (req, res, next) => {
  try {
    const { name, status, metadata, Owner } = req.body;
    const result = await organizationService.createOrganization({
      name,
      status,
      metadata,
      Owner,
      createdBy: req.user?.id || req.user?._id || null,
    });

    return res.status(201).json({
      organization: result.organization.toPublic(),
      ...(result.invite ? { invite: result.invite } : {}),
    });
  } catch (err) {
    next(err);
  }
};


export const getOrganizations = async(req, res, next) => {
  try{
    const { page, limit, status } = req.query;
    const result = await organizationService.getOrganizationsPaginated({
      page,
      limit,
      status,
    });

    return res.status(200).json({
      organizations: result.organizations,
      pagination: result.pagination,
    });
  }catch(error){
    next(error);
  }
}



export const getRolesAndPermission = async(req, res, next) => {
  try{
    const {owner} = req.body;
    const result = await organizationService.getRolesAndPermission(owner);
    return res.status(200).json(result);
  }catch(error){
    next(error);
  }
}