"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { FacilityForm } from "@/components/facility-form";
import { errText } from "@/components/form-field";
import { useFacilityMutations, useMeta } from "@/lib/hooks";
import type { Facility } from "@/lib/api/types";

export default function NewFacilityPage() {
  const router = useRouter();
  const { data: meta } = useMeta();
  const { create } = useFacilityMutations();

  if (!meta) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold">New facility</h1>
      <FacilityForm
        meta={meta}
        submitting={create.isPending}
        onSubmit={(payload) =>
          create.mutate(payload as Partial<Facility>, {
            onSuccess: (f) => {
              toast.success("Facility created");
              router.replace(`/facilities/${f.id}`);
            },
            onError: (e) => toast.error(errText(e)),
          })
        }
      />
    </div>
  );
}
