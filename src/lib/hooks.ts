"use client";

// One react-query hook set per admin resource. Mutations invalidate the
// resource's list key (and the doctor detail for nested link/affiliation
// edits) and surface API errors via the caller's onError/toast.

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { api, type QueryParams } from "@/lib/api/client";
import type {
  AdminMeta,
  Affiliation,
  AuditLogEntry,
  BookingLink,
  DirectoryReport,
  Doctor,
  Facility,
  PageResp,
  Platform,
  ReportStatus,
  ResearchSampleAdmin,
  ResearchStats,
  ReviewLabel,
  TotalResp,
} from "@/lib/api/types";

export function useMeta() {
  return useQuery({
    queryKey: ["meta"],
    queryFn: () => api.get<AdminMeta>("/admin/meta"),
    staleTime: 5 * 60 * 1000,
  });
}

// --- Facilities -----------------------------------------------------------------

export function useFacilities(params: QueryParams) {
  return useQuery({
    queryKey: ["facilities", params],
    queryFn: () => api.get<PageResp<Facility>>("/admin/facilities", params),
    placeholderData: keepPreviousData,
  });
}

export function useFacility(id: string | null) {
  return useQuery({
    queryKey: ["facilities", id],
    queryFn: () => api.get<Facility>(`/admin/facilities/${id}`),
    enabled: !!id,
  });
}

export function useFacilityMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["facilities"] });
  return {
    create: useMutation({
      mutationFn: (body: Partial<Facility>) => api.post<Facility>("/admin/facilities", body),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Partial<Facility> }) =>
        api.patch<Facility>(`/admin/facilities/${id}`, body),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: ({ id, hard }: { id: string; hard?: boolean }) =>
        api.del(`/admin/facilities/${id}`, hard ? { hard: true } : undefined),
      onSuccess: invalidate,
    }),
    removeMany: useMutation({
      mutationFn: async ({ ids, hard }: { ids: string[]; hard?: boolean }) => {
        const results = await Promise.allSettled(
          ids.map((id) => api.del(`/admin/facilities/${id}`, hard ? { hard: true } : undefined)),
        );
        return { done: results.filter((r) => r.status === "fulfilled").length, total: ids.length };
      },
      onSettled: invalidate,
    }),
  };
}

// --- Doctors --------------------------------------------------------------------

export function useDoctors(params: QueryParams) {
  return useQuery({
    queryKey: ["doctors", params],
    queryFn: () => api.get<PageResp<Doctor>>("/admin/doctors", params),
    placeholderData: keepPreviousData,
  });
}

export function useDoctor(id: string | null) {
  return useQuery({
    queryKey: ["doctors", id],
    queryFn: () => api.get<Doctor>(`/admin/doctors/${id}`),
    enabled: !!id,
  });
}

export function useDoctorMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["doctors"] });
  return {
    create: useMutation({
      mutationFn: (body: Partial<Doctor>) => api.post<Doctor>("/admin/doctors", body),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Partial<Doctor> }) =>
        api.patch<Doctor>(`/admin/doctors/${id}`, body),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.del(`/admin/doctors/${id}`),
      onSuccess: invalidate,
    }),
    removeMany: useMutation({
      mutationFn: async (ids: string[]) => {
        const results = await Promise.allSettled(ids.map((id) => api.del(`/admin/doctors/${id}`)));
        return { done: results.filter((r) => r.status === "fulfilled").length, total: ids.length };
      },
      onSettled: invalidate,
    }),
  };
}

// --- Booking links (invalidate the owning doctor) ---------------------------------

export function useBookingLinkMutations(doctorId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["doctors"] });
  return {
    create: useMutation({
      mutationFn: (body: Partial<BookingLink>) =>
        api.post<BookingLink>("/admin/booking-links", { ...body, doctor_id: doctorId }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Partial<BookingLink> }) =>
        api.patch<BookingLink>(`/admin/booking-links/${id}`, body),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.del(`/admin/booking-links/${id}`),
      onSuccess: invalidate,
    }),
  };
}

// --- Affiliations ------------------------------------------------------------------

