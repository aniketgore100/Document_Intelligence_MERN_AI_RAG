import { DocumentService } from '../services/documentService.js';

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

export const processingWebhook = async (req, res, next) => {
  try {

    console.log("webhook received ::", req);
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
