export const DOCUMENT_UPLOAD = Object.freeze({
  MAX_SIZE_BYTES: 20 * 1024 * 1024,
  ALLOWED_EXTENSIONS: Object.freeze(['.pdf', '.docx', '.txt', '.md', '.csv']),
  ALLOWED_MIME_TYPES: Object.freeze({
    '.pdf': Object.freeze(['application/pdf']),
    '.docx': Object.freeze([
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]),
    '.txt': Object.freeze(['text/plain']),
    '.md': Object.freeze(['text/markdown', 'text/plain']),
    '.csv': Object.freeze(['text/csv', 'application/csv', 'text/plain']),
  }),
  STATUSES: Object.freeze({
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    DELETED: 'DELETED',
    FAILED: 'FAILED',
  }),
});
