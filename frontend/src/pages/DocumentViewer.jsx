import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  BookmarkPlus,
  Check,
  ExternalLink,
  FileText,
  FolderOpen,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Document, Page, pdfjs } from "react-pdf";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useNavigate, useParams } from "react-router-dom";
import { useGetDocumentViewQuery } from "../features/documents/documentsApiSlice";
import {
  useAppendFindingMutation,
  useCreateWorkspaceMutation,
  useListWorkspacesQuery,
} from "../features/workspaces/workspacesApiSlice";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// ─── helpers ────────────────────────────────────────────────────────────────

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const isPDF = (mimeType = "") => mimeType.toLowerCase() === "application/pdf";

const isTextFile = (mimeType = "", extension = "") =>
  mimeType.toLowerCase().startsWith("text/") ||
  [".txt", ".md", ".csv"].includes(extension.toLowerCase());

// ─── TextPreview ─────────────────────────────────────────────────────────────

const TextPreview = ({ url }) => {
  const [content, setContent] = useState(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setContent(null);
    setFetchError(false);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.text();
      })
      .then((text) => {
        if (!cancelled) setContent(text);
      })
      .catch(() => {
        if (!cancelled) setFetchError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (fetchError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-xs text-rose-600 dark:text-rose-300">Failed to load file content.</p>
      </div>
    );
  }

  if (content === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Loader2 size={14} className="animate-spin" />
          Loading content...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <pre className="min-h-full whitespace-pre-wrap break-words p-5 font-mono text-xs leading-5 text-slate-800 dark:text-slate-200">
        {content}
      </pre>
    </div>
  );
};

// ─── HighlightLayer ───────────────────────────────────────────────────────────

const HIGHLIGHT_COLORS = [
  { bg: "rgba(253, 224, 71, 0.35)",  border: "rgba(234, 179,   8, 0.75)" },
  { bg: "rgba(134, 239, 172, 0.35)", border: "rgba( 34, 197,  94, 0.75)" },
  { bg: "rgba(147, 197, 253, 0.35)", border: "rgba( 59, 130, 246, 0.75)" },
  { bg: "rgba(249, 168, 212, 0.35)", border: "rgba(236,  72, 153, 0.75)" },
  { bg: "rgba(196, 181, 253, 0.35)", border: "rgba(139,  92, 246, 0.75)" },
  { bg: "rgba(253, 186, 116, 0.35)", border: "rgba(249, 115,  22, 0.75)" },
];

const CATEGORY_STYLES = {
  Title:          "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  NarrativeText:  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  Table:          "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  ListItem:       "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  List:           "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  Header:         "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  Footer:         "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  Image:          "bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300",
  Figure:         "bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300",
  FigureCaption:  "bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300",
};

const HighlightLayer = ({ chunks, pageNumber }) => {
  const pageChunks = chunks.filter(
    (c) => c.page_number === pageNumber && c.coordinates?.points?.length >= 3
  );
  if (!pageChunks.length) return null;

  return (
    <>
      {pageChunks.map((chunk, idx) => {
        const { points, layout_width, layout_height } = chunk.coordinates;
        if (!layout_width || !layout_height) return null;

        const xs = points.map((p) => p[0]);
        const ys = points.map((p) => p[1]);
        const xMin = Math.min(...xs);
        const yMin = Math.min(...ys);
        const xMax = Math.max(...xs);
        const yMax = Math.max(...ys);

        const left = (xMin / layout_width) * 100;
        const top = (yMin / layout_height) * 100;
        const width = ((xMax - xMin) / layout_width) * 100;
        const height = ((yMax - yMin) / layout_height) * 100;

        const color = HIGHLIGHT_COLORS[chunk._colorIndex ?? idx % HIGHLIGHT_COLORS.length];
        const label = (chunk._colorIndex ?? idx) + 1;

        return (
          <div
            key={idx}
            title={chunk.text}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: `${top}%`,
              width: `${width}%`,
              height: `${height}%`,
              backgroundColor: color.bg,
              border: `1.5px solid ${color.border}`,
              borderRadius: "2px",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -10,
                left: 0,
                backgroundColor: color.border,
                color: "#fff",
                fontSize: 9,
                fontWeight: 700,
                padding: "1px 5px",
                borderRadius: "3px 3px 3px 0",
                lineHeight: "14px",
                whiteSpace: "nowrap",
                letterSpacing: "0.02em",
              }}
            >
              {label}
            </div>
          </div>
        );
      })}
    </>
  );
};

