import { ArrowLeft, ExternalLink, FileText, Loader2, MessageSquare, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetDocumentViewQuery } from "../features/documents/documentsApiSlice";

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

const ChatPanel = () => (
  <div className="flex h-full flex-col">
    <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-3 py-2.5 dark:border-slate-800">
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
        <MessageSquare size={12} />
      </span>
      <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
        Document Q&amp;A
      </span>
      <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
        Coming soon
      </span>
    </div>

    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
        <MessageSquare size={20} className="text-slate-400 dark:text-slate-500" />
      </div>
      <div className="max-w-[220px]">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Ask anything about this document
        </p>
        <p className="mt-1.5 text-xs leading-[1.6] text-slate-500 dark:text-slate-400">
          Multimodal RAG is coming — query text, tables, and embedded visuals across PDFs, documents, and spreadsheets in a single conversation.
        </p>
      </div>
    </div>

    <div className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
        <span className="flex-1 select-none text-xs text-slate-400 dark:text-slate-500">
          Ask a question…
        </span>
        <button
          type="button"
          disabled
          className="inline-flex h-6 w-6 shrink-0 cursor-not-allowed items-center justify-center rounded-lg bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
          aria-label="Send (coming soon)"
        >
          <Send size={11} />
        </button>
      </div>
    </div>
  </div>
);

const DocumentViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
      return (
        <iframe
          title={document?.originalName || "Document preview"}
          src={viewUrl}
          className="h-full w-full bg-white"
        />
      );
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
      {/* Document panel — 60% on desktop */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/30 lg:flex-[3]">
        {/* Slim document header */}
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

        {/* Preview content */}
        <div className="min-h-0 flex-1 overflow-hidden">
          {renderPreview()}
        </div>
      </div>

      {/* Chat panel — 40% on desktop */}
      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/30 lg:flex-[2]">
        <ChatPanel />
      </div>
    </section>
  );
};

export default DocumentViewer;
