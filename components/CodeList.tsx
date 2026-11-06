"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { deleteCode, updateCode } from "@/app/actions";
import type { CodeNote } from "@/lib/types";

const emptySubscribe = () => () => {};

function FormattedDate({ dateString }: { dateString: string }) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  return (
    <time dateTime={dateString} suppressHydrationWarning>
      {isClient
        ? new Date(dateString).toLocaleString()
        : dateString.replace("T", " ").slice(0, 16)}
    </time>
  );
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = code;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code to clipboard:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied to clipboard" : "Copy code to clipboard"}
      title={copied ? "Copied!" : "Copy code"}
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/90 px-2.5 py-1 text-xs font-medium text-slate-300 shadow-sm transition hover:border-slate-600 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
    >
      {copied ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 text-emerald-400"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-emerald-400">Copied!</span>
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 text-slate-400"
          >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

function EditForm({
  note,
  onCancel,
  onSaveSuccess,
}: {
  note: CodeNote;
  onCancel: () => void;
  onSaveSuccess: (updated: { title: string; code: string }) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await updateCode({}, formData);
      if (res?.error) {
        setError(res.error);
        setPending(false);
        return;
      }

      onSaveSuccess({
        title: String(formData.get("title") ?? "").trim(),
        code: String(formData.get("code") ?? "").trim(),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update note");
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input type="hidden" name="id" value={note.id} />
      <input
        name="title"
        defaultValue={note.title}
        className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        required
      />
      <textarea
        name="code"
        defaultValue={note.code}
        rows={8}
        className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        required
      />
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function NoteCard({ note, canEdit }: { note: CodeNote; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const [updatedData, setUpdatedData] = useState<{ title: string; code: string } | null>(null);
  const [prevNote, setPrevNote] = useState(note);

  if (note !== prevNote) {
    setPrevNote(note);
    setUpdatedData(null);
  }

  const title = updatedData?.title ?? note.title;
  const code = updatedData?.code ?? note.code;

  const handleSaveSuccess = (updated: { title: string; code: string }) => {
    setUpdatedData(updated);
    setEditing(false);
  };

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      {editing ? (
        <EditForm
          note={{ ...note, title, code }}
          onCancel={() => setEditing(false)}
          onSaveSuccess={handleSaveSuccess}
        />
      ) : (
        <>
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-xs text-slate-400">
                by {note.author} · <FormattedDate dateString={note.createdAt} />
              </p>
            </div>
            {canEdit ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-md border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800"
                >
                  Edit
                </button>
                <form action={deleteCode}>
                  <input type="hidden" name="id" value={note.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-rose-700 px-3 py-1.5 text-sm text-rose-300 hover:bg-rose-950"
                  >
                    Delete
                  </button>
                </form>
              </div>
            ) : null}
          </div>
          <div className="relative">
            <div className="absolute right-3 top-3 z-10">
              <CopyButton code={code} />
            </div>
            <pre className="overflow-x-auto rounded-md bg-slate-950 p-4 pr-24 font-mono text-sm text-slate-200">
              <code>{code}</code>
            </pre>
          </div>
        </>
      )}
    </article>
  );
}

export function CodeList({
  notes,
  canEdit,
}: {
  notes: CodeNote[];
  canEdit: boolean;
}) {
  if (notes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-400">
        No code notes yet. {canEdit ? "Upload the first one above." : "Log in to upload."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} canEdit={canEdit} />
      ))}
    </div>
  );
}
