"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/components/AuthProvider";
import { BusinessForm } from "@/components/BusinessForm";
import { RequireAuth } from "@/components/RequireAuth";
import { useToast } from "@/components/ui/Toast";
import { createBusiness } from "@/lib/queries";

function Onboarding() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const { notify } = useToast();

  useEffect(() => {
    if (user?.has_business) router.replace("/dashboard");
  }, [user?.has_business, router]);

  return (
    <div className="container-page max-w-3xl py-12">
      <span className="eyebrow">Step 2 of 2</span>
      <h1 className="mt-3 text-3xl">Tell us about your business</h1>
      <p className="mt-2 max-w-xl text-ink-soft">
        This becomes your public profile and everything we match on. You can
        edit any of it later from Settings.
      </p>

      <div className="mt-10">
        <BusinessForm
          submitLabel="Create profile & see matches"
          onSubmit={async (payload) => {
            await createBusiness(payload);
            await refresh();
            notify("Profile created. Here are your matches.", "success");
            router.push("/matches");
          }}
        />
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <RequireAuth needsBusiness={false}>
      <Onboarding />
    </RequireAuth>
  );
}
