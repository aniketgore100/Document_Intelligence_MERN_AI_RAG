import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  FileText,
  Loader2,
  MoreVertical,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useCompleteDocumentUploadMutation,
  useCreateDocumentUploadUrlMutation,
  useDeleteDocumentMutation,
  useGetDocumentsQuery,
} from '../features/documents/documentsApiSlice';
import { ROLES } from '../constants/roles';




const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md', '.csv'];



const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return '—';

  if (bytes < 1024) return `${bytes} B`;

  const units = ['KB', 'MB', 'GB'];

  let value = bytes / 1024;

  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
};



const getExtension = (name) => {
  const dotIndex = name.lastIndexOf('.');
  return dotIndex >= 0 ? name.slice(dotIndex).toLowerCase() : '';
};


const getContentTypeForFile = (file) => {
  if (file?.type && file.type !== 'application/octet-stream') {
    return file.type;
  }


  const extension = getExtension(file?.name || '');
  const fallbackTypes = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.csv': 'text/csv',
  };

  return fallbackTypes[extension] || 'application/octet-stream';
};

const formatUploadTime = (value) => {
  if (!value) return 'Awaiting confirmation';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Awaiting confirmation';

  const day = date.getDate();
  const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
  const year = date.getFullYear();
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

  return `${day} ${month} ${year} : ${time}`;
};



