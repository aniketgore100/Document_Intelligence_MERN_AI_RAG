import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Check,
  Eye,
  FileText,
  Loader2,
  MoreVertical,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useAssignDocumentDepartmentsMutation,
  useAssignDocumentUsersMutation,
  useCompleteDocumentUploadMutation,
  useCreateDocumentUploadUrlMutation,
  useDeleteDocumentMutation,
  useGetDocumentsQuery,
  useLazyGetDocumentAssignmentTargetsQuery,
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

const getInitials = (value) => {
  const words = String(value || 'NA').trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'NA';
};

const badgeColors = [
  'bg-pink-600',
  'bg-red-500',
  'bg-rose-500',
  'bg-blue-500',
  'bg-green-600',
  'bg-amber-500',
];



const OrgAdminDocuments = () => {


  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [page, setPage] = useState(1);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [openActionsId, setOpenActionsId] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [assignmentModal, setAssignmentModal] = useState(null);
  const [assignmentTargets, setAssignmentTargets] = useState(null);
  const [selectedTargetIds, setSelectedTargetIds] = useState([]);
  const [assignmentError, setAssignmentError] = useState('');
  const canManageDocs = user?.roleName === ROLES.ORG_ADMIN;
  const canAssignDocs = canManageDocs || user?.roleName === ROLES.DEPT_ADMIN;
  const canViewDocs = canManageDocs || user?.roleName === ROLES.DEPT_ADMIN || user?.roleName === ROLES.USER;
  const [createUploadUrl] = useCreateDocumentUploadUrlMutation();
  const [completeUpload] = useCompleteDocumentUploadMutation();
  const [deleteDocument] = useDeleteDocumentMutation();
  const [loadAssignmentTargets, { isFetching: isLoadingAssignmentTargets }] =
    useLazyGetDocumentAssignmentTargetsQuery();
  const [assignDocumentDepartments, { isLoading: isAssigningDepartments }] =
    useAssignDocumentDepartmentsMutation();
  const [assignDocumentUsers, { isLoading: isAssigningUsers }] =
    useAssignDocumentUsersMutation();
  const { data, isLoading, refetch } = useGetDocumentsQuery(
    { page, limit: 10 },
    { skip: !canViewDocs },
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

  const openAssignmentModal = async (document) => {
    setAssignmentModal(document);
    setAssignmentTargets(null);
    setSelectedTargetIds([]);
    setAssignmentError('');

    try {
      const targets = await loadAssignmentTargets({ id: document.id }).unwrap();
      setAssignmentTargets(targets);
      setSelectedTargetIds(
        targets.mode === 'departments'
          ? targets.assignedDepartmentIds || []
          : targets.assignedUserIds || [],
      );
    } catch (error) {
      setAssignmentError(error?.data?.message || 'Failed to load assignment targets.');
    }
  };

  const closeAssignmentModal = () => {
    setAssignmentModal(null);
    setAssignmentTargets(null);
    setSelectedTargetIds([]);
    setAssignmentError('');
  };

  const toggleTargetSelection = (id) => {
    setSelectedTargetIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const handleAssignmentSave = async () => {
    if (!assignmentModal || !assignmentTargets) return;

    try {
      setAssignmentError('');
      if (assignmentTargets.mode === 'departments') {
        await assignDocumentDepartments({
          id: assignmentModal.id,
          departmentIds: selectedTargetIds,
        }).unwrap();
      } else {
        await assignDocumentUsers({
          id: assignmentModal.id,
          userIds: selectedTargetIds,
        }).unwrap();
      }
      closeAssignmentModal();
      await refetch();
    } catch (error) {
      setAssignmentError(error?.data?.message || 'Failed to save assignments.');
    }
  };

  const renderAssignedBadges = (document) => {
    const assignedTargets = user?.roleName === ROLES.DEPT_ADMIN
      ? document.assignedUsers || []
      : document.assignedDepartments || [];

    if (!assignedTargets.length) {
      return <span className="text-xs muted">Unassigned</span>;
    }

    return (
      <div className="flex -space-x-2">
        {assignedTargets.slice(0, 5).map((target, index) => (
          <span
            key={target.id || target.email || target.name}
            title={target.email ? `${target.name || target.email} (${target.email})` : target.name}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white dark:border-slate-900 ${badgeColors[index % badgeColors.length]}`}
          >
            {getInitials(target.name || target.email)}
          </span>
        ))}
        {assignedTargets.length > 5 ? (
          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-white bg-slate-700 px-1 text-[10px] font-semibold text-white dark:border-slate-900">
            +{assignedTargets.length - 5}
          </span>
        ) : null}
      </div>
    );
  };

  const renderAssignmentPopover = () => {
    if (!assignmentModal) return null;

    return (
      <motion.div
        className="absolute right-0 top-9 z-30 w-[22rem] max-w-[calc(100vw-2rem)] rounded-xl border bg-white p-3 text-left shadow-xl dark:border-slate-800 dark:bg-slate-900"
        initial={{ opacity: 0, y: -4, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.98 }}
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              Assign Document
            </p>
            <p className="truncate text-xs muted">{assignmentModal.originalName}</p>
          </div>
          <button
            type="button"
            onClick={closeAssignmentModal}
            className="rounded-md border p-1 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <X size={13} />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto rounded-lg border dark:border-slate-800">
          {isLoadingAssignmentTargets ? (
            <div className="flex items-center gap-2 px-3 py-4 text-sm muted">
              <Loader2 size={14} className="animate-spin" />
              Loading targets...
            </div>
          ) : assignmentTargets?.mode === 'departments' ? (
            assignmentTargets.departments?.length ? (
              assignmentTargets.departments.map((department) => (
                <label
                  key={department.id}
                  className="flex cursor-pointer items-center gap-3 border-b px-3 py-2.5 last:border-b-0 dark:border-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedTargetIds.includes(String(department.id))}
                    onChange={() => toggleTargetSelection(String(department.id))}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {department.name}
                    </p>
                    <p className="truncate text-xs muted">
                      {department.admins?.length
                        ? department.admins.map((admin) => admin.name || admin.email).join(', ')
                        : 'No active department admin'}
                    </p>
                  </div>
                  {selectedTargetIds.includes(String(department.id)) ? (
                    <Check size={15} className="text-blue-600" />
                  ) : null}
                </label>
              ))
            ) : (
              <p className="px-3 py-4 text-sm muted">No departments found for this organization.</p>
            )
          ) : assignmentTargets?.mode === 'users' ? (
            assignmentTargets.users?.length ? (
              assignmentTargets.users.map((targetUser) => (
                <label
                  key={targetUser.id}
                  className="flex cursor-pointer items-center gap-3 border-b px-3 py-2.5 last:border-b-0 dark:border-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedTargetIds.includes(String(targetUser.id))}
                    onChange={() => toggleTargetSelection(String(targetUser.id))}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {targetUser.name}
                    </p>
                    <p className="truncate text-xs muted">{targetUser.email}</p>
                  </div>
                  {selectedTargetIds.includes(String(targetUser.id)) ? (
                    <Check size={15} className="text-blue-600" />
                  ) : null}
                </label>
              ))
            ) : (
              <p className="px-3 py-4 text-sm muted">No users found in this department.</p>
            )
          ) : assignmentError ? (
            <p className="px-3 py-4 text-sm text-rose-600 dark:text-rose-300">{assignmentError}</p>
          ) : null}
        </div>

        {assignmentError ? (
          <p className="mt-2 text-sm text-rose-600 dark:text-rose-300">{assignmentError}</p>
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs muted">{selectedTargetIds.length} selected</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeAssignmentModal}
              className="rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssignmentSave}
              disabled={!assignmentTargets || isAssigningDepartments || isAssigningUsers}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {(isAssigningDepartments || isAssigningUsers) ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save
            </button>
          </div>
        </div>
      </motion.div>
    );
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



  if (!canViewDocs) {
    return (
      <section className="flex min-h-[58vh] items-center justify-center p-4">
        <div className="max-w-lg rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-center text-rose-900 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
          <AlertCircle className="mx-auto mb-3" size={28} />
          <h1 className="text-lg font-semibold">Document access is restricted</h1>
          <p className="mt-2 text-sm leading-6">
            Your account does not have permission to view documents right now.
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
                <th className="border border-slate-200 px-4 py-2 text-left text-xs font-semibold  tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:text-slate-300">
                  Document Name
                </th>
                <th className="whitespace-nowrap border border-slate-200 px-4 py-2 text-left text-xs font-semibold  tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:text-slate-300">
                  Size
                </th>
                <th className="whitespace-nowrap border border-slate-200 px-4 py-2 text-left text-xs font-semibold  tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:text-slate-300">
                  Upload Time
                </th>
                {canAssignDocs ? (
                  <th className="whitespace-nowrap border border-slate-200 px-4 py-2 text-right text-xs font-semibold  tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:text-slate-300">
                    Assign
                  </th>
                ) : null}
                {canManageDocs ? (
                  <th className="whitespace-nowrap border border-slate-200 px-4 py-2 text-right text-xs font-semibold  tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:text-slate-300">
                    Actions
                  </th>
                ) : null}
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3 + (canAssignDocs ? 1 : 0) + (canManageDocs ? 1 : 0)} className="px-4 py-4 text-xs muted">
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
                      <button
                        type="button"
                        onClick={() => navigate(`/documents/${document.id}`)}
                        className="group flex w-full items-center gap-2 text-left"
                      >
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/35 dark:text-blue-300">
                          <FileText size={12} />
                        </span>
                        <span className="break-all text-xs font-medium text-slate-800 group-hover:text-blue-600 group-hover:underline dark:text-slate-100 dark:group-hover:text-blue-400">
                          {document.originalName}
                        </span>
                        <Eye size={12} className="ml-auto shrink-0 text-slate-400 opacity-0 transition group-hover:opacity-100 dark:text-slate-500" />
                      </button>
                    </td>

                    <td className="whitespace-nowrap border border-slate-200 px-4 py-2 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300">
                      {formatBytes(document.sizeBytes)}
                    </td>

                    <td className="whitespace-nowrap border border-slate-200 px-4 py-2 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300">
                      {document.uploadedLabel}
                    </td>

                    {canAssignDocs ? (
                      <td className="border border-slate-200 px-4 py-2 text-right dark:border-slate-700">
                        <div className="relative inline-flex items-center justify-end gap-3">
                          <div className="flex">
                            {renderAssignedBadges(document)}
                          </div>
                          <button
                            type="button"
                            onClick={() => openAssignmentModal(document)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border text-blue-700 transition hover:bg-blue-50 dark:border-slate-700 dark:text-blue-300 dark:hover:bg-blue-950/30"
                            aria-label="Assign document"
                            title="Assign"
                          >
                            <Plus size={14} />
                          </button>
                          <AnimatePresence>
                            {assignmentModal?.id === document.id ? renderAssignmentPopover() : null}
                          </AnimatePresence>
                        </div>
                      </td>
                    ) : null}

                    {canManageDocs ? (
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
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
                              >
                                <Trash2 size={13} />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3 + (canAssignDocs ? 1 : 0) + (canManageDocs ? 1 : 0)}
                    className="px-4 py-6 text-center text-xs muted"
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
        <div className="flex items-center justify-between px-1 text-xs">
          <p className="muted">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={!pagination.hasPrevPage}
              className="rounded-xl border bg-white/80 px-3 py-2 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900/60 dark:text-slate-200"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!pagination.hasNextPage}
              className="rounded-xl border bg-white/80 px-3 py-2 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900/60 dark:text-slate-200"
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
