import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  ArrowLeft,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Redo,
  Undo,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useGetWorkspaceQuery,
  useUpdateWorkspaceMutation,
} from '../features/workspaces/workspacesApiSlice';

// ─── Toolbar ──────────────────────────────────────────────────────────────────

const ToolbarBtn = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`flex h-7 min-w-[28px] items-center justify-center rounded-md px-1.5 text-xs font-semibold transition ${
      active
        ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
    } disabled:pointer-events-none disabled:opacity-30`}
  >
    {children}
  </button>
);

const Sep = () => <div className="h-5 w-px shrink-0 bg-slate-200 dark:bg-slate-700" />;

const Toolbar = ({ editor }) => {
  if (!editor) return null;
  return (
    <div className="flex shrink-0 items-center justify-center gap-0.5 border-b border-slate-200 bg-white px-4 py-1.5 dark:border-slate-800 dark:bg-slate-900">
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading3 size={14} />
      </ToolbarBtn>
      <Sep />
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold"
      >
        <Bold size={13} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic"
      >
        <Italic size={13} />
      </ToolbarBtn>
      <Sep />
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet list"
      >
        <List size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Numbered list"
      >
        <ListOrdered size={14} />
      </ToolbarBtn>
      <Sep />
      <ToolbarBtn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Divider"
      >
        <Minus size={14} />
      </ToolbarBtn>
      <Sep />
      <ToolbarBtn
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo size={13} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo size={13} />
      </ToolbarBtn>
    </div>
  );
};

// ─── WorkspaceEditor ──────────────────────────────────────────────────────────

const SAVE_DEBOUNCE_MS = 1500;

const WorkspaceEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetWorkspaceQuery(id, { skip: !id });
  const [updateWorkspace] = useUpdateWorkspaceMutation();

  const [title, setTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved');
  const contentSaveTimer = useRef(null);
  const titleSaveTimer = useRef(null);
  const editorInitialized = useRef(false);

  const workspace = data?.workspace;

  useEffect(() => {
    if (workspace?.title && !editorInitialized.current) {
      setTitle(workspace.title);
    }
  }, [workspace?.title]);

  const saveContent = useCallback(
    async (json) => {
      setSaveStatus('saving');
      try {
        await updateWorkspace({ id, content: json }).unwrap();
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    },
    [id, updateWorkspace]
  );

  const saveTitle = useCallback(
    async (value) => {
      try {
        await updateWorkspace({ id, title: value }).unwrap();
      } catch {
        // silently ignore
      }
    },
    [id, updateWorkspace]
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content: workspace?.content || { type: 'doc', content: [] },
    editorProps: {
      attributes: { class: 'workspace-prose outline-none min-h-[60vh]' },
    },
    onUpdate: ({ editor }) => {
      setSaveStatus('unsaved');
      clearTimeout(contentSaveTimer.current);
      contentSaveTimer.current = setTimeout(
        () => saveContent(editor.getJSON()),
        SAVE_DEBOUNCE_MS
      );
    },
  });

  // Load content once workspace data arrives
  useEffect(() => {
    if (editor && workspace?.content && !editorInitialized.current) {
      editor.commands.setContent(workspace.content);
      editorInitialized.current = true;
    }
  }, [editor, workspace?.content]);

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setTitle(value);
    clearTimeout(titleSaveTimer.current);
    titleSaveTimer.current = setTimeout(() => saveTitle(value), 600);
  };

  if (isLoading) {
    return (
      <section className="flex h-[calc(100vh-116px)] items-center justify-center">
        <div className="inline-flex items-center gap-2 text-xs text-slate-500">
          <Loader2 size={14} className="animate-spin" />
          Opening workspace…
        </div>
      </section>
    );
  }

  if (isError || !workspace) {
    return (
      <section className="flex h-[calc(100vh-116px)] items-center justify-center p-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          Workspace not found or access denied.
        </div>
      </section>
    );
  }

  return (
    <>
      <style>{`
        .workspace-prose h1 { font-size: 1.6rem; font-weight: 700; margin: 1.25rem 0 0.5rem; line-height: 1.25; }
        .workspace-prose h2 { font-size: 1.2rem; font-weight: 700; margin: 1rem 0 0.4rem; }
        .workspace-prose h3 { font-size: 1rem; font-weight: 600; margin: 0.75rem 0 0.3rem; }
        .workspace-prose p  { font-size: 0.875rem; line-height: 1.75; margin: 0.2rem 0; }
        .workspace-prose ul { list-style-type: disc;     padding-left: 1.4rem; margin: 0.5rem 0; }
        .workspace-prose ol { list-style-type: decimal;  padding-left: 1.4rem; margin: 0.5rem 0; }
        .workspace-prose li { font-size: 0.875rem; line-height: 1.6; margin: 0.15rem 0; }
        .workspace-prose strong { font-weight: 700; }
        .workspace-prose em    { font-style: italic; }
        .workspace-prose hr { border: none; border-top: 1px solid #e2e8f0; margin: 1.5rem 0; }
        .dark .workspace-prose hr { border-top-color: #334155; }
      `}</style>

      <section className="flex h-[calc(100vh-116px)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/20">
        {/* Top bar */}
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-2 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/workspaces')}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={13} />
          </button>

          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Workspace"
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none dark:text-slate-100 dark:placeholder-slate-600"
          />

          <span
            className={`shrink-0 text-[11px] font-medium ${
              saveStatus === 'saving'  ? 'text-slate-400' :
              saveStatus === 'error'   ? 'text-rose-500'  :
              saveStatus === 'unsaved' ? 'text-amber-500' :
                                         'text-emerald-500'
            }`}
          >
            {saveStatus === 'saving'  ? 'Saving…'       :
             saveStatus === 'error'   ? 'Error saving'  :
             saveStatus === 'unsaved' ? 'Unsaved'       : 'Saved'}
          </span>
        </div>

        {/* Centered toolbar */}
        <Toolbar editor={editor} />

        {/* Editor body */}
        <div className="flex-1 overflow-y-auto px-8 py-8 text-slate-800 dark:text-slate-200 md:px-16 lg:px-24">
          <div className="mx-auto max-w-3xl">
            <EditorContent editor={editor} />
          </div>
        </div>
      </section>
    </>
  );
};

export default WorkspaceEditor;
