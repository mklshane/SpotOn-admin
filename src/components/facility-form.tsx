"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { EnumMultiSelect } from "@/components/enum-multi-select";
import { Field } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AdminMeta, Facility } from "@/lib/api/types";

// Numeric <input> values are kept as strings in the form ("" = not set) and
// converted to numbers in toPayload — keeps zod/RHF types aligned.
const numStr = (min: number, max: number, required = false) => {
  const base = required ? z.string().min(1, "Required") : z.string();
  return base.refine(
    (v) => !v.trim() || (!Number.isNaN(Number(v)) && Number(v) >= min && Number(v) <= max),
    { message: `Must be a number between ${min} and ${max}` },
  );
};

const jsonText = z.string().refine(
  (v) => {
    if (!v.trim()) return true;
    try {
      JSON.parse(v);
      return true;
    } catch {
      return false;
    }
  },
  { message: "Must be valid JSON (or empty)" },
);

const schema = z.object({
  name: z.string().min(1, "Required"),
  type: z.string().min(1, "Required"),
  facility_type: z.string(),
  address: z.string().min(1, "Required"),
  city: z.string().min(1, "Required"),
  province: z.string().min(1, "Required"),
  region: z.string(),
  latitude: numStr(-90, 90, true),
  longitude: numStr(-180, 180, true),
  phone: z.string(),
  email: z.string(),
  website: z.string(),
  booking_url: z.string(),
  google_maps_url: z.string(),
  google_rating: numStr(0, 5),
  fee_min: numStr(0, Number.MAX_SAFE_INTEGER),
  fee_max: numStr(0, Number.MAX_SAFE_INTEGER),
  has_philhealth: z.enum(["unknown", "yes", "no"]),
  status: z.string(),
  needs_review: z.boolean(),
  services: z.array(z.string()),
  weekday_hours: jsonText,
  weekend_hours: jsonText,
  notes: z.string(),
});

type FormValues = z.infer<typeof schema>;

const nul = (s: string) => (s.trim() ? s.trim() : null);
const jsonOrNull = (s: string) => (s.trim() ? JSON.parse(s) : null);

export function toPayload(v: FormValues) {
  return {
    name: v.name.trim(),
    type: v.type.trim(),
    facility_type: nul(v.facility_type),
    address: v.address.trim(),
    city: v.city.trim(),
    province: v.province.trim(),
    region: nul(v.region),
    latitude: Number(v.latitude),
    longitude: Number(v.longitude),
    phone: nul(v.phone),
    email: nul(v.email),
    website: nul(v.website),
    booking_url: nul(v.booking_url),
    google_maps_url: nul(v.google_maps_url),
    google_rating: v.google_rating.trim() ? Number(v.google_rating) : null,
    fee_min: v.fee_min.trim() ? Number(v.fee_min) : null,
    fee_max: v.fee_max.trim() ? Number(v.fee_max) : null,
    has_philhealth: v.has_philhealth === "unknown" ? null : v.has_philhealth === "yes",
    status: nul(v.status),
    needs_review: v.needs_review,
    services: v.services,
    weekday_hours: jsonOrNull(v.weekday_hours),
    weekend_hours: jsonOrNull(v.weekend_hours),
    notes: nul(v.notes),
  };
}

function toDefaults(f?: Facility): FormValues {
  return {
    name: f?.name ?? "",
    type: f?.type ?? "",
    facility_type: f?.facility_type ?? "",
    address: f?.address ?? "",
    city: f?.city ?? "",
    province: f?.province ?? "",
    region: f?.region ?? "",
    latitude: f?.latitude?.toString() ?? "",
    longitude: f?.longitude?.toString() ?? "",
    phone: f?.phone ?? "",
    email: f?.email ?? "",
    website: f?.website ?? "",
    booking_url: f?.booking_url ?? "",
    google_maps_url: f?.google_maps_url ?? "",
    google_rating: f?.google_rating?.toString() ?? "",
    fee_min: f?.fee_min?.toString() ?? "",
    fee_max: f?.fee_max?.toString() ?? "",
    has_philhealth:
      f?.has_philhealth === true ? "yes" : f?.has_philhealth === false ? "no" : "unknown",
    status: f?.status ?? "pending",
    needs_review: f?.needs_review ?? false,
    services: f?.services ?? [],
    weekday_hours: f?.weekday_hours ? JSON.stringify(f.weekday_hours, null, 2) : "",
    weekend_hours: f?.weekend_hours ? JSON.stringify(f.weekend_hours, null, 2) : "",
    notes: f?.notes ?? "",
  };
}

