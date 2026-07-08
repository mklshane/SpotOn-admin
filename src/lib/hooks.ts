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

import { api, type QueryParams } from "@/lib/api/client";
import type {
  AdminMeta,
  Affiliation,
  BookingLink,
  Doctor,
  Facility,
  PageResp,
  Platform,
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
