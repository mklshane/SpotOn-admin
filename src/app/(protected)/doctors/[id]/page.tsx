"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { AffiliationsSection } from "@/components/affiliations-section";
import { BookingLinksSection } from "@/components/booking-links-section";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DoctorForm } from "@/components/doctor-form";
import { errText } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDoctor, useDoctorMutations, useMeta } from "@/lib/hooks";
import type { Doctor } from "@/lib/api/types";

export default function DoctorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: meta } = useMeta();
  const { data: doctor, isLoading, error } = useDoctor(id);
  const { update, remove } = useDoctorMutations();

  if (isLoading || !meta) return <p className="text-muted-foreground">Loading…</p>;
  if (error || !doctor) return <p className="text-destructive">Doctor not found.</p>;

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{doctor.name}</h1>
          <p className="text-sm text-muted-foreground">
            {doctor.id} · updated {new Date(doctor.updated_at).toLocaleString()}
          </p>
        </div>
        <ConfirmDialog
          trigger={<Button variant="destructive">Delete doctor</Button>}
          title="Permanently delete this doctor?"
          description={`Hard delete — also removes ${doctor.booking_links.length} booking link(s) and ${doctor.affiliations.length} affiliation(s). There is no soft delete for doctors, and mobile apps keep a stale copy until their next FULL refresh.`}
          confirmLabel="Delete permanently"
          destructive
          onConfirm={() =>
            remove.mutate(doctor.id, {
              onSuccess: () => {
                toast.success("Doctor deleted");
                router.replace("/doctors");
              },
              onError: (e) => toast.error(errText(e)),
            })
          }
        />
      </div>

      <DoctorForm
        doctor={doctor}
        meta={meta}
        submitting={update.isPending}
        onSubmit={(payload) =>
          update.mutate(
            { id: doctor.id, body: payload as Partial<Doctor> },
            {
              onSuccess: () => toast.success("Doctor saved"),
              onError: (e) => toast.error(errText(e)),
            },
          )
        }
      />

      <BookingLinksSection doctor={doctor} />
      <AffiliationsSection doctor={doctor} />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Provenance (read-only)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-1 text-sm text-muted-foreground">
          <div>Source: {doctor.source ?? "—"}</div>
          <div>
            Collected by: {doctor.collected_by ?? "—"} ({doctor.date_collected ?? "no date"})
          </div>
          <div>
            Enriched by: {doctor.enriched_by ?? "—"}
            {doctor.enriched_at ? ` at ${new Date(doctor.enriched_at).toLocaleString()}` : ""}
          </div>
          <div>Google place: {doctor.google_place_id ?? "—"}</div>
          {doctor.enrichment_meta != null && (
            <details>
              <summary className="cursor-pointer">enrichment_meta</summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted p-2 text-xs">
                {JSON.stringify(doctor.enrichment_meta, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