const OrgAdminDocuments = () => {


  const user = useSelector((state) => state.auth.user);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [page, setPage] = useState(1);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [openActionsId, setOpenActionsId] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [uploading, setUploading] = useState(false);
  const canManageDocs = user?.roleName === ROLES.ORG_ADMIN;
  const [createUploadUrl] = useCreateDocumentUploadUrlMutation();
  const [completeUpload] = useCompleteDocumentUploadMutation();
  const [deleteDocument] = useDeleteDocumentMutation();
  const { data, isLoading, refetch } = useGetDocumentsQuery(
    { page, limit: 10 },
    { skip: !canManageDocs },
  );

  const documents = data?.documents || [];
  const pagination = data?.pagination;

  useEffect(() => {
    if (canManageDocs) setPage(1);
  }, [canManageDocs]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!event.target.closest?.('[data-doc-actions-root="true"]')) {
        setOpenActionsId(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    const openUpload = () => setIsUploadOpen(true);
    window.addEventListener('open-upload-document', openUpload);
    return () => window.removeEventListener('open-upload-document', openUpload);
  }, []);

  const validateSelectedFile = (file) => {
    if (!file) return 'Choose a file first.';
    if (file.size > MAX_FILE_SIZE) return 'File size must be 20 MB or less.';
    const extension = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return `Allowed file types: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    return '';
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closeUploadModal = () => {
    setIsUploadOpen(false);
    setActionError('');
    setUploadError('');
    resetUploadForm();
  };

  const toggleActionsMenu = (id) => {
    setOpenActionsId((currentId) => (currentId === id ? null : id));
  };




  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setActionError('');

    if (!file) {
      setSelectedFile(null);
      setUploadError('');
      return;
    }

    const validationMessage = validateSelectedFile(file);
    if (validationMessage) {
      setSelectedFile(null);
      setUploadError(validationMessage);
      return;
    }

    setSelectedFile(file);
    setUploadError('');
  };




  const handleUpload = async (event) => {
    event.preventDefault();
    setActionError('');

    const validationMessage = validateSelectedFile(selectedFile);
    if (validationMessage) {
      setUploadError(validationMessage);
      return;
    }

    try {
      setUploading(true);
      const uploadSession = await createUploadUrl({
        originalName: selectedFile.name,
        sizeBytes: selectedFile.size,
        contentType: getContentTypeForFile(selectedFile),
      }).unwrap();

      const response = await fetch(uploadSession.upload.url, {
        method: uploadSession.upload.method,
        headers: uploadSession.upload.headers,
        body: selectedFile,
      });

      if (!response.ok) {
        throw new Error('Upload to S3 failed.');
      }

      await completeUpload({
        id: uploadSession.document.id,
        originalName: uploadSession.document.originalName,
        sizeBytes: uploadSession.document.sizeBytes,
        contentType: uploadSession.document.mimeType,
      }).unwrap();

      closeUploadModal();
      await refetch();


    } catch (error) {
      setActionError(error?.data?.message || error?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };




  const handleDelete = async (id) => {
    const confirmed = window.confirm('Delete this document permanently?');
    if (!confirmed) return;

    try {
      setActionError('');
      await deleteDocument({ id }).unwrap();
      await refetch();
    } catch (error) {
      setActionError(error?.data?.message || error?.message || 'Delete failed.');
    }
  };



  const rows = documents
  .map((document) => ({
    ...document,
      uploadedLabel: formatUploadTime(document.uploadedAt),
    }))
    .filter((document) => document.status !== 'DELETED');



  if (!canManageDocs) {
    return (
      <section className="flex min-h-[58vh] items-center justify-center p-4">
        <div className="max-w-lg rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-center text-rose-900 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
          <AlertCircle className="mx-auto mb-3" size={28} />
          <h1 className="text-lg font-semibold">Document access is restricted</h1>
          <p className="mt-2 text-sm leading-6">
            Only organization admins can upload, list, and delete documents right now.
          </p>
        </div>
      </section>
    );
  }



  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex h-full min-h-0 w-full flex-col gap-3 p-1"
    >
      {/* <div className="flex items-center justify-between gap-3">
        <p className="hidden text-xs font-medium uppercase tracking-[0.14em] muted md:block">
          {rows.length} documents
        </p>
      </div> */}

      {actionError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          {actionError}
        </div>
      ) : null}

      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl bg-transparent">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur dark:bg-slate-900/60">
              <tr>
                <th className="border border-slate-200 px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:text-slate-300">
                  Document Name
                </th>
                <th className="whitespace-nowrap border border-slate-200 px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:text-slate-300">
                  Size
                </th>
                <th className="whitespace-nowrap border border-slate-200 px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:text-slate-300">
                  Upload Time
                </th>
                <th className="whitespace-nowrap border border-slate-200 px-4 py-2 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-sm muted">
                    Loading...
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((document) => (
                  <tr
                    key={document.id}
                    className="transition-colors duration-150 hover:bg-slate-100/55 dark:hover:bg-slate-800/30"
                  >
                    <td className="border border-slate-200 px-4 py-2 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/35 dark:text-blue-300">
                          <FileText size={12} />
                        </span>

                        <span className="break-all text-sm font-medium text-slate-800 dark:text-slate-100">
                          {document.originalName}
                        </span>
                      </div>
                    </td>

                    <td className="whitespace-nowrap border border-slate-200 px-4 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                      {formatBytes(document.sizeBytes)}
                    </td>

                    <td className="whitespace-nowrap border border-slate-200 px-4 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                      {document.uploadedLabel}
                    </td>

                    <td className="border border-slate-200 px-4 py-2 dark:border-slate-700">
                      <div
                        data-doc-actions-root="true"
                        className="relative flex justify-end"
                      >
                        <button
                          type="button"
                          onClick={() => toggleActionsMenu(document.id)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-600 transition hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <MoreVertical size={13} />
                        </button>

                        {openActionsId === document.id && (
                          <div className="absolute right-0 top-9 z-20 w-36 rounded-xl border bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionsId(null);
                                handleDelete(document.id);
                              }}
                              disabled={document.status === 'DELETED'}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-sm muted"
                  >
                    No documents uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination ? (
        <div className="flex items-center justify-between px-1 text-sm">
          <p className="muted">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={!pagination.hasPrevPage}
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900/60 dark:text-slate-200"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!pagination.hasNextPage}
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900/60 dark:text-slate-200"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {isUploadOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeUploadModal}
          >
            <motion.div
              className="w-full max-w-lg rounded-2xl border bg-white p-4 shadow-lg dark:bg-slate-900"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  Upload Document
                </h3>
                <button
                  type="button"
                  onClick={closeUploadModal}
                  className="rounded-md border p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={14} />
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleUpload}>
                <label className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 transition hover:border-blue-300 hover:bg-blue-50/30 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-blue-700 dark:hover:bg-blue-900/10">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_EXTENSIONS.join(',')}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {selectedFile ? selectedFile.name : 'Choose a file'}
                  </span>
                  <span className="text-xs muted">
                    PDF, DOCX, TXT, MD, or CSV up to 20 MB
                  </span>
                </label>

                {uploadError ? (
                  <p className="text-sm text-rose-600 dark:text-rose-400">{uploadError}</p>
                ) : null}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeUploadModal}
                    className="rounded-xl border bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedFile || uploading}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
};

export default OrgAdminDocuments;
