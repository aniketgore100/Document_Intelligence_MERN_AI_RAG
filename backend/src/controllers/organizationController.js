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



export const getOrgById = async(req, res, next) => {
  try{
    
    const { id, slug } = req.params;    
    const result = await organizationService.getOrgById(id, slug);
    console.log("Fetched organization:", result);

    return res.status(200).json({
      messages : "Organization fetched successfully",
      organization: result,
    });


  }catch(error){
    console.error("Error fetching organization by ID and slug:", error);
    next(error);
  }
}