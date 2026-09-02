import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-xs text-sm text-ink-faint">
            Partnership matchmaking for independent businesses that share a
            customer, not a competitor.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
          <Link href="/discover" className="hover:text-ink">
            Discover
          </Link>
          <Link href="/register" className="hover:text-ink">
            Create a profile
          </Link>
          <Link href="/login" className="hover:text-ink">
            Log in
          </Link>
        </div>
      </div>
      <div className="border-t border-line py-4">
        <p className="container-page text-xs text-ink-faint">
          © {new Date().getFullYear()} Partnernet. A demo project.
        </p>
      </div>
    </footer>
  );
}
