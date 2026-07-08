"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { EnumMultiSelect } from "@/components/enum-multi-select";
import { Field } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AdminMeta, Doctor } from "@/lib/api/types";

const schema = z.object({
  name: z.string().min(1, "Required"),
  title: z.string(),
  pds_certified: z.boolean(),
  specialties: z.array(z.string()),
  specialties_display: z.string(),
  city: z.string(),
  region: z.string(),
  phone: z.string(),
  email: z.string(),
  website: z.string(),
  google_maps_url: z.string(),
  notes: z.string(),
});

type FormValues = z.infer<typeof schema>;

const nul = (s: string) => (s.trim() ? s.trim() : null);

export function toDoctorPayload(v: FormValues) {
  return {
    name: v.name.trim(),
    title: nul(v.title),
    pds_certified: v.pds_certified,
    specialties: v.specialties,
    specialties_display: nul(v.specialties_display),
    city: nul(v.city),
    region: nul(v.region),
    phone: nul(v.phone),
    email: nul(v.email),
    website: nul(v.website),
    google_maps_url: nul(v.google_maps_url),
    notes: nul(v.notes),
  };
}

export function DoctorForm({
  doctor,
  meta,
  submitting,
  onSubmit,
}: {
  doctor?: Doctor;
  meta: AdminMeta;
  submitting: boolean;
  onSubmit: (payload: ReturnType<typeof toDoctorPayload>) => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: doctor?.name ?? "",
      title: doctor?.title ?? "",
      pds_certified: doctor?.pds_certified ?? false,
      specialties: doctor?.specialties ?? [],
      specialties_display: doctor?.specialties_display ?? "",
      city: doctor?.city ?? "",
      region: doctor?.region ?? "",
      phone: doctor?.phone ?? "",
      email: doctor?.email ?? "",
      website: doctor?.website ?? "",
      google_maps_url: doctor?.google_maps_url ?? "",
      notes: doctor?.notes ?? "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit(toDoctorPayload(v)))}
      className="grid max-w-3xl gap-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" {...register("name")} />
        </Field>
        <Field label="Title (e.g. MD, FPDS)" htmlFor="title" error={errors.title?.message}>
          <Input id="title" {...register("title")} />
        </Field>
        <Field label="City" htmlFor="city" error={errors.city?.message}>
          <Input id="city" {...register("city")} />
        </Field>
        <Field label="Region" htmlFor="region" error={errors.region?.message}>
          <Input id="region" {...register("region")} />
        </Field>
        <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
          <Input id="phone" {...register("phone")} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" {...register("email")} />
        </Field>
        <Field label="Website" htmlFor="website" error={errors.website?.message}>
          <Input id="website" {...register("website")} />
        </Field>
        <Field
          label="Google Maps URL"
          htmlFor="google_maps_url"
          error={errors.google_maps_url?.message}
        >
          <Input id="google_maps_url" {...register("google_maps_url")} />
        </Field>
      </div>

      <Field label="Specialties" error={errors.specialties?.message}>
        <Controller
          control={control}
          name="specialties"
          render={({ field }) => (
            <EnumMultiSelect
              options={meta.specialties}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </Field>

      <Field
        label="Specialties display (free text shown in the app)"
        htmlFor="specialties_display"
        error={errors.specialties_display?.message}
      >
        <Input id="specialties_display" {...register("specialties_display")} />
      </Field>

      <Field label="Notes" htmlFor="notes" error={errors.notes?.message}>
        <Textarea id="notes" rows={3} {...register("notes")} />
      </Field>

      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="pds_certified"
          render={({ field }) => (
            <Checkbox
              id="pds_certified"
              checked={field.value}
              onCheckedChange={(c) => field.onChange(c === true)}
            />
          )}
        />
        <label htmlFor="pds_certified" className="text-sm">
          PDS certified
        </label>
      </div>

      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : doctor ? "Save changes" : "Create doctor"}
        </Button>
      </div>
    </form>
  );
}
