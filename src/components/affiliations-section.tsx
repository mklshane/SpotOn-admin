"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { errText, Field } from "@/components/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAffiliationMutations, useFacilities } from "@/lib/hooks";
import type { Doctor, Facility } from "@/lib/api/types";

export function AffiliationsSection({ doctor }: { doctor: Doctor }) {
  const { create, update, remove } = useAffiliationMutations(doctor.id);
  const [open, setOpen] = useState(false);

  // Facility picker state
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Facility | null>(null);
  const [isPrimary, setIsPrimary] = useState(false);
  const [schedule, setSchedule] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setQ(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: results, isFetching } = useFacilities({
    q: q || undefined,
    limit: 8,
    offset: 0,
    sort: "name",
    order: "asc",
  });

  const reset = () => {
    setOpen(false);
    setSearch("");
    setQ("");
    setSelected(null);
    setIsPrimary(false);
    setSchedule("");
  };

  const add = () => {
    if (!selected) {
      toast.error("Pick a facility first.");
      return;
    }
    create.mutate(
      {
        facility_id: selected.id,
        is_primary: isPrimary,
        schedule: schedule.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Affiliation added");
          reset();
        },
        onError: (e) => toast.error(errText(e)),
      },
    );
  };

  return (
    <Card className="max-w-3xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Facility affiliations</CardTitle>
        <Button size="sm" onClick={() => setOpen(true)}>
          Add affiliation
        </Button>
      </CardHeader>
      <CardContent>
        {doctor.affiliations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No affiliations.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facility</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Primary</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctor.affiliations.map((aff) => (
                <TableRow key={aff.id}>
                  <TableCell className="font-medium">{aff.facility_name ?? aff.facility_id}</TableCell>
                  <TableCell>{aff.facility_city ?? "—"}</TableCell>
                  <TableCell>
                    {aff.is_primary ? <Badge variant="secondary">primary</Badge> : ""}
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-muted-foreground">
                    {aff.schedule ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          update.mutate(
                            { id: aff.id, body: { is_primary: !aff.is_primary } },
                            {
                              onSuccess: () => toast.success("Affiliation updated"),
                              onError: (e) => toast.error(errText(e)),
                            },
                          )
                        }
                      >
                        {aff.is_primary ? "Unset primary" : "Set primary"}
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="sm" className="text-destructive">
                            Remove
                          </Button>
                        }
                        title="Remove affiliation?"
                        description={`Unlink ${doctor.name} from ${aff.facility_name ?? "this facility"}. The facility itself is not touched.`}
                        confirmLabel="Remove"
                        destructive
                        onConfirm={() =>
                          remove.mutate(aff.id, {
                            onSuccess: () => toast.success("Affiliation removed"),
                            onError: (e) => toast.error(errText(e)),
                          })
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={(o) => !o && reset()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add affiliation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Search facilities">
              <Input
                placeholder="Type a facility name…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelected(null);
                }}
              />
            </Field>
            {selected ? (
              <div className="rounded-md border bg-muted/40 p-2 text-sm">
                Selected: <span className="font-medium">{selected.name}</span> — {selected.city}
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-md border">
                {isFetching && <p className="p-2 text-sm text-muted-foreground">Searching…</p>}
                {!isFetching && (results?.items ?? []).length === 0 && (
                  <p className="p-2 text-sm text-muted-foreground">No matches.</p>
                )}
                {(results?.items ?? []).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className="block w-full px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => setSelected(f)}
                  >
                    <span className="font-medium">{f.name}</span>
                    <span className="text-muted-foreground"> — {f.city}</span>
                  </button>
                ))}
              </div>
            )}
            <Field label="Schedule (free text)">
              <Input
                placeholder="e.g. Mon/Wed 2–5 PM"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={isPrimary} onCheckedChange={(c) => setIsPrimary(c === true)} />
              Primary clinic
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>
                Cancel
              </Button>
              <Button onClick={add} disabled={create.isPending}>
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