export function useAffiliationMutations(doctorId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["doctors"] });
  return {
    create: useMutation({
      mutationFn: (body: Partial<Affiliation>) =>
        api.post<Affiliation>("/admin/affiliations", { ...body, doctor_id: doctorId }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Partial<Affiliation> }) =>
        api.patch<Affiliation>(`/admin/affiliations/${id}`, body),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.del(`/admin/affiliations/${id}`),
      onSuccess: invalidate,
    }),
  };
}

// --- Platforms -----------------------------------------------------------------------

export function usePlatforms() {
  return useQuery({
    queryKey: ["platforms"],
    queryFn: () => api.get<Platform[]>("/admin/platforms"),
  });
}

export function usePlatformMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["platforms"] });
  return {
    create: useMutation({
      mutationFn: (body: Partial<Platform>) => api.post<Platform>("/admin/platforms", body),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Partial<Platform> }) =>
        api.patch<Platform>(`/admin/platforms/${id}`, body),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: ({ id, hard }: { id: string; hard?: boolean }) =>
        api.del(`/admin/platforms/${id}`, hard ? { hard: true } : undefined),
      onSuccess: invalidate,
    }),
  };
}

// --- Directory reports (patients' "Report incorrect info") ---------------------------

export function useReports(status: ReportStatus | "all") {
  return useQuery({
    queryKey: ["reports", status],
    queryFn: () =>
      api.get<DirectoryReport[]>("/admin/reports", status === "all" ? undefined : { status }),
    placeholderData: keepPreviousData,
  });
}

export function useReportMutations() {
  const qc = useQueryClient();
  return {
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: { status?: ReportStatus; admin_note?: string | null } }) =>
        api.patch<DirectoryReport>(`/admin/reports/${id}`, body),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
    }),
  };
}

// --- Shared research data + audit log ----------------------------------------------

export function useResearchSamples(params: QueryParams) {
  return useQuery({
    queryKey: ["research", "samples", params],
    queryFn: () =>
      api.get<TotalResp<ResearchSampleAdmin>>("/admin/research/samples", params),
    placeholderData: keepPreviousData,
  });
}

export function useResearchSample(id: string | null) {
  return useQuery({
    queryKey: ["research", "sample", id],
    queryFn: () => api.get<ResearchSampleAdmin>(`/admin/research/samples/${id}`),
    enabled: !!id,
  });
}

/**
 * Polled, so newly shared samples show up without a reload. Stats are aggregate counts and are not
 * audited, unlike the sample list - so the list is NOT polled; it refetches only when the total
 * changes (below).
 */
export function useResearchStats() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["research", "stats"],
    queryFn: () => api.get<ResearchStats>("/admin/research/stats"),
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });
  const total = query.data?.total;
  const seen = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (total === undefined) return;
    if (seen.current !== undefined && seen.current !== total) {
      qc.invalidateQueries({ queryKey: ["research", "samples"] });
    }
    seen.current = total;
  }, [total, qc]);
  return query;
}

export function useResearchMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["research"] });
  return {
    label: useMutation({
      mutationFn: ({ id, review_label }: { id: string; review_label: ReviewLabel | null }) =>
        api.patch<ResearchSampleAdmin>(`/admin/research/samples/${id}`, { review_label }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
        api.del(`/admin/research/samples/${id}`, undefined, reason ? { reason } : undefined),
      onSuccess: invalidate,
    }),
  };
}

export function useAuditLog(params: QueryParams) {
  return useQuery({
    queryKey: ["audit-log", params],
    queryFn: () => api.get<TotalResp<AuditLogEntry>>("/admin/audit-log", params),
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetches a research image through the API with the bearer token and exposes it
 * as an object URL, revoked on unmount / id change. Every call is audited
 * server-side as view_image.
 */
export function useResearchImage(id: string | null) {
  const [state, setState] = useState<{ url: string | null; error: unknown; loading: boolean }>({
    url: null,
    error: null,
    loading: !!id,
  });
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ url: null, error: null, loading: true });
    api
      .blob(`/admin/research/samples/${id}/image`)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setState({ url: objectUrl, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ url: null, error, loading: false });
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);
  return state;
}

/** Downloads the (audited) research CSV export via a token-authenticated fetch. */
export async function downloadResearchCsv(): Promise<void> {
  const blob = await api.blob("/admin/research/export.csv");
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = `spoton-research-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    // Give the browser a tick to start the download before revoking.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
