// Mirrors SpotOn-backend/api/app/schemas/admin.py (+ auth.py TokenOut).
// Field names match the API verbatim — same convention as
// SpotOn-frontend/src/api/types.ts.

export interface PageResp<T> {
  items: T[];
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface UserOut {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
}

export interface TokenOut {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: UserOut;
}

export interface Platform {
  id: string;
  slug: string;
  name: string;
  website: string;
  booking_url: string | null;
  description: string | null;
  is_dedicated_derma: boolean;
  is_active: boolean;
  created_at: string;
}

export interface BookingLink {
  id: string;
  doctor_id: string;
  platform_id: string;
  url: string;
  consultation_fee: number | null;
  rating: number | null;
  review_count: number | null;
  is_introductory_fee: boolean;
  available_text: string | null;
  is_active: boolean;
  last_verified: string | null;
  platform: Platform | null;
  created_at: string;
}

export interface Affiliation {
  id: string;
  doctor_id: string;
  facility_id: string;
  is_primary: boolean | null;
  schedule: string | null;
  notes: string | null;
  facility_name: string | null;
  facility_city: string | null;
}

export interface Doctor {
  id: string;
  name: string;
  title: string | null;
  pds_certified: boolean | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  google_maps_url: string | null;
  google_place_id: string | null;
  specialties: string[];
  specialties_display: string | null;
  city: string | null;
  region: string | null;
  photo_url: string | null;
  source: string | null;
  collected_by: string | null;
  date_collected: string | null;
  notes: string | null;
  enriched_by: string | null;
  enriched_at: string | null;
  enrichment_meta: unknown;
  created_at: string | null;
  updated_at: string;
  booking_links: BookingLink[];
  affiliations: Affiliation[];
}

export interface Facility {
  id: string;
  name: string;
  type: string;
  facility_type: string | null;
  address: string;
  city: string;
  province: string;
  region: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  email: string | null;
  website: string | null;
  booking_url: string | null;
  google_maps_url: string | null;
  google_place_id: string | null;
  google_rating: number | null;
  weekday_hours: unknown;
  weekend_hours: unknown;
  has_philhealth: boolean | null;
  fee_min: number | null;
  fee_max: number | null;
  status: string | null;
  collected_by: string | null;
  date_collected: string | null;
  date_verified: string | null;
  notes: string | null;
  is_aesthetic_only: boolean | null;
  classification_confidence: number | null;
  classification_reason: string | null;
  needs_review: boolean | null;
  enriched_by: string | null;
  enriched_at: string | null;
  enrichment_meta: unknown;
  services: string[];
  created_at: string | null;
  updated_at: string;
}

export interface AdminMeta {
  services: string[];
  specialties: string[];
  facility_statuses: string[];
  facility_types: string[];
  types: string[];
}
