import { auth } from "@/lib/auth";
import Link from "next/link";
import { LogoutButton } from "./logout-button";

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="bg-white border-b border-amber-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold text-amber-800 flex items-center gap-2"
        >
          🏷️ Brocante
        </Link>
        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <span className="text-sm text-gray-600 hidden sm:block">
                {session.user.name}
              </span>
              {session.user.role === "ADMIN" && (
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                  Admin
                </span>
              )}
              <Link
                href="/dashboard"
                className="text-sm font-medium text-amber-700 hover:text-amber-800"
              >
                Tableau de bord
              </Link>
              {session.user.role === "ADMIN" && (
                <Link
                  href="/admin/events"
                  className="text-sm font-medium text-amber-700 hover:text-amber-800"
                >
                  Administration
                </Link>
              )}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-amber-700"
              >
                Se connecter
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
              >
                S&apos;inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
