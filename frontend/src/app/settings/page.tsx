"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import { BusinessForm } from "@/components/BusinessForm";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import { getMyBusiness, updateMyBusiness } from "@/lib/queries";
import type { Business } from "@/lib/types";

function AccountSection() {
  const { user, refresh } = useAuth();
  const { notify } = useToast();
  const [name, setName] = useState(user?.full_name ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
          await apiFetch("/api/auth/me/", {
            method: "PATCH",
            body: { full_name: name.trim() },
          });
          await refresh();
          notify("Account updated.", "success");
        } catch {
          notify("Couldn’t update account.", "error");
        } finally {
          setSaving(false);
        }
      }}
      className="card p-6"
    >
      <h2 className="text-lg">Account</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Name</label>
          <input
            className="field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Email</label>
          <input className="field-input" value={user?.email} disabled />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="submit" size="sm" loading={saving}>
          Save account
        </Button>
      </div>
    </form>
  );
}

function Settings() {
  const { notify } = useToast();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyBusiness()
      .then(setBusiness)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container-page max-w-3xl py-10">
      <span className="eyebrow">Settings</span>
      <h1 className="mt-2 text-3xl">Business & account</h1>

      <div className="mt-8 space-y-8">
        <AccountSection />

        <div>
          <h2 className="mb-4 text-lg">Business profile</h2>
          {loading ? (
            <div className="h-96 animate-pulse rounded-card bg-line/60" />
          ) : business ? (
            <BusinessForm
              initial={business}
              submitLabel="Save changes"
              onSubmit={async (payload) => {
                const updated = await updateMyBusiness(payload);
                setBusiness(updated);
                notify("Profile saved.", "success");
              }}
            />
          ) : (
            <p className="text-sm text-ink-soft">
              No business profile found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <Settings />
    </RequireAuth>
  );
}
