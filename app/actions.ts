"use server";

import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, getSessionUser, setSessionUser } from "@/lib/auth";
import {
  getCodesCollection,
  getUsersCollection,
  mongoErrorMessage,
} from "@/lib/mongodb";
import type { ActionState } from "@/lib/types";

async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("You must be logged in to do that");
  }
  return user;
}

export async function login(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Username and password are required" };
  }

  try {
    const users = await getUsersCollection();
    const user = await users.findOne({ username });
    if (!user?.password || !(await bcrypt.compare(password, String(user.password)))) {
      return { error: "Invalid username or password" };
    }
  } catch (error) {
    return { error: mongoErrorMessage(error) };
  }

  await setSessionUser(username);
  redirect("/");
}

export async function logout() {
  await clearSession();
  redirect("/");
}

export async function createCode(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let author: string;
  try {
    author = await requireUser();
  } catch (error) {
    return { error: error instanceof Error ? error.message : "You must be logged in to do that" };
  }
  const title = String(formData.get("title") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();

  if (!title || !code) {
    return { error: "Title and code are required" };
  }

  try {
    const now = new Date();
    const codes = await getCodesCollection();
    await codes.insertOne({
      title,
      code,
      author,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    return { error: mongoErrorMessage(error) };
  }

  revalidatePath("/");
  return { success: "Code uploaded" };
}

export async function updateCode(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireUser();
  } catch (error) {
    return { error: error instanceof Error ? error.message : "You must be logged in to do that" };
  }

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();

  if (!id || !ObjectId.isValid(id)) {
    return { error: "Invalid note id" };
  }
  if (!title || !code) {
    return { error: "Title and code are required" };
  }

  try {
    const codes = await getCodesCollection();
    const result = await codes.updateOne(
      { _id: new ObjectId(id) },
      { $set: { title, code, updatedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      return { error: "Note not found" };
    }
  } catch (error) {
    return { error: mongoErrorMessage(error) };
  }

  revalidatePath("/");
  return { success: "Code updated" };
}

export async function deleteCode(formData: FormData) {
  try {
    await requireUser();
    const id = String(formData.get("id") ?? "").trim();
    if (!id || !ObjectId.isValid(id)) {
      return;
    }

    const codes = await getCodesCollection();
    await codes.deleteOne({ _id: new ObjectId(id) });
    revalidatePath("/");
  } catch (error) {
    console.error("Delete error:", error);
  }
}
