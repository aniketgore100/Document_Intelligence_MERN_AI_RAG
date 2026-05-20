import Role from '../models/Role.js';

export class RoleRepository {
  findById(id) {
    return Role.findById(id);
  }

  findByName(name) {
    return Role.findOne({ name });
  }

  create(payload) {
    return Role.create(payload);
  }

  save(roleDoc) {
    return roleDoc.save();
  }

  get(){
    return Role.find();
  }
}
