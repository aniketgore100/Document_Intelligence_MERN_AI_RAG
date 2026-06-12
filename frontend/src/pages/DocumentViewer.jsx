import { ArrowLeft, Download, ExternalLink, FileText, Loader2 } from "lucide-react";
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
      <div className="flex min-h-[62vh] items-center justify-center p-6">
        <p className="text-xs text-rose-600 dark:text-rose-300">Failed to load file content.</p>
      </div>
    );
  }

  if (content === null) {
    return (
      <div className="flex min-h-[62vh] items-center justify-center">
        <div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Loader2 size={14} className="animate-spin" />
          Loading content...
        </div>
      </div>
    );
  }

  return (
    <pre className="h-full min-h-[62vh] overflow-auto whitespace-pre-wrap break-words p-5 font-mono text-xs leading-5 text-slate-800 dark:text-slate-200">
      {content}
    </pre>
  );
};

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
      <section className="flex min-h-[58vh] items-center justify-center p-1">
        <div className="inline-flex items-center gap-2 rounded-xl border bg-white/90 px-4 py-3 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
          <Loader2 size={14} className="animate-spin" />
          Loading document...
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex min-h-[58vh] items-center justify-center p-1">
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
          className="h-full min-h-[62vh] w-full bg-white"
        />
      );
    }

    if (isTextFile(document?.mimeType, document?.extension)) {
      return <TextPreview url={viewUrl} />;
    }

    return (
      <div className="flex min-h-[62vh] items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <FileText className="mx-auto text-slate-400" size={34} />
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
            <ExternalLink size={14} />
            Open Document
          </a>
        </div>
      </div>
    );
  };

  return (
    <section className="flex h-full min-h-[calc(100vh-116px)] flex-col gap-3 p-1">
      <div className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Go back"
            >
              <ArrowLeft size={15} />
            </button>
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              <FileText size={15} />
            </span>
            <div className="min-w-0">
              <h1 className="break-all text-sm font-semibold text-slate-950 dark:text-slate-100">
                {document?.originalName || "Document"}
              </h1>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span>{formatBytes(document?.sizeBytes)}</span>
                <span>{document?.extension?.toUpperCase() || "FILE"}</span>
                <span>Uploaded {formatDate(document?.uploadedAt || document?.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <a
              href={viewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ExternalLink size={14} />
              Open
            </a>
            <a
              href={viewUrl}
              download={document?.originalName}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
            >
              <Download size={14} />
              Download
            </a>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
        {renderPreview()}
      </div>
    </section>
  );
};

export default DocumentViewer;
