import { DocumentService } from '../services/documentService.js';
import RagQuery from '../models/RagQuery.js';
import Document from '../models/Document.js';

const documentService = new DocumentService();



export const createUploadSession = async (req, res, next) => {
  try {
    const { originalName, sizeBytes, contentType } = req.body;
    const result = await documentService.createUploadSession({
      auth: req.auth,
      originalName,
      sizeBytes,
      contentType,
    });

    return res.status(201).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return next(err);
  }
};


export const completeUpload = async (req, res, next) => {
  try {
    const result = await documentService.completeUpload({
      auth: req.auth,
      documentId: req.params.id,
      originalName: req.body.originalName,
      sizeBytes: req.body.sizeBytes,
      contentType: req.body.contentType,
    });

    return res.status(200).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return next(err);
  }
};

export const processDocument = async (req, res, next) => {
  try {
    const result = await documentService.processDocument({
      auth: req.auth,
      documentId: req.params.id,
    });

    return res.status(202).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return next(err);
  }
};

export const listDocuments = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    
    const result = await documentService.listDocuments({
      auth: req.auth,
      page,
      limit,
      status,
    });

    return res.status(200).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return next(err);
  }
};

export const getDocumentView = async (req, res, next) => {
  try {
    const result = await documentService.getDocumentView({
      auth: req.auth,
      documentId: req.params.id,
    });

    return res.status(200).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return next(err);
  }
};

export const getAssignmentTargets = async (req, res, next) => {
  try {
    const result = await documentService.getAssignmentTargets({
      auth: req.auth,
      documentId: req.params.id,
    });

    return res.status(200).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return next(err);
  }
};

export const assignDepartments = async (req, res, next) => {
  try {
    const result = await documentService.assignDepartments({
      auth: req.auth,
      documentId: req.params.id,
      departmentIds: req.body.departmentIds,
    });

    return res.status(200).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return next(err);
  }
};

export const assignUsers = async (req, res, next) => {
  try {
    const result = await documentService.assignUsers({
      auth: req.auth,
      documentId: req.params.id,
      userIds: req.body.userIds,
    });

    return res.status(200).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return next(err);
  }
};



export const deleteDocument = async (req, res, next) => {
  try {
    const result = await documentService.deleteDocument({
      auth: req.auth,
      documentId: req.params.id,
    });

    return res.status(200).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return next(err);
  }
};

export const queryDocument = async (req, res, next) => {
  try {
    const { query } = req.body;
    const documentId = req.params.id;
    const { userId, organizationId } = req.auth;

    const doc = await Document.findOne({
      _id: documentId,
      organization: organizationId,
      status: { $ne: 'DELETED' },
    });

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (doc.processingStatus !== 'COMPLETED') {
      return res.status(422).json({ message: 'Document has not been processed yet' });
    }

    const ragUrl = process.env.RAG_API_URL || 'http://localhost:8001';
    const ragKey = process.env.RAG_API_KEY;

    const startTime = Date.now();
    let ragData;
    let status = 'success';
    let errorMessage = null;

    try {
      const ragRes = await fetch(`${ragUrl}/rag/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ragKey,
        },
        body: JSON.stringify({ query, document_id: documentId }),
      });

      if (!ragRes.ok) {
        const err = await ragRes.json().catch(() => ({}));
        throw new Error(err.detail || `RAG service error: ${ragRes.status}`);
      }

      ragData = await ragRes.json();
    } catch (ragErr) {
      status = 'failed';
      errorMessage = ragErr.message;
    }

    const responseTimeMs = Date.now() - startTime;

    await RagQuery.create({
      document: documentId,
      user: userId,
      organization: organizationId,
      query,
      answer: ragData?.answer ?? null,
      chunks: ragData?.chunks ?? [],
      status,
      errorMessage,
      responseTimeMs,
    });

    if (status === 'failed') {
      return res.status(502).json({ message: errorMessage || 'RAG service unavailable' });
    }

    return res.status(200).json(ragData);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return next(err);
  }
};

export const processingWebhook = async (req, res, next) => {
  try {

    // console.log("webhook rec?eived ::", req);
    const apiKey = req.headers['x-api-key'];
    const expectedKey = process.env.MERN_WEBHOOK_API_KEY;

    if (!expectedKey) {
      const error = new Error('Webhook API key not configured');
      error.statusCode = 500;
      throw error;
    }

    if (!apiKey || apiKey !== expectedKey) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const { documentId, processingStatus, processingError } = req.body;

    if (!documentId || !processingStatus) {
      const error = new Error('Missing required fields: documentId, processingStatus');
      error.statusCode = 400;
      throw error;
    }

    const result = await documentService.updateProcessingStatus({
      documentId,
      processingStatus,
      processingError,
    });

    return res.status(200).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return next(err);
  }
};