export function FacilityForm({
  facility,
  meta,
  submitting,
  onSubmit,
}: {
  facility?: Facility;
  meta: AdminMeta;
  submitting: boolean;
  onSubmit: (payload: ReturnType<typeof toPayload>) => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toDefaults(facility),
  });

  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit(toPayload(v)))}
      className="grid max-w-3xl gap-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" {...register("name")} />
        </Field>
        <Field label="Type (free text)" htmlFor="type" error={errors.type?.message}>
          <Input id="type" list="facility-types" {...register("type")} />
          <datalist id="facility-types">
            {meta.types.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>
        <Field label="Classification" error={errors.facility_type?.message}>
          <Controller
            control={control}
            name="facility_type"
            render={({ field }) => (
              <Select
                value={field.value || "none"}
                onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— not set —</SelectItem>
                  {meta.facility_types.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label="Status" error={errors.status?.message}>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meta.facility_statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      <Field label="Address" htmlFor="address" error={errors.address?.message}>
        <Input id="address" {...register("address")} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="City" htmlFor="city" error={errors.city?.message}>
          <Input id="city" {...register("city")} />
        </Field>
        <Field label="Province" htmlFor="province" error={errors.province?.message}>
          <Input id="province" {...register("province")} />
        </Field>
        <Field label="Region" htmlFor="region" error={errors.region?.message}>
          <Input id="region" {...register("region")} />
        </Field>
        <Field label="Latitude" htmlFor="latitude" error={errors.latitude?.message}>
          <Input id="latitude" type="number" step="any" {...register("latitude")} />
        </Field>
        <Field label="Longitude" htmlFor="longitude" error={errors.longitude?.message}>
          <Input id="longitude" type="number" step="any" {...register("longitude")} />
        </Field>
        <Field label="PhilHealth" error={errors.has_philhealth?.message}>
          <Controller
            control={control}
            name="has_philhealth"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">unknown</SelectItem>
                  <SelectItem value="yes">yes</SelectItem>
                  <SelectItem value="no">no</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
          <Input id="phone" {...register("phone")} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" {...register("email")} />
        </Field>
        <Field label="Website" htmlFor="website" error={errors.website?.message}>
          <Input id="website" {...register("website")} />
        </Field>
        <Field label="Booking URL" htmlFor="booking_url" error={errors.booking_url?.message}>
          <Input id="booking_url" {...register("booking_url")} />
        </Field>
        <Field
          label="Google Maps URL"
          htmlFor="google_maps_url"
          error={errors.google_maps_url?.message}
        >
          <Input id="google_maps_url" {...register("google_maps_url")} />
        </Field>
        <Field
          label="Google rating (0–5)"
          htmlFor="google_rating"
          error={errors.google_rating?.message}
        >
          <Input id="google_rating" type="number" step="0.1" {...register("google_rating")} />
        </Field>
        <Field label="Fee min (₱)" htmlFor="fee_min" error={errors.fee_min?.message}>
          <Input id="fee_min" type="number" {...register("fee_min")} />
        </Field>
        <Field label="Fee max (₱)" htmlFor="fee_max" error={errors.fee_max?.message}>
          <Input id="fee_max" type="number" {...register("fee_max")} />
        </Field>
      </div>

      <Field label="Services" error={errors.services?.message}>
        <Controller
          control={control}
          name="services"
          render={({ field }) => (
            <EnumMultiSelect
              options={meta.services}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Weekday hours (JSON)"
          htmlFor="weekday_hours"
          error={errors.weekday_hours?.message}
        >
          <Textarea
            id="weekday_hours"
            rows={4}
            placeholder='{"open": "09:00", "close": "17:00"}'
            className="font-mono text-xs"
            {...register("weekday_hours")}
          />
        </Field>
        <Field
          label="Weekend hours (JSON)"
          htmlFor="weekend_hours"
          error={errors.weekend_hours?.message}
        >
          <Textarea
            id="weekend_hours"
            rows={4}
            className="font-mono text-xs"
            {...register("weekend_hours")}
          />
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes" error={errors.notes?.message}>
        <Textarea id="notes" rows={3} {...register("notes")} />
      </Field>

      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="needs_review"
          render={({ field }) => (
            <Checkbox
              id="needs_review"
              checked={field.value}
              onCheckedChange={(c) => field.onChange(c === true)}
            />
          )}
        />
        <label htmlFor="needs_review" className="text-sm">
          Needs review
        </label>
      </div>

      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : facility ? "Save changes" : "Create facility"}
        </Button>
      </div>
    </form>
  );
}
