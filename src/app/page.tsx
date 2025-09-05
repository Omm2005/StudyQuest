import { auth, signOut } from "@/server/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Page() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const name =
    session.user?.name ?? session.user?.email ?? "User";

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Welcome, {name}</h1>
        <p className="text-sm text-muted-foreground">You are signed in.</p>

        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
          >
            Go to Home
          </Link>

          <form action={doSignOut}>
            <button
              type="submit"
              className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}