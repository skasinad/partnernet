import { apiFetch } from "./api";
import type {
  AudienceTag,
  Business,
  Category,
  Connection,
  Match,
  Message,
  Paginated,
  PartnershipRequest,
  ThreadSummary,
} from "./types";

// --- Catalog -----------------------------------------------------------

export const getCategories = () =>
  apiFetch<Category[]>("/api/categories/", { auth: false });

export const getAudienceTags = () =>
  apiFetch<AudienceTag[]>("/api/audience-tags/", { auth: false });

// --- Businesses ------------------------------------------------------

export interface DiscoverParams {
  search?: string;
  category?: string;
  audience_tag?: string;
  price_tier?: string;
  city?: string;
  page?: number;
  ordering?: string;
}

export const discoverBusinesses = (params: DiscoverParams) =>
  apiFetch<Paginated<Business>>("/api/businesses/", {
    auth: false,
    query: { ...params },
  });

export const getBusiness = (slug: string) =>
  apiFetch<Business>(`/api/businesses/${slug}/`, { auth: false });

export const getMyBusiness = () =>
  apiFetch<Business>("/api/businesses/me/");

export const createBusiness = (payload: Record<string, unknown>) =>
  apiFetch<Business>("/api/businesses/", { method: "POST", body: payload });

export const updateMyBusiness = (payload: Record<string, unknown>) =>
  apiFetch<Business>("/api/businesses/me/", { method: "PATCH", body: payload });

export const getMatches = (params?: { min_score?: number; limit?: number }) =>
  apiFetch<{ count: number; results: Match[] }>("/api/businesses/matches/", {
    query: { ...params },
  });

export const getCompatibility = (slug: string) =>
  apiFetch<Match["match"]>(`/api/businesses/${slug}/compatibility/`);

// --- Partnerships --------------------------------------------------

export const getRequests = (params?: { box?: string; status?: string }) =>
  apiFetch<Paginated<PartnershipRequest>>("/api/partnership-requests/", {
    query: { ...params },
  });

export const getRequestSummary = () =>
  apiFetch<{
    incoming_pending: number;
    outgoing_pending: number;
    connections: number;
  }>("/api/partnership-requests/summary/");

export const sendRequest = (to_business_slug: string, message: string) =>
  apiFetch<PartnershipRequest>("/api/partnership-requests/", {
    method: "POST",
    body: { to_business_slug, message },
  });

export const respondToRequest = (
  id: number,
  action: "accept" | "decline" | "withdraw",
) =>
  apiFetch<PartnershipRequest>(`/api/partnership-requests/${id}/${action}/`, {
    method: "POST",
  });

export const getConnections = () =>
  apiFetch<Connection[]>("/api/connections/");

// --- Messaging -----------------------------------------------------

export const getThreads = () => apiFetch<ThreadSummary[]>("/api/threads/");

export const getUnreadCount = () =>
  apiFetch<{ unread: number }>("/api/threads/unread/");

export const openThread = (business_slug: string) =>
  apiFetch<ThreadSummary>("/api/threads/open/", {
    method: "POST",
    body: { business_slug },
  });

export const getMessages = (threadId: number) =>
  apiFetch<Message[]>(`/api/threads/${threadId}/messages/`);

export const postMessage = (threadId: number, body: string) =>
  apiFetch<Message>(`/api/threads/${threadId}/messages/`, {
    method: "POST",
    body: { body },
  });
