export interface User {
  id: number;
  email: string;
  full_name: string;
  has_business: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface AudienceTag {
  id: number;
  facet: "age" | "interest" | "price" | "lifestyle";
  facet_label: string;
  name: string;
  slug: string;
}

export type PriceTier = "budget" | "mid" | "premium";
export type BusinessSize = "solo" | "micro" | "small" | "medium";

export interface Business {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  category: Category;
  audience_tags: AudienceTag[];
  price_tier: PriceTier;
  size: BusinessSize;
  city: string;
  region: string;
  country: string;
  location_label: string;
  website: string;
  instagram: string;
  logo: string | null;
  open_to_partnerships: boolean;
  // detail-only
  description?: string;
  partnership_pitch?: string;
  contact_email?: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string;
  is_owner?: boolean;
}

export interface MatchBreakdown {
  score: number;
  components: { audience: number; category: number; proximity: number };
  shared_tags: string[];
  reason: string;
}

export interface Match {
  business: Business;
  match: MatchBreakdown;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type RequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "withdrawn";

export interface PartnershipRequest {
  id: number;
  from_business: Business;
  to_business: Business;
  message: string;
  status: RequestStatus;
  direction: "incoming" | "outgoing";
  created_at: string;
  responded_at: string | null;
}

export interface Connection {
  id: number;
  partner: Business;
  created_at: string;
}

export interface ThreadSummary {
  id: number;
  partner: Business;
  last_message: { body: string; created_at: string; mine: boolean } | null;
  unread_count: number;
  updated_at: string;
}

export interface Message {
  id: number;
  body: string;
  created_at: string;
  sender: number;
  mine: boolean;
}

export const PRICE_LABELS: Record<PriceTier, string> = {
  budget: "Budget",
  mid: "Mid-range",
  premium: "Premium",
};

export const SIZE_LABELS: Record<BusinessSize, string> = {
  solo: "Solo / founder",
  micro: "2–9 people",
  small: "10–49 people",
  medium: "50–249 people",
};