// ─── PdfViewer ────────────────────────────────────────────────────────────────

const PdfViewer = ({ url, highlights }) => {
  const [numPages, setNumPages] = useState(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const containerRef = useRef(null);
  const pageRefs = useRef({});

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!highlights.length) return;
    const pages = [...new Set(highlights.map((h) => h.page_number).filter(Boolean))];
    if (!pages.length) return;
    const firstPage = Math.min(...pages);
    pageRefs.current[firstPage]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [highlights]);

  return (
    <div ref={containerRef} className="h-full w-full overflow-y-auto bg-slate-100 p-2 dark:bg-slate-900">
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={
          <div className="flex h-32 items-center justify-center">
            <Loader2 size={16} className="animate-spin text-slate-400" />
          </div>
        }
        error={
          <div className="p-4 text-center text-xs text-rose-500">Failed to load PDF.</div>
        }
      >
        {Array.from({ length: numPages || 0 }, (_, i) => i + 1).map((pageNum) => (
          <div
            key={pageNum}
            ref={(el) => { pageRefs.current[pageNum] = el; }}
            className="relative mb-2"
          >
            <Page
              pageNumber={pageNum}
              width={Math.max(containerWidth - 16, 100)}
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
            <HighlightLayer chunks={highlights} pageNumber={pageNum} />
          </div>
        ))}
      </Document>
    </div>
  );
};

// ─── SaveToWorkspaceModal ─────────────────────────────────────────────────────

