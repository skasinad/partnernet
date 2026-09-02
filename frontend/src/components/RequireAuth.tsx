"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/components/AuthProvider";
import { Spinner } from "@/components/ui/Button";

/**
 * Client-side gate for authenticated pages.
 *
 * `needsBusiness` additionally bounces users without a business profile to
 * /onboarding — every core feature depends on having one.
 */
export function RequireAuth({
  children,
  needsBusiness = true,
}: {
  children: React.ReactNode;
  needsBusiness?: boolean;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    } else if (needsBusiness && !user.has_business) {
      router.replace("/onboarding");
    }
  }, [user, loading, needsBusiness, router]);

  if (loading || !user || (needsBusiness && !user.has_business)) {
    return (
      <div className="container-page flex min-h-[50vh] items-center justify-center text-ink-faint">
        <Spinner className="text-forest-600" />
      </div>
    );
  }

  return <>{children}</>;
}
