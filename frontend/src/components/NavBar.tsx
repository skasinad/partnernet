"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { clsx } from "@/lib/clsx";
import { getRequestSummary, getUnreadCount } from "@/lib/queries";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/discover", label: "Discover" },
  { href: "/matches", label: "Matches" },
  { href: "/requests", label: "Requests" },
  { href: "/messages", label: "Messages" },
];

export function NavBar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [badges, setBadges] = useState({ requests: 0, messages: 0 });

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user?.has_business) return;
    let active = true;
    const load = async () => {
      try {
        const [summary, unread] = await Promise.all([
          getRequestSummary(),
          getUnreadCount(),
        ]);
        if (active)
          setBadges({
            requests: summary.incoming_pending,
            messages: unread.unread,
          });
      } catch {
        /* silent */
      }
    };
    load();
    const t = setInterval(load, 30_000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [user?.has_business, pathname]);

  const badgeFor = (href: string) =>
    href === "/requests"
      ? badges.requests
      : href === "/messages"
        ? badges.messages
        : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          {user && (
            <nav className="hidden items-center gap-1 md:flex">
              {LINKS.map((link) => {
                const active = pathname.startsWith(link.href);
                const count = badgeFor(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={clsx(
                      "relative rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-forest-50 text-forest-700"
                        : "text-ink-soft hover:text-ink",
                    )}
                  >
                    {link.label}
                    {count > 0 && (
                      <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-clay-400 px-1 text-[10px] font-semibold text-white">
                        {count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <span className="h-8 w-20 animate-pulse rounded-full bg-line" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2.5 text-sm hover:border-ink-faint"
              >
                <Avatar name={user.full_name || user.email} size="sm" />
                <span className="hidden max-w-[8rem] truncate sm:block">
                  {user.full_name || user.email.split("@")[0]}
                </span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lift">
                  <MenuItem href="/dashboard" label="Dashboard" />
                  <MenuItem href="/settings" label="Business & account" />
                  <div className="my-1 border-t border-line" />
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2 text-left text-sm text-ink-soft hover:bg-canvas"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-ink-soft hover:text-ink"
              >
                Log in
              </Link>
              <ButtonLink href="/register" size="sm">
                Get started
              </ButtonLink>
            </>
          )}
        </div>
      </div>

      {user && (
        <nav className="flex gap-1 overflow-x-auto border-t border-line px-4 py-2 md:hidden">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-sm",
                  active
                    ? "bg-forest-50 text-forest-700"
                    : "text-ink-soft",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}

function MenuItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block px-4 py-2 text-sm text-ink hover:bg-canvas"
    >
      {label}
    </Link>
  );
}
