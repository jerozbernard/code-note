import { getSessionUser } from "@/lib/auth";
import { mongoErrorMessage } from "@/connection/db";
import type { CodeDocument } from "@/models/Code";

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function fail(error: unknown, status = 500) {
  return json({ error: mongoErrorMessage(error) }, status);
}

export async function requireApiUser() {
  const username = await getSessionUser();
  if (!username) {
    return { username: null, response: json({ error: "You must be logged in" }, 401) };
  }
  return { username, response: null };
}

export function serializeCode(doc: CodeDocument) {
  return {
    id: String(doc._id),
    title: doc.title,
    code: doc.code,
    author: doc.author,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}
