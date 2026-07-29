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
import { useFacilities, useFacilityMutations, useMeta } from "@/lib/hooks";

const LIMIT = 25;

// Warm status palette from the mobile risk-tier tints (green/amber/red) plus
// the brand tint for pending; excluded reads as muted, not alarming.
const STATUS_STYLES: Record<string, string> = {
  verified: "bg-[#E7F6EF] text-[#1E7A55]",
  unverified: "bg-[#FFF4DE] text-[#9A6A12]",
  pending: "bg-[#FFE9DA] text-[#C2551F]",
  rejected: "bg-[#FCE7E7] text-[#B32F33]",
  excluded: "bg-[#F1E5DB] text-[#7C6E64]",
};

export default function FacilitiesPage() {
  const router = useRouter();
  const { data: meta } = useMeta();

  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [facilityType, setFacilityType] = useState("all");
  const [needsReview, setNeedsReview] = useState(false);
  const [booking, setBooking] = useState("all");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { removeMany } = useFacilityMutations();

  // Debounce the search box into the query param.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search);
      setOffset(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, error } = useFacilities({
    q: q || undefined,
    status: status === "all" ? undefined : status,
    type: type === "all" ? undefined : type,
    facility_type: facilityType === "all" ? undefined : facilityType,
    needs_review: needsReview ? true : undefined,
    has_booking: booking === "all" ? undefined : booking === "with",
    sort: "updated_at",
    order: "desc",
    limit: LIMIT,
    offset,
  });

  const pageIds = (data?.items ?? []).map((f) => f.id);
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

  const bulk = (hard: boolean) => {
    const ids = [...selected];
    removeMany.mutate(
      { ids, hard },
      {
        onSuccess: ({ done, total }) => {
          const verb = hard ? "deleted" : "excluded";
          if (done === total) toast.success(`${done} facilit${done === 1 ? "y" : "ies"} ${verb}`);
          else toast.warning(`${verb} ${done}/${total} — some failed, list refreshed`);
          setSelected(new Set());
        },
      },
    );
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Facilities</h1>
        <Button asChild>
          <Link href="/facilities/new">New facility</Link>
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
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setOffset(0);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(meta?.facility_statuses ?? []).map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={type}
          onValueChange={(v) => {
            setType(v);
            setOffset(0);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {(meta?.types ?? []).map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
            {/* Retired kinds: not creatable, but still on legacy rows — needed to
                audit that they're all excluded from the directory. */}
            {(meta?.retired_types ?? []).map((t) => (
              <SelectItem key={t} value={t}>
                {t} (retired)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={facilityType}
          onValueChange={(v) => {
            setFacilityType(v);
            setOffset(0);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Classification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classifications</SelectItem>
            {(meta?.facility_types ?? []).map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={needsReview}
            onCheckedChange={(c) => {
              setNeedsReview(c === true);
              setOffset(0);
            }}
          />
          Needs review
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
            <SelectItem value="with">Has booking URL</SelectItem>
            <SelectItem value="without">No booking URL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="text-sm text-destructive">Failed to load facilities. Is the API running?</p>
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
                <Button variant="outline" size="sm" disabled={removeMany.isPending}>
                  Exclude selected
                </Button>
              }
              title={`Exclude ${selected.size} facilit${selected.size === 1 ? "y" : "ies"}?`}
              description="Sets status to 'excluded' on every selected facility. They disappear from the public directory and the change syncs to the mobile app. Reversible per facility."
              confirmLabel="Exclude all selected"
              onConfirm={() => bulk(false)}
            />
            <ConfirmDialog
              trigger={
                <Button variant="destructive" size="sm" disabled={removeMany.isPending}>
                  Delete selected
                </Button>
              }
              title={`Permanently delete ${selected.size} facilit${selected.size === 1 ? "y" : "ies"}?`}
              description="Hard-deletes every selected facility and their doctor affiliations. This cannot be undone, and mobile apps keep stale copies until a full refresh. Prefer Exclude unless this is junk data."
              confirmLabel={`Delete ${selected.size} permanently`}
              destructive
              onConfirm={() => bulk(true)}
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
              <TableHead className="w-12" />
              <TableHead>Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  No facilities match.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((f) => (
              <TableRow
                key={f.id}
                className="cursor-pointer"
                onClick={() => router.push(`/facilities/${f.id}`)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.has(f.id)}
                    onCheckedChange={(c) => toggleRow(f.id, c === true)}
                    aria-label={`Select ${f.name}`}
                  />
                </TableCell>
                <TableCell>
                  {f.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.photo_url}
                      alt=""
                      loading="lazy"
                      className="h-9 w-9 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-md bg-muted" />
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {f.name}
                  {f.description ? (
                    <span className="ml-1.5 text-muted-foreground" title={f.description}>
                      ¶
                    </span>
                  ) : null}
                </TableCell>
                <TableCell>{f.city}</TableCell>
                <TableCell className="text-muted-foreground">{f.type}</TableCell>
                <TableCell>
                  {f.status && (
                    <Badge className={STATUS_STYLES[f.status] ?? ""} variant="secondary">
                      {f.status}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{f.facility_type ?? "—"}</TableCell>
                <TableCell>
                  {f.needs_review ? (
                    <Badge className="bg-[#FFF4DE] text-[#9A6A12]" variant="secondary">
                      review
                    </Badge>
                  ) : (
                    ""
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(f.updated_at).toLocaleDateString()}
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
