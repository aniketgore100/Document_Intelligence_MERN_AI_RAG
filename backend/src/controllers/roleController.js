import { RoleService } from '../services/roleService.js';

const roleService = new RoleService();

export const createRole = async (req, res, next) => {
  try {
    const { name, permissions } = req.body;
    const role = await roleService.createRole({ name, permissions });

    return res.status(201).json({
      role,
    });
  } catch (err) {
    next(err);
  }
};

export const updateRolePermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    const role = await roleService.updateRolePermissions({
      roleId: id,
      permissions,
    });

    return res.status(200).json({
      role,
    });
  } catch (err) {
    next(err);
  }

};

export const getRoles = async(req, res, next) => {
  try{
    const roles = await roleService.getRoles();
    return res.status(200).json({
      roles,
    })
  }catch(err){
    next(err);
  }
}