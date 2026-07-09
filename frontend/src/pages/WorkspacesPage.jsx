import { AnimatePresence, motion } from 'framer-motion';
import { FileText, FolderOpen, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useCreateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useListWorkspacesQuery,
} from '../features/workspaces/workspacesApiSlice';

const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
};

const WorkspacesPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useListWorkspacesQuery();
  const [createWorkspace, { isLoading: isCreating }] = useCreateWorkspaceMutation();
  const [deleteWorkspace] = useDeleteWorkspaceMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [createError, setCreateError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const workspaces = data?.workspaces || [];

  const handleCreate = async () => {
    setCreateError('');
    try {
      const result = await createWorkspace({ title: title.trim() || 'Untitled Workspace' }).unwrap();
      setIsCreateOpen(false);
      setTitle('');
      navigate(`/workspaces/${result.workspace.id}`);
    } catch (err) {
      setCreateError(err?.data?.message || 'Failed to create workspace');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteWorkspace(id).unwrap();
      setConfirmDeleteId(null);
    } catch {
      // silently ignore
    }
  };

  return (
    <section className="space-y-5 px-3 pt-0 pb-6 md:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Workspaces</h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Research documents built from AI findings
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setTitle(''); setCreateError(''); setIsCreateOpen(true); }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500"
        >
          <Plus size={13} />
          New Workspace
        </button>
      </div>

      {/* State */}
      {isLoading ? (
        <div className="text-sm text-slate-500">Loading workspaces...</div>
      ) : isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          Failed to load workspaces.
        </div>
      ) : workspaces.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
          <FolderOpen size={32} className="text-slate-300 dark:text-slate-600" />
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No workspaces yet</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Create a workspace to start building research documents from AI findings.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setTitle(''); setCreateError(''); setIsCreateOpen(true); }}
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500"
          >
            <Plus size={13} />
            New Workspace
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              className="group relative flex cursor-pointer flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600"
              onClick={() => navigate(`/workspaces/${ws.id}`)}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                  <FileText size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {ws.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                    Updated {formatDate(ws.updatedAt)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(ws.id); }}
                className="absolute right-3 top-3 hidden rounded-md p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 group-hover:flex dark:hover:bg-rose-900/20"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {/* Create modal */}
        {isCreateOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCreateOpen(false)}
          >
            <motion.div
              className="w-full max-w-md rounded-xl border bg-white p-5 dark:bg-slate-900"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">New Workspace</h3>
                <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded border p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={13} />
                </button>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs text-slate-500">Title</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="e.g. Vendor Compliance Review"
                  autoFocus
                  className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700"
                />
              </label>
              {createError ? <p className="mt-2 text-xs text-red-600">{createError}</p> : null}
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {isCreating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}

        {/* Delete confirm */}
        {confirmDeleteId ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmDeleteId(null)}
          >
            <motion.div
              className="w-full max-w-sm rounded-xl border bg-white p-5 dark:bg-slate-900"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Delete workspace?</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This cannot be undone. All findings and notes will be lost.</p>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setConfirmDeleteId(null)} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(confirmDeleteId)}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-500"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
};

export default WorkspacesPage;
