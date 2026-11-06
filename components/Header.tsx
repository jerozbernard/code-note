import Link from "next/link";
import { logout } from "@/app/actions";

export function Header({ username }: { username: string | null }) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Code Notes
        </Link>
        {username ? (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-400">Signed in as {username}</span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-slate-700 px-3 py-1.5 hover:bg-slate-800"
              >
                Log out
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-sky-400"
          >
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}
