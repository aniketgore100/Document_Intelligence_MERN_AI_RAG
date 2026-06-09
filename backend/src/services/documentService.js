import path from 'path';
import { DocumentRepository } from '../repositories/documentRepository.js';
import { DOCUMENT_UPLOAD } from '../constants/documents.js';
import { createUploadUrl, buildDocumentKey, headObject, deleteObject } from '../utils/s3.js';
import { ROLES } from '../constants/roles.js';
import mongoose from 'mongoose';
import dotenv from "dotenv";
dotenv.config();


const allowedExtensions = new Set(DOCUMENT_UPLOAD.ALLOWED_EXTENSIONS);

export class DocumentService {


  constructor({
    documentRepository = new DocumentRepository(),
  } = {}) {
    this.documentRepository = documentRepository;
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


    const document = await this.documentRepository.create({
      _id: tempDocumentId,

      ...this.buildMetadataRecord({
        ...file,
        organizationId: auth.organizationId,
        uploadedBy: auth.userId,
      }),

      s3Key,
    });

    const signedUrl = await createUploadUrl({
      bucket: document.bucket,
      key: document.s3Key,
      contentType: document.mimeType,
    });

    return {
      document: document.toPublic(),
      upload: {
        url: signedUrl.signedUrl,
        method: "PUT",
        headers: {
          "Content-Type": document.mimeType,
        },
        expiresInSeconds: 900,
      },
    };
  }

  async completeUpload({ auth, documentId }) {
    this.requireOrgAdmin(auth);

    const document = await this.documentRepository.findByIdForOrg(documentId, auth.organizationId);
    if (!document) {
      const error = new Error('Document not found');
      error.statusCode = 404;
      throw error;
    }

    if (document.status === DOCUMENT_UPLOAD.STATUSES.DELETED) {
      const error = new Error('Document has been deleted');
      error.statusCode = 409;
      throw error;
    }

    if (document.status === DOCUMENT_UPLOAD.STATUSES.ACTIVE) {
      return {
        document: document.toPublic(),
      };
    }

    let head;
    try {
      head = await headObject({ bucket: document.bucket, key: document.s3Key });
    } catch (error) {
      document.status = DOCUMENT_UPLOAD.STATUSES.FAILED;
      document.failureReason = 'Uploaded file is missing from S3';
      await this.documentRepository.save(document);

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
    const allowedContentTypes = DOCUMENT_UPLOAD.ALLOWED_MIME_TYPES[document.extension] || [];
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
      document.status = DOCUMENT_UPLOAD.STATUSES.FAILED;
      document.failureReason = validationFailures.join('; ');
      await this.documentRepository.save(document);

      try {
        await deleteObject({ bucket: document.bucket, key: document.s3Key });
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

    document.status = DOCUMENT_UPLOAD.STATUSES.ACTIVE;
    document.uploadedAt = new Date();
    document.sizeBytes = uploadedSize;
    document.checksum = head.ETag ? String(head.ETag).replaceAll('"', '') : document.checksum;
    await this.documentRepository.save(document);

    return {
      document: document.toPublic(),
    };
  }

  async listDocuments({ auth, page = 1, limit = 20, status }) {
    this.requireOrgAdmin(auth);

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
    const [documents, total] = await Promise.all([
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

    return {
      documents: documents.map((document) => document.toPublic()),
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
