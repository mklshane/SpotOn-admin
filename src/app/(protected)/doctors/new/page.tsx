"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DoctorForm } from "@/components/doctor-form";
import { errText } from "@/components/form-field";
import { useDoctorMutations, useMeta } from "@/lib/hooks";
import type { Doctor } from "@/lib/api/types";

export default function NewDoctorPage() {
  const router = useRouter();
  const { data: meta } = useMeta();
  const { create } = useDoctorMutations();

  if (!meta) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold">New doctor</h1>
      <DoctorForm
        meta={meta}
        submitting={create.isPending}
        onSubmit={(payload) =>
          create.mutate(payload as Partial<Doctor>, {
            onSuccess: (d) => {
              toast.success("Doctor created");
              router.replace(`/doctors/${d.id}`);
            },
            onError: (e) => toast.error(errText(e)),
          })
        }
      />
    </div>
  );
}
