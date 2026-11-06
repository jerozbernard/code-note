import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const username = await getSessionUser();
  if (username) {
    redirect("/");
  }

  return (
    <main className="flex min-h-full flex-col items-center justify-center px-6 py-16">
      <LoginForm />
      <Link href="/" className="mt-6 text-sm text-slate-400 hover:text-slate-200">
        Back to notes
      </Link>
    </main>
  );
}
