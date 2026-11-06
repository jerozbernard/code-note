import { Header } from "@/components/Header";
import { UploadForm } from "@/components/UploadForm";
import { CodeList } from "@/components/CodeList";
import { getSessionUser } from "@/lib/auth";
import { getCodesCollection, mongoErrorMessage } from "@/lib/mongodb";
import type { CodeNote } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const username = await getSessionUser();
  let notes: CodeNote[] = [];
  let dbError: string | null = null;

  try {
    const codes = await getCodesCollection();
    const docs = await codes.find().sort({ createdAt: -1 }).toArray();
    notes = docs.map((doc) => ({
      id: String(doc._id),
      title: String(doc.title ?? ""),
      code: String(doc.code ?? ""),
      author: String(doc.author ?? "unknown"),
      createdAt: new Date(doc.createdAt ?? Date.now()).toISOString(),
      updatedAt: new Date(doc.updatedAt ?? Date.now()).toISOString(),
    }));
  } catch (error) {
    dbError = mongoErrorMessage(error);
  }

  return (
    <div className="min-h-full">
      <Header username={username} />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
        <div>
          <h1 className="text-3xl font-semibold">Shared code notes</h1>
          <p className="mt-1 text-slate-400">
            {username
              ? "You can upload, edit, and delete notes."
              : "Viewing as a guest. Log in to upload, edit, or delete."}
          </p>
        </div>
        {dbError ? (
          <p className="rounded-md border border-amber-700 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
            {dbError}
          </p>
        ) : null}
        {username ? <UploadForm /> : null}
        <CodeList notes={notes} canEdit={Boolean(username)} />
      </main>
    </div>
  );
}
