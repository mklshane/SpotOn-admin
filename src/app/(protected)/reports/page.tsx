"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { errText } from "@/components/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useReportMutations, useReports } from "@/lib/hooks";
import type { DirectoryReport, ReportStatus } from "@/lib/api/types";

const CATEGORY: Record<string, string> = {
  wrong_phone: "Wrong phone",
  wrong_address: "Wrong address / pin",
  wrong_schedule: "Wrong schedule",
  doctor_not_here: "Doctor not here",
  closed_or_moved: "Closed or moved",
  not_dermatology: "Not dermatology",
  other: "Other",
};

const FILTERS: (ReportStatus | "all")[] = ["open", "resolved", "dismissed", "all"];

/** Patients' "Report incorrect info" submissions from the app. Fix the listing, then resolve. */
export default function ReportsPage() {
  const [filter, setFilter] = useState<ReportStatus | "all">("open");
  const { data: reports, isLoading, error } = useReports(filter);
  const { update } = useReportMutations();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const setStatus = (r: DirectoryReport, status: ReportStatus) =>
    update.mutate(
      { id: r.id, body: { status, admin_note: notes[r.id] ?? r.admin_note } },
      {
        onSuccess: () => toast.success(status === "open" ? "Reopened" : `Marked ${status}`),
        onError: (e: unknown) => toast.error(errText(e)),
      },
    );

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Directory reports</h1>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f[0].toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">Failed to load reports. Is the API running?</p>}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_2px_8px_rgb(122_74_43/0.06)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reported</TableHead>
              <TableHead>Listing</TableHead>
              <TableHead>Problem</TableHead>
              <TableHead>Patient&apos;s note</TableHead>
              <TableHead>Admin note</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !(reports ?? []).length && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No {filter === "all" ? "" : filter} reports.
                </TableCell>
              </TableRow>
            )}
            {(reports ?? []).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </TableCell>
                <TableCell className="max-w-56">
                  <Link
                    className="font-medium underline-offset-4 hover:underline"
                    href={`/${r.target_kind === "facility" ? "facilities" : "doctors"}/${r.target_id}`}
                  >
                    {r.target_name ?? r.target_id}
                  </Link>
                  <div className="text-xs text-muted-foreground">{r.target_kind === "facility" ? "Clinic" : "Doctor"}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={r.status === "open" ? "default" : "secondary"}>
                    {CATEGORY[r.category] ?? r.category}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-72 whitespace-pre-wrap text-sm">{r.message ?? "—"}</TableCell>
                <TableCell className="min-w-48">
                  <Textarea
                    rows={2}
                    placeholder="What you changed"
                    value={notes[r.id] ?? r.admin_note ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {r.status === "open" ? (
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => setStatus(r, "resolved")}>Resolve</Button>
                      <Button size="sm" variant="outline" onClick={() => setStatus(r, "dismissed")}>Dismiss</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(r, "open")}>Reopen</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
