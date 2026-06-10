import Document from '../models/Document.js';

export class DocumentRepository {
  async create(data, options = {}) {
    const documents = await Document.create([data], options);
    return documents[0];
  }

  async findById(id) {
    return Document.findById(id)
      .populate('organization', 'name slug status')
      .populate('department', 'name slug')
      .populate('uploadedBy', 'name email role');
  }

  async findByIdForOrg(id, organizationId) {
    return Document.findOne({ _id: id, organization: organizationId })
      .populate('organization', 'name slug status')
      .populate('department', 'name slug')
      .populate('uploadedBy', 'name email role');
  }

  async listByOrganization({ organizationId, status, limit = 20, skip = 0 } = {}) {
    const filter = { organization: organizationId };
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: 'DELETED' };
    }

    return Document.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('department', 'name slug')
      .populate('uploadedBy', 'name email role');
  }

  async countByOrganization({ organizationId, status } = {}) {
    const filter = { organization: organizationId };
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: 'DELETED' };
    }
    return Document.countDocuments(filter);
  }

  async save(documentDoc) {
    return documentDoc.save();
  }
}
