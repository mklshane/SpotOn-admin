"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Pager } from "@/components/pager";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDoctorMutations, useDoctors, useMeta } from "@/lib/hooks";

const LIMIT = 25;

export default function DoctorsPage() {
  const router = useRouter();
  const { data: meta } = useMeta();

  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const [pdsOnly, setPdsOnly] = useState(false);
  const [booking, setBooking] = useState("all");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { removeMany } = useDoctorMutations();

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search);
      setOffset(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, error } = useDoctors({
    q: q || undefined,
    specialty: specialty === "all" ? undefined : specialty,
    pds_certified: pdsOnly ? true : undefined,
    has_booking: booking === "all" ? undefined : booking === "with",
    sort: "updated_at",
    order: "desc",
    limit: LIMIT,
    offset,
  });

  const pageIds = (data?.items ?? []).map((d) => d.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toggleRow = (id: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const togglePage = (on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of pageIds) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Doctors</h1>
        <Button asChild>
          <Link href="/doctors/new">New doctor</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Select
          value={specialty}
          onValueChange={(v) => {
            setSpecialty(v);
            setOffset(0);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Specialty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All specialties</SelectItem>
            {(meta?.specialties ?? []).map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={pdsOnly}
            onCheckedChange={(c) => {
              setPdsOnly(c === true);
              setOffset(0);
            }}
          />
          PDS certified only
        </label>
        <Select
          value={booking}
          onValueChange={(v) => {
            setBooking(v);
            setOffset(0);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Booking" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All booking</SelectItem>
            <SelectItem value="with">Has booking link</SelectItem>
            <SelectItem value="without">No booking link</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="text-sm text-destructive">Failed to load doctors. Is the API running?</p>
      )}

      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-full border bg-accent/60 py-2 pr-2 pl-4">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <ConfirmDialog
              trigger={
                <Button variant="destructive" size="sm" disabled={removeMany.isPending}>
                  Delete selected
                </Button>
              }
              title={`Permanently delete ${selected.size} doctor${selected.size === 1 ? "" : "s"}?`}
              description="Hard-deletes every selected doctor along with their booking links and facility affiliations. This cannot be undone, and mobile apps keep stale copies until a full refresh."
              confirmLabel={`Delete ${selected.size} permanently`}
              destructive
              onConfirm={() =>
                removeMany.mutate([...selected], {
                  onSuccess: ({ done, total }) => {
                    if (done === total) toast.success(`${done} doctor${done === 1 ? "" : "s"} deleted`);
                    else toast.warning(`Deleted ${done}/${total} — some failed, list refreshed`);
                    setSelected(new Set());
                  },
                })
              }
            />
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_2px_8px_rgb(122_74_43/0.06)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allPageSelected}
                  onCheckedChange={(c) => togglePage(c === true)}
                  aria-label="Select all on this page"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Specialties</TableHead>
              <TableHead>City</TableHead>
              <TableHead>PDS</TableHead>
              <TableHead>Booking links</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No doctors match.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((d) => (
              <TableRow
                key={d.id}
                className="cursor-pointer"
                onClick={() => router.push(`/doctors/${d.id}`)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.has(d.id)}
                    onCheckedChange={(c) => toggleRow(d.id, c === true)}
                    aria-label={`Select ${d.name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell className="max-w-64 truncate text-muted-foreground">
                  {d.specialties_display ?? d.specialties.join(", ")}
                </TableCell>
                <TableCell>{d.city ?? "—"}</TableCell>
                <TableCell>{d.pds_certified ? <Badge variant="secondary">PDS</Badge> : ""}</TableCell>
                <TableCell>
                  {d.booking_links.length > 0
                    ? `${d.booking_links.filter((l) => l.is_active).length} active / ${d.booking_links.length}`
                    : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(d.updated_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pager
        offset={offset}
        limit={LIMIT}
        count={data?.items.length ?? 0}
        hasMore={data?.has_more ?? false}
        onOffsetChange={setOffset}
      />
    </div>
  );
}
