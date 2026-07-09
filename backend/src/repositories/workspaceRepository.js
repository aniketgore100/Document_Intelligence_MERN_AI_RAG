import Workspace from '../models/Workspace.js';

export class WorkspaceRepository {
  findByOwner(ownerId) {
    return Workspace.find({ owner: ownerId })
      .select('title createdAt updatedAt')
      .sort({ updatedAt: -1 });
  }

  findByIdAndOwner(id, ownerId) {
    return Workspace.findOne({ _id: id, owner: ownerId });
  }

  create(data) {
    return Workspace.create(data);
  }

  updateById(id, update) {
    return Workspace.findByIdAndUpdate(id, { $set: update }, { new: true });
  }

  deleteById(id) {
    return Workspace.findByIdAndDelete(id);
  }
}
