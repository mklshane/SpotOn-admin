"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { FacilityForm } from "@/components/facility-form";
import { errText } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFacility, useFacilityMutations, useMeta } from "@/lib/hooks";
import type { Facility } from "@/lib/api/types";

export default function FacilityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: meta } = useMeta();
  const { data: facility, isLoading, error } = useFacility(id);
  const { update, remove } = useFacilityMutations();

  if (isLoading || !meta) return <p className="text-muted-foreground">Loading…</p>;
  if (error || !facility) return <p className="text-destructive">Facility not found.</p>;

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{facility.name}</h1>
          <p className="text-sm text-muted-foreground">
            {facility.id} · updated {new Date(facility.updated_at).toLocaleString()}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {facility.status !== "excluded" && (
            <ConfirmDialog
              trigger={<Button variant="outline">Exclude</Button>}
              title="Exclude this facility?"
              description="Sets status to 'excluded'. It disappears from the public directory and the mobile app picks the change up on its next sync. Reversible — set the status back anytime."
              confirmLabel="Exclude"
              onConfirm={() =>
                remove.mutate(
                  { id: facility.id },
                  {
                    onSuccess: () => toast.success("Facility excluded"),
                    onError: (e) => toast.error(errText(e)),
                  },
                )
              }
            />
          )}
          <ConfirmDialog
            trigger={<Button variant="destructive">Delete</Button>}
            title="Permanently delete this facility?"
            description="Hard-deletes the row and any doctor affiliations pointing at it. Mobile apps keep a stale copy until their next FULL refresh (the sync feed has no delete tombstones). Prefer Exclude unless this is junk data."
            confirmLabel="Delete permanently"
            destructive
            onConfirm={() =>
              remove.mutate(
                { id: facility.id, hard: true },
                {
                  onSuccess: () => {
                    toast.success("Facility deleted");
                    router.replace("/facilities");
                  },
                  onError: (e) => toast.error(errText(e)),
                },
              )
            }
          />
        </div>
      </div>

      <FacilityForm
        facility={facility}
        meta={meta}
        submitting={update.isPending}
        onSubmit={(payload) =>
          update.mutate(
            { id: facility.id, body: payload as Partial<Facility> },
            {
              onSuccess: () => toast.success("Facility saved"),
              onError: (e) => toast.error(errText(e)),
            },
          )
        }
      />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Provenance (read-only)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-1 text-sm text-muted-foreground">
          <div>Collected by: {facility.collected_by ?? "—"} ({facility.date_collected ?? "no date"})</div>
          <div>Verified: {facility.date_verified ?? "—"}</div>
          <div>
            Enriched by: {facility.enriched_by ?? "—"}
            {facility.enriched_at ? ` at ${new Date(facility.enriched_at).toLocaleString()}` : ""}
          </div>
          <div>
            Classification: {facility.facility_type ?? "—"}
            {facility.classification_confidence != null
              ? ` (confidence ${facility.classification_confidence})`
              : ""}
          </div>
          {facility.classification_reason && <div>Reason: {facility.classification_reason}</div>}
          <div>Google place: {facility.google_place_id ?? "—"}</div>
          {facility.department_info != null && (
            <details>
              <summary className="cursor-pointer">department_info (hospital derm dept)</summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted p-2 text-xs">
                {JSON.stringify(facility.department_info, null, 2)}
              </pre>
            </details>
          )}
          {facility.enrichment_meta != null && (
            <details>
              <summary className="cursor-pointer">enrichment_meta</summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted p-2 text-xs">
                {JSON.stringify(facility.enrichment_meta, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
