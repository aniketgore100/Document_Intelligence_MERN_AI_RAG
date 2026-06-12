import path from 'path';
import { DocumentRepository } from '../repositories/documentRepository.js';
import { DocumentAssignmentRepository } from '../repositories/documentAssignmentRepository.js';
import { DepartmentRepository } from '../repositories/departmentRepository.js';
import { OrganizationMembershipRepository } from '../repositories/organizationMembershipRepository.js';
import { DOCUMENT_UPLOAD } from '../constants/documents.js';
import { createUploadUrl, createViewUrl, buildDocumentKey, headObject, deleteObject } from '../utils/s3.js';
import { ROLES } from '../constants/roles.js';
import mongoose from 'mongoose';
import dotenv from "dotenv";
dotenv.config();


const allowedExtensions = new Set(DOCUMENT_UPLOAD.ALLOWED_EXTENSIONS);

export class DocumentService {


  constructor({
    documentRepository = new DocumentRepository(),
    documentAssignmentRepository = new DocumentAssignmentRepository(),
    departmentRepository = new DepartmentRepository(),
    organizationMembershipRepository = new OrganizationMembershipRepository(),
  } = {}) {
    this.documentRepository = documentRepository;
    this.documentAssignmentRepository = documentAssignmentRepository;
    this.departmentRepository = departmentRepository;
    this.organizationMembershipRepository = organizationMembershipRepository;
  }



  requireOrgAdmin(auth) {
    if (auth?.roleName !== ROLES.ORG_ADMIN) {
      const error = new Error('Only organization admins can upload documents');
      error.statusCode = 403;
      throw error;
    }

    if (!auth?.organizationId) {
      const error = new Error('Organization context is required');
      error.statusCode = 400;
      throw error;
    }
  }

  requireOrganizationContext(auth) {
    if (!auth?.organizationId) {
      const error = new Error('Organization context is required');
      error.statusCode = 400;
      throw error;
    }
  }

  requireDepartmentContext(auth) {
    this.requireOrganizationContext(auth);
    if (!auth?.departmentId) {
      const error = new Error('Department context is required');
      error.statusCode = 400;
      throw error;
    }
  }

  normalizeObjectIds(values, fieldName) {
    if (!Array.isArray(values)) {
      const error = new Error(`${fieldName} must be an array`);
      error.statusCode = 400;
      throw error;
    }

    const uniqueIds = [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
    for (const id of uniqueIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error(`Invalid id in ${fieldName}`);
        error.statusCode = 400;
        throw error;
      }
    }
    return uniqueIds;
  }

  serializeAssignment(assignment) {
    const department = assignment.department;
    const user = assignment.user;
    return {
      id: assignment._id,
      targetType: assignment.targetType,
      status: assignment.status,
      assignedAt: assignment.assignedAt,
      department: department
        ? {
            id: department._id || department,
            name: department.name || null,
            slug: department.slug || null,
          }
        : null,
      user: user
        ? {
            id: user._id || user,
            name: user.name || null,
            email: user.email || null,
          }
        : null,
    };
  }

  async attachAssignmentSummaries(documents, auth = null) {
    const documentIds = documents.map((document) => document._id);
    if (!documentIds.length) return [];

    const assignments = await this.documentAssignmentRepository.listActiveByDocuments({
      documentIds,
    });

    const grouped = new Map();
    for (const assignment of assignments) {
      const documentId = String(assignment.document);
      if (!grouped.has(documentId)) grouped.set(documentId, []);
      grouped.get(documentId).push(this.serializeAssignment(assignment));
    }

    const isDeptAdmin = auth?.roleName === ROLES.DEPT_ADMIN;
    const isUser = auth?.roleName === ROLES.USER;

    return documents.map((document) => {
      const publicDocument = document.toPublic();

      // Users have no need for cross-department assignment metadata
      if (isUser) {
        return { ...publicDocument, assignedDepartments: [], assignedUsers: [] };
      }

      const documentAssignments = grouped.get(String(document._id)) || [];

      // Dept admins only see assignments scoped to their own department.
      // USER-type assignments store the assigning department on `assignment.department`,
      // so this single filter covers both DEPARTMENT and USER targetTypes correctly.
      const visibleAssignments = isDeptAdmin
        ? documentAssignments.filter(
            (a) => String(a.department?.id) === String(auth.departmentId),
          )
        : documentAssignments;

      return {
        ...publicDocument,
        assignedDepartments: visibleAssignments
          .filter((assignment) => assignment.targetType === 'DEPARTMENT')
          .map((assignment) => assignment.department)
          .filter(Boolean),
        assignedUsers: visibleAssignments
          .filter((assignment) => assignment.targetType === 'USER')
          .map((assignment) => assignment.user)
          .filter(Boolean),
      };
    });
  }