const SaveToWorkspaceModal = ({ finding, onClose }) => {
  const { data: wsData, isLoading: isLoadingWs } = useListWorkspacesQuery();
  const [appendFinding, { isLoading: isSaving }] = useAppendFindingMutation();
  const [createWorkspace, { isLoading: isCreating }] = useCreateWorkspaceMutation();
  const [selectedId, setSelectedId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [mode, setMode] = useState('pick'); // 'pick' | 'create'
  const [savedId, setSavedId] = useState(null);
  const navigate = useNavigate();

  const workspaces = wsData?.workspaces || [];

  const handleSave = async () => {
    if (mode === 'create') {
      const result = await createWorkspace({ title: newTitle.trim() || 'Untitled Workspace' }).unwrap();
      const wsId = result.workspace.id;
      await appendFinding({ workspaceId: wsId, ...finding }).unwrap();
      setSavedId(wsId);
    } else {
      if (!selectedId) return;
      await appendFinding({ workspaceId: selectedId, ...finding }).unwrap();
      setSavedId(selectedId);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-sm rounded-xl border bg-white p-4 dark:bg-slate-900"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {savedId ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
              <Check size={18} />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Finding saved!</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate(`/workspaces/${savedId}`)}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
              >
                Open workspace
              </button>
              <button type="button" onClick={onClose} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800">
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Save to Workspace</h3>
              <button type="button" onClick={onClose} className="rounded border p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={13} />
              </button>
            </div>

            {/* Mode toggle */}
            <div className="mb-3 flex rounded-lg border p-0.5 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setMode('pick')}
                className={`flex-1 rounded-md py-1 text-xs font-medium transition ${mode === 'pick' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                Existing
              </button>
              <button
                type="button"
                onClick={() => setMode('create')}
                className={`flex-1 rounded-md py-1 text-xs font-medium transition ${mode === 'create' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                New workspace
              </button>
            </div>

            {mode === 'pick' ? (
              isLoadingWs ? (
                <div className="flex items-center gap-2 py-4 text-xs text-slate-400">
                  <Loader2 size={12} className="animate-spin" /> Loading…
                </div>
              ) : workspaces.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <FolderOpen size={22} className="text-slate-300" />
                  <p className="text-xs text-slate-500">No workspaces yet.</p>
                  <button type="button" onClick={() => setMode('create')} className="text-xs text-violet-600 hover:underline">
                    Create one
                  </button>
                </div>
              ) : (
                <div className="max-h-44 space-y-1 overflow-y-auto">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => setSelectedId(ws.id)}
                      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ${
                        selectedId === ws.id
                          ? 'border-violet-400 bg-violet-50 text-violet-800 dark:border-violet-700 dark:bg-violet-950/30 dark:text-violet-200'
                          : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <FileText size={12} className="shrink-0 text-slate-400" />
                      <span className="truncate font-medium">{ws.title}</span>
                    </button>
                  ))}
                </div>
              )
            ) : (
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Workspace title…"
                autoFocus
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-violet-500 dark:border-slate-700"
              />
            )}

            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isCreating || (mode === 'pick' && !selectedId)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50"
              >
                <Plus size={12} />
                {isSaving || isCreating ? 'Saving…' : 'Save finding'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

// ─── ChatPanel ────────────────────────────────────────────────────────────────

const ChatPanel = ({ documentId, documentName, onHighlights }) => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingFinding, setSavingFinding] = useState(null);
  const messagesEndRef = useRef(null);
  const chunkCounterRef = useRef(0);
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!query.trim() || loading) return;
    const userMsg = query.trim();
    setQuery("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/documents/${documentId}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ query: userMsg }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const taggedChunks = (data.chunks || []).map((c, i) => ({
        ...c,
        _colorIndex: (chunkCounterRef.current + i) % HIGHLIGHT_COLORS.length,
      }));
      chunkCounterRef.current += taggedChunks.length;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, chunks: taggedChunks, userQuery: userMsg },
      ]);
      if (taggedChunks.length) onHighlights(taggedChunks);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${e.message}`, isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-3 py-2.5 dark:border-slate-800">
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
          <MessageSquare size={12} />
        </span>
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
          Document Q&amp;A
        </span>
        <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
          RAG
        </span>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
              <MessageSquare size={20} className="text-slate-400 dark:text-slate-500" />
            </div>
            <div className="max-w-[220px]">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Ask anything about this document
              </p>
              <p className="mt-1.5 text-xs leading-[1.6] text-slate-500 dark:text-slate-400">
                Relevant sections will be highlighted directly on the PDF.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-violet-600 text-white"
                  : msg.isError
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                  : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              {msg.role === "user" || msg.isError ? (
                msg.content
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="mb-1 text-sm font-bold">{children}</h1>,
                    h2: ({ children }) => <h2 className="mb-1 text-xs font-bold">{children}</h2>,
                    h3: ({ children }) => <h3 className="mb-0.5 text-xs font-semibold">{children}</h3>,
                    p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="mb-1 ml-3 list-disc space-y-0.5">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-1 ml-3 list-decimal space-y-0.5">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    code: ({ inline, children }) =>
                      inline ? (
                        <code className="rounded bg-slate-200 px-1 py-px font-mono text-[10px] dark:bg-slate-700">{children}</code>
                      ) : (
                        <pre className="my-1 overflow-x-auto rounded bg-slate-200 p-2 font-mono text-[10px] dark:bg-slate-700">
                          <code>{children}</code>
                        </pre>
                      ),
                    table: ({ children }) => (
                      <div className="my-1 overflow-x-auto">
                        <table className="w-full border-collapse text-[10px]">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => <th className="border border-slate-300 bg-slate-200 px-2 py-1 text-left font-semibold dark:border-slate-600 dark:bg-slate-700">{children}</th>,
                    td: ({ children }) => <td className="border border-slate-300 px-2 py-1 dark:border-slate-600">{children}</td>,
                    a: ({ href, children }) => <a href={href} className="text-violet-600 underline dark:text-violet-400" target="_blank" rel="noreferrer">{children}</a>,
                    blockquote: ({ children }) => <blockquote className="my-1 border-l-2 border-slate-400 pl-2 italic text-slate-500 dark:border-slate-500 dark:text-slate-400">{children}</blockquote>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>

            {/* Source chunks */}
            {msg.chunks?.length > 0 && (
              <div className="mt-0.5 flex w-full flex-col gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Sources
                </span>
                {msg.chunks.map((chunk, cidx) => {
                  const color = HIGHLIGHT_COLORS[chunk._colorIndex ?? cidx % HIGHLIGHT_COLORS.length];
                  const label = (chunk._colorIndex ?? cidx) + 1;
                  const catStyle = CATEGORY_STYLES[chunk.category] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
                  return (
                    <button
                      key={cidx}
                      type="button"
                      onClick={() => onHighlights([chunk])}
                      className="w-full cursor-pointer rounded-lg px-2.5 py-1.5 text-left transition hover:opacity-80"
                      style={{ background: color.bg, border: `1.5px solid ${color.border}` }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white"
                          style={{ backgroundColor: color.border }}
                        >
                          {label}
                        </span>
                        <BookOpen size={10} className="shrink-0 text-slate-600 dark:text-slate-300" />
                        <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                          Page {chunk.page_number ?? "?"}
                        </span>
                        <div className="ml-auto flex items-center gap-1">
                          {chunk.score != null && (
                            <span className="rounded bg-slate-800/10 px-1 py-px text-[9px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                              {chunk.score}% match
                            </span>
                          )}
                          {chunk.category && (
                            <span className={`rounded px-1.5 py-px text-[9px] font-semibold ${catStyle}`}>
                              {chunk.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[10px] leading-[1.5] text-slate-600 dark:text-slate-400">
                        {chunk.text}
                      </p>
                    </button>
                  );
                })}

                {/* Save to Workspace */}
                <button
                  type="button"
                  onClick={() =>
                    setSavingFinding({
                      query: msg.userQuery || '',
                      answer: msg.content,
                      sources: msg.chunks.map((c) => ({ text: c.text, page: c.page_number })),
                      documentId,
                      documentName: documentName || '',
                    })
                  }
                  className="mt-0.5 inline-flex w-fit items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700 transition hover:bg-violet-100 dark:border-violet-900/40 dark:bg-violet-950/20 dark:text-violet-400 dark:hover:bg-violet-900/30"
                >
                  <BookmarkPlus size={11} />
                  Save to Workspace
                </button>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 size={12} className="animate-spin" />
            Thinking…
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition focus-within:border-violet-400 dark:border-slate-700 dark:bg-slate-800/50 dark:focus-within:border-violet-600">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question…"
            disabled={loading}
            className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none dark:text-slate-200 dark:placeholder-slate-500"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!query.trim() || loading}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send"
          >
            <Send size={11} />
          </button>
        </div>
      </div>

      {/* Save to Workspace modal */}
      <AnimatePresence>
        {savingFinding ? (
          <SaveToWorkspaceModal
            finding={savingFinding}
            onClose={() => setSavingFinding(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
};

// ─── DocumentViewer ───────────────────────────────────────────────────────────

const DocumentViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [highlights, setHighlights] = useState([]);

  const { data, isLoading, isError, error, refetch } = useGetDocumentViewQuery(
    { id },
    { skip: !id }
  );

  const document = data?.document;
  const viewUrl = data?.view?.url;

  if (isLoading) {
    return (
      <section className="flex h-[calc(100vh-116px)] items-center justify-center p-1">
        <div className="inline-flex items-center gap-2 rounded-xl border bg-white/90 px-4 py-3 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
          <Loader2 size={14} className="animate-spin" />
          Loading document...
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex h-[calc(100vh-116px)] items-center justify-center p-1">
        <div className="max-w-md rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          <p className="font-semibold">{error?.data?.message || "Unable to open document."}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-3 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-500"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  const renderPreview = () => {
    if (!viewUrl) return null;

    if (isPDF(document?.mimeType)) {
      return <PdfViewer url={viewUrl} highlights={highlights} />;
    }

    if (isTextFile(document?.mimeType, document?.extension)) {
      return <TextPreview url={viewUrl} />;
    }

    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div className="max-w-xs">
          <FileText className="mx-auto text-slate-400" size={32} />
          <h2 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Preview not available for {document?.extension?.toUpperCase() || "this file type"}.
          </h2>
          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Download the document to view it locally.
          </p>
          <a
            href={viewUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
          >
            <ExternalLink size={13} />
            Open Document
          </a>
        </div>
      </div>
    );
  };

  return (
    <section className="flex h-[calc(100vh-116px)] flex-col gap-2 overflow-hidden p-1 lg:flex-row">
      {/* Document panel */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/30 lg:flex-[3]">
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Go back"
          >
            <ArrowLeft size={14} />
          </button>
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <FileText size={12} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
              {document?.originalName || "Document"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
            <span>{formatBytes(document?.sizeBytes)}</span>
            {document?.extension && (
              <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono font-medium uppercase dark:border-slate-700 dark:bg-slate-800">
                {document.extension.replace(".", "")}
              </span>
            )}
            <span className="hidden sm:inline">
              {formatDate(document?.uploadedAt || document?.createdAt)}
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">{renderPreview()}</div>
      </div>

      {/* Chat panel */}
      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/30 lg:flex-[2]">
        <ChatPanel
          documentId={id}
          documentName={document?.originalName}
          onHighlights={setHighlights}
        />
      </div>
    </section>
  );
};

export default DocumentViewer;
