import { DepartmentService } from "../services/departmentService.js";

const departmentService = new DepartmentService();

export const createDepartment = async (req, res, next) => {
  try {
    const { name, status, adminEmail } = req.body;
    const result = await departmentService.createDepartment({
      name,
      status,
      adminEmail,
      createdBy: req.user?._id || req.user?.id || null,
    });

    return res.status(201).json({
      department: result.department.toPublic(),
      invite: result.invite,
    });
  } catch (error) {
    next(error);
  }
};

export const listDepartments = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await departmentService.listDepartments({
      userId: req.user?._id || req.user?.id || null,
      page,
      limit,
      status,
    });

    return res.status(200).json({
      departments: result.departments,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const result = await departmentService.updateDepartment({
      departmentId: req.params.id,
      userId: req.user?._id || req.user?.id || null,
      name: req.body.name,
      status: req.body.status,
    });

    return res.status(200).json({
      department: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    await departmentService.deleteDepartment({
      departmentId: req.params.id,
      userId: req.user?._id || req.user?.id || null,
    });
    return res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentById = async(req, res, next) => {
  try{
    const { orgId, deptId } = req.params;

    const department = await departmentService.getDepartmentById({
      orgId : orgId,
      deptId : deptId,
    })


    return res.status(200).json({
      message : "Department details fetched successfully",
      department : department
    });
  }catch(error){
    console.error("Error fetching department details :: ", error);
    next(error);
  }
}