  validateFileInput({ originalName, sizeBytes, contentType }) {
    if (!originalName || typeof originalName !== 'string') {
      const error = new Error('originalName is required');
      error.statusCode = 400;
      throw error;
    }

    if (!contentType || typeof contentType !== 'string') {
      const error = new Error('contentType is required');
      error.statusCode = 400;
      throw error;
    }

    const trimmedOriginalName = originalName.trim();
    if (!trimmedOriginalName) {
      const error = new Error('originalName is required');
      error.statusCode = 400;
      throw error;
    }
    if (trimmedOriginalName.length > 255) {
      const error = new Error('originalName must be 255 characters or less');
      error.statusCode = 400;
      throw error;
    }
    const extension = path.extname(trimmedOriginalName).toLowerCase();
    if (!allowedExtensions.has(extension)) {
      const error = new Error(`Unsupported file type. Allowed: ${DOCUMENT_UPLOAD.ALLOWED_EXTENSIONS.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const normalizedContentType = contentType.trim().toLowerCase();
    const allowedContentTypes = DOCUMENT_UPLOAD.ALLOWED_MIME_TYPES[extension] || [];
    if (!allowedContentTypes.includes(normalizedContentType)) {
      const error = new Error(`Unsupported content type for ${extension}`);
      error.statusCode = 400;
      throw error;
    }

    const parsedSize = Number(sizeBytes);
    if (!Number.isFinite(parsedSize) || parsedSize <= 0) {
      const error = new Error('sizeBytes must be a positive number');
      error.statusCode = 400;
      throw error;
    }

    if (parsedSize > DOCUMENT_UPLOAD.MAX_SIZE_BYTES) {
      const error = new Error('File size exceeds 20 MB limit');
      error.statusCode = 413;
      throw error;
    }

    return {
      originalName: trimmedOriginalName,
      extension,
      sizeBytes: parsedSize,
      contentType: normalizedContentType,
    };
  }

  buildMetadataRecord({ originalName, extension, sizeBytes, contentType, organizationId, uploadedBy }) {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      const error = new Error('AWS_S3_BUCKET is required');
      error.statusCode = 500;
      throw error;
    }

    return {
      organization: organizationId,
      uploadedBy,
      originalName,
      extension,
      mimeType: contentType,
      sizeBytes,
      bucket,
      status: DOCUMENT_UPLOAD.STATUSES.PENDING,
      metadata: {
        source: 'direct-upload',
      },
    };
  }


  
  async createUploadSession({ auth, originalName, sizeBytes, contentType }) {

    this.requireOrgAdmin(auth);

    const file = this.validateFileInput({
      originalName,
      sizeBytes,
      contentType,
    });

    const tempDocumentId = new mongoose.Types.ObjectId();

    const s3Key = buildDocumentKey({
      organizationId: auth.organizationId,
      documentId: tempDocumentId.toString(),
      extension: file.extension,
    });


    const signedUrl = await createUploadUrl({
      bucket: process.env.AWS_S3_BUCKET,
      key: s3Key,
      contentType: file.contentType,
    });

    return {
      document: {
        id: tempDocumentId.toString(),
        organization: auth.organizationId,
        uploadedBy: auth.userId,
        originalName: file.originalName,
        extension: file.extension,
        mimeType: file.contentType,
        sizeBytes: file.sizeBytes,
        bucket: process.env.AWS_S3_BUCKET,
        s3Key,
        status: DOCUMENT_UPLOAD.STATUSES.PENDING,
      },
      upload: {
        url: signedUrl.signedUrl,
        method: "PUT",
        headers: {
          "Content-Type": file.contentType,
          "x-amz-server-side-encryption": "AES256",
        },
        expiresInSeconds: 900,
      },
    };
  }

  async completeUpload({ auth, documentId, originalName, sizeBytes, contentType }) {
    this.requireOrgAdmin(auth);

    const document = await this.documentRepository.findByIdForOrg(documentId, auth.organizationId);
    if (document?.status === DOCUMENT_UPLOAD.STATUSES.DELETED) {
      const error = new Error('Document has been deleted');
      error.statusCode = 409;
      throw error;
    }

    const file = this.validateFileInput({
      originalName,
      sizeBytes,
      contentType,
    });

    const documentIdString = new mongoose.Types.ObjectId(documentId).toString();

    const s3Key = buildDocumentKey({
      organizationId: auth.organizationId,
      documentId: documentIdString,
      extension: file.extension,
    });


    let head;
    try {
      head = await headObject({ bucket: process.env.AWS_S3_BUCKET, key: s3Key });
    } catch (error) {
      const notFound =
        error?.name === 'NotFound' ||
        error?.$metadata?.httpStatusCode === 404 ||
        error?.$metadata?.httpStatusCode === 403;
      if (notFound) {
        const responseError = new Error('Uploaded file was not found in S3');
        responseError.statusCode = 409;
        throw responseError;
      }
      throw error;
    }

    const uploadedSize = Number(head.ContentLength || 0);
    const uploadedContentType = String(head.ContentType || '').trim().toLowerCase();
    const allowedContentTypes = DOCUMENT_UPLOAD.ALLOWED_MIME_TYPES[file.extension] || [];
    const validationFailures = [];

    if (!Number.isFinite(uploadedSize) || uploadedSize <= 0) {
      validationFailures.push('Uploaded file is empty');
    }

    if (uploadedSize > DOCUMENT_UPLOAD.MAX_SIZE_BYTES) {
      validationFailures.push('Uploaded file exceeds 20 MB limit');
    }

    if (!allowedContentTypes.includes(uploadedContentType)) {
      validationFailures.push('Uploaded file content type does not match the requested document type');
    }

    if (validationFailures.length > 0) {
      try {
        await deleteObject({ bucket: process.env.AWS_S3_BUCKET, key: s3Key });
      } catch (deleteError) {
        const notFound =
          deleteError?.name === 'NotFound' ||
          deleteError?.$metadata?.httpStatusCode === 404;
        if (!notFound) {
          throw deleteError;
        }
      }

      const error = new Error('Uploaded file failed validation');
      error.statusCode = 409;
      throw error;
    }

    if (document) {
      if (document.status === DOCUMENT_UPLOAD.STATUSES.ACTIVE) {
        return {
          document: document.toPublic(),
        };
      }

      document.status = DOCUMENT_UPLOAD.STATUSES.ACTIVE;
      document.uploadedAt = new Date();
      document.sizeBytes = uploadedSize;
      document.checksum = head.ETag ? String(head.ETag).replaceAll('"', '') : document.checksum;
      document.failureReason = null;
      await this.documentRepository.save(document);

      return {
        document: document.toPublic(),
      };
    }

    const createdDocument = await this.documentRepository.create({
      _id: new mongoose.Types.ObjectId(documentIdString),
      organization: auth.organizationId,
      uploadedBy: auth.userId,
      originalName: file.originalName,
      extension: file.extension,
      mimeType: file.contentType,
      sizeBytes: uploadedSize,
      bucket: process.env.AWS_S3_BUCKET,
      s3Key,
      status: DOCUMENT_UPLOAD.STATUSES.ACTIVE,
      version: 1,
      checksum: head.ETag ? String(head.ETag).replaceAll('"', '') : null,
      metadata: {
        source: 'direct-upload',
      },
      uploadedAt: new Date(),
    });

    return {
      document: createdDocument.toPublic(),
    };
  }
  

  async listDocuments({ auth, page = 1, limit = 20, status }) {
    this.requireOrganizationContext(auth);

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const safePage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const safeLimitRaw = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 20;
    const safeLimit = Math.min(safeLimitRaw, 100);
    const safeStatus = status?.trim();

    if (safeStatus && !Object.values(DOCUMENT_UPLOAD.STATUSES).includes(safeStatus)) {
      const error = new Error('Invalid status filter');
      error.statusCode = 400;
      throw error;
    }

    const skip = (safePage - 1) * safeLimit;

    let documents = [];
    let total = 0;

    if (auth.roleName === ROLES.ORG_ADMIN) {
      [documents, total] = await Promise.all([
        this.documentRepository.listByOrganization({
          organizationId: auth.organizationId,
          status: safeStatus,
          limit: safeLimit,
          skip,
        }),
        this.documentRepository.countByOrganization({
          organizationId: auth.organizationId,
          status: safeStatus,
        }),
      ]);
    } else if (auth.roleName === ROLES.DEPT_ADMIN) {
      this.requireDepartmentContext(auth);
      const documentIds = await this.documentAssignmentRepository.listActiveDocumentIdsByDepartment({
        organizationId: auth.organizationId,
        departmentId: auth.departmentId,
      });
      [documents, total] = await Promise.all([
        this.documentRepository.listByIdsForOrganization({
          organizationId: auth.organizationId,
          documentIds,
          status: safeStatus,
          limit: safeLimit,
          skip,
        }),
        this.documentRepository.countByIdsForOrganization({
          organizationId: auth.organizationId,
          documentIds,
          status: safeStatus,
        }),
      ]);
    } else if (auth.roleName === ROLES.USER) {
      const documentIds = await this.documentAssignmentRepository.listActiveDocumentIdsByUser({
        organizationId: auth.organizationId,
        userId: auth.userId,
      });
      [documents, total] = await Promise.all([
        this.documentRepository.listByIdsForOrganization({
          organizationId: auth.organizationId,
          documentIds,
          status: safeStatus,
          limit: safeLimit,
          skip,
        }),
        this.documentRepository.countByIdsForOrganization({
          organizationId: auth.organizationId,
          documentIds,
          status: safeStatus,
        }),
      ]);
    } else {
      const error = new Error('Not allowed to view documents');
      error.statusCode = 403;
      throw error;
    }

    return {
      documents: await this.attachAssignmentSummaries(documents, auth),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1,
        hasNextPage: skip + documents.length < total,
        hasPrevPage: safePage > 1,
      },
    };
  }

  async ensureDocumentViewAccess({ auth, documentId }) {
    this.requireOrganizationContext(auth);

    const document = await this.documentRepository.findByIdForOrg(documentId, auth.organizationId);
    if (!document || document.status !== DOCUMENT_UPLOAD.STATUSES.ACTIVE) {
      const error = new Error('Document not found');
      error.statusCode = 404;
      throw error;
    }

    if (auth.roleName === ROLES.ORG_ADMIN) {
      return document;
    }

    if (auth.roleName === ROLES.DEPT_ADMIN) {
      this.requireDepartmentContext(auth);
      const departmentAssignments = await this.documentAssignmentRepository.listActiveByDocument({
        documentId,
        targetType: 'DEPARTMENT',
      });
      const hasDepartmentAccess = departmentAssignments.some(
        (assignment) => String(assignment.department?._id || assignment.department) === String(auth.departmentId),
      );
      if (hasDepartmentAccess) return document;
    }

    if (auth.roleName === ROLES.USER) {
      // Fetch both assignment types concurrently so we can validate the full
      // hierarchy: user assignment must exist AND its parent department must
      // still hold an active DEPARTMENT assignment.
      const [userAssignments, departmentAssignments] = await Promise.all([
        this.documentAssignmentRepository.listActiveByDocument({
          documentId,
          targetType: 'USER',
        }),
        this.documentAssignmentRepository.listActiveByDocument({
          documentId,
          targetType: 'DEPARTMENT',
        }),
      ]);

      const userAssignment = userAssignments.find(
        (a) => String(a.user?._id || a.user) === String(auth.userId),
      );

      if (userAssignment) {
        const assigningDeptId = String(userAssignment.department?._id || userAssignment.department);
        const parentDeptActive = departmentAssignments.some(
          (a) => String(a.department?._id || a.department) === assigningDeptId,
        );
        if (parentDeptActive) return document;
      }
    }

    const error = new Error('Document access denied');
    error.statusCode = 403;
    throw error;
  }

  async getDocumentView({ auth, documentId }) {
    const document = await this.ensureDocumentViewAccess({ auth, documentId });
    const safeFileName = String(document.originalName || 'document').replaceAll('"', '');
    const signedUrl = await createViewUrl({
      bucket: document.bucket,
      key: document.s3Key,
      responseContentType: document.mimeType,
      responseContentDisposition: `inline; filename="${safeFileName}"`,
      expiresIn: 900,
    });

    return {
      document: document.toPublic(),
      view: {
        url: signedUrl.signedUrl,
        method: 'GET',
        expiresInSeconds: 900,
      },
    };
  }

  async getAssignmentTargets({ auth, documentId }) {
    if (auth.roleName === ROLES.ORG_ADMIN) {
      this.requireOrgAdmin(auth);

      const document = await this.documentRepository.findByIdForOrg(documentId, auth.organizationId);
      if (!document || document.status === DOCUMENT_UPLOAD.STATUSES.DELETED) {
        const error = new Error('Document not found');
        error.statusCode = 404;
        throw error;
      }

      const [departmentsResult, activeAssignments] = await Promise.all([
        this.departmentRepository.listByOrganization({
          organizationId: auth.organizationId,
          status: 'active',
          limit: 100,
          skip: 0,
        }),
        this.documentAssignmentRepository.listActiveByDocument({
          documentId,
          targetType: 'DEPARTMENT',
        }),
      ]);

      const departmentIds = departmentsResult.map((department) => department._id);
      const adminMemberships = await this.organizationMembershipRepository.listActiveMembersByDepartmentsAndRole({
        organizationId: auth.organizationId,
        departmentIds,
        roleName: ROLES.DEPT_ADMIN,
      });
      const adminsByDepartment = new Map();
      for (const membership of adminMemberships) {
        const departmentKey = String(membership.department?._id || membership.department);
        if (!adminsByDepartment.has(departmentKey)) adminsByDepartment.set(departmentKey, []);
        if (membership.user) {
          adminsByDepartment.get(departmentKey).push({
            id: membership.user._id,
            name: membership.user.name,
            email: membership.user.email,
          });
        }
      }

      const departments = departmentsResult.map((department) => ({
        id: department._id,
        name: department.name,
        slug: department.slug,
        admins: adminsByDepartment.get(String(department._id)) || [],
      }));

      return {
        mode: 'departments',
        document: document.toPublic(),
        assignedDepartmentIds: activeAssignments.map((assignment) => String(assignment.department?._id || assignment.department)),
        departments,
      };
    }

    if (auth.roleName === ROLES.DEPT_ADMIN) {
      this.requireDepartmentContext(auth);

      const document = await this.documentRepository.findByIdForOrg(documentId, auth.organizationId);
      if (!document || document.status === DOCUMENT_UPLOAD.STATUSES.DELETED) {
        const error = new Error('Document not found');
        error.statusCode = 404;
        throw error;
      }

      const departmentAssignments = await this.documentAssignmentRepository.listActiveByDocument({
        documentId,
        targetType: 'DEPARTMENT',
      });
      const hasDepartmentAccess = departmentAssignments.some(
        (assignment) => String(assignment.department?._id || assignment.department) === String(auth.departmentId),
      );
      if (!hasDepartmentAccess) {
        const error = new Error('Document is not assigned to your department');
        error.statusCode = 403;
        throw error;
      }

      const [memberships, activeAssignments] = await Promise.all([
        this.organizationMembershipRepository.listDepartmentMembersByRole({
          organizationId: auth.organizationId,
          departmentId: auth.departmentId,
          roleName: ROLES.USER,
          status: 'active',
        }),
        this.documentAssignmentRepository.listActiveByDocument({
          documentId,
          targetType: 'USER',
        }),
      ]);

      return {
        mode: 'users',
        document: document.toPublic(),
        assignedUserIds: activeAssignments
          .filter((assignment) => String(assignment.department?._id || assignment.department) === String(auth.departmentId))
          .map((assignment) => String(assignment.user?._id || assignment.user)),
        users: memberships
          .filter((membership) => membership.user)
          .map((membership) => ({
            id: membership.user._id,
            name: membership.user.name,
            email: membership.user.email,
          })),
      };
    }

    const error = new Error('Not allowed to assign documents');
    error.statusCode = 403;
    throw error;
  }




  async assignDepartments({ auth, documentId, departmentIds }) {
    this.requireOrgAdmin(auth);

    const normalizedDepartmentIds = this.normalizeObjectIds(departmentIds, 'departmentIds');
    const document = await this.documentRepository.findByIdForOrg(documentId, auth.organizationId);
    if (!document || document.status === DOCUMENT_UPLOAD.STATUSES.DELETED) {
      const error = new Error('Document not found');
      error.statusCode = 404;
      throw error;
    }

    const departmentsResult = await this.departmentRepository.listByOrganization({
      organizationId: auth.organizationId,
      status: 'active',
      limit: 100,
      skip: 0,
    });
    const validDepartmentIds = new Set(departmentsResult.map((department) => String(department._id)));
    const invalidIds = normalizedDepartmentIds.filter((departmentId) => !validDepartmentIds.has(String(departmentId)));
    if (invalidIds.length) {
      const error = new Error('One or more departments are outside your organization or inactive');
      error.statusCode = 400;
      throw error;
    }

    // Compute which departments are losing access before the sync so we can
    // cascade-revoke their user assignments immediately after.
    const currentDeptAssignments = await this.documentAssignmentRepository.listActiveByDocument({
      documentId: document._id,
      targetType: 'DEPARTMENT',
    });
    const newDeptIdSet = new Set(normalizedDepartmentIds.map(String));
    const revokedDeptIds = currentDeptAssignments
      .map((a) => String(a.department?._id || a.department))
      .filter((id) => !newDeptIdSet.has(id));

    await this.documentAssignmentRepository.syncDepartmentAssignments({
      document: document._id,
      organizationId: auth.organizationId,
      departmentIds: normalizedDepartmentIds,
      assignedBy: auth.userId,
    });

    // Cascade: revoke all user-level assignments that belonged to departments
    // that just lost access. This prevents orphaned active USER rows.
    if (revokedDeptIds.length > 0) {
      await this.documentAssignmentRepository.revokeUserAssignmentsByDepartments({
        documentId: document._id,
        departmentIds: revokedDeptIds,
        revokedBy: auth.userId,
      });
    }

    return this.getAssignmentTargets({ auth, documentId });
  }



  async assignUsers({ auth, documentId, userIds }) {
    if (auth.roleName !== ROLES.DEPT_ADMIN) {
      const error = new Error('Only department admins can assign documents to users');
      error.statusCode = 403;
      throw error;
    }
    this.requireDepartmentContext(auth);

    const normalizedUserIds = this.normalizeObjectIds(userIds, 'userIds');
    const targets = await this.getAssignmentTargets({ auth, documentId });
    const validUserIds = new Set(targets.users.map((user) => String(user.id)));
    const invalidIds = normalizedUserIds.filter((userId) => !validUserIds.has(String(userId)));
    if (invalidIds.length) {
      const error = new Error('One or more users are outside your department');
      error.statusCode = 400;
      throw error;
    }

    await this.documentAssignmentRepository.syncUserAssignments({
      document: documentId,
      organizationId: auth.organizationId,
      departmentId: auth.departmentId,
      userIds: normalizedUserIds,
      assignedBy: auth.userId,
    });

    return this.getAssignmentTargets({ auth, documentId });
  }


  
  async deleteDocument({ auth, documentId }) {
    this.requireOrgAdmin(auth);

    const document = await this.documentRepository.findByIdForOrg(documentId, auth.organizationId);
    if (!document) {
      const error = new Error('Document not found');
      error.statusCode = 404;
      throw error;
    }

    if (document.status === DOCUMENT_UPLOAD.STATUSES.DELETED) {
      return { document: document.toPublic() };
    }

    try {
      await deleteObject({
        bucket: document.bucket,
        key: document.s3Key,
      });
    } catch (error) {
      const notFound =
        error?.name === 'NotFound' ||
        error?.$metadata?.httpStatusCode === 404;
      if (!notFound) {
        throw error;
      }
    }

    document.status = DOCUMENT_UPLOAD.STATUSES.DELETED;
    document.deletedAt = new Date();
    document.deletedBy = auth.userId;
    await this.documentRepository.save(document);

    return {
      document: document.toPublic(),
    };
  }



}
