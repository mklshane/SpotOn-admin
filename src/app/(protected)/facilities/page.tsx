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
import { useFacilities, useMeta } from "@/lib/hooks";

const LIMIT = 25;

const STATUS_STYLES: Record<string, string> = {
  verified: "bg-green-100 text-green-800",
  unverified: "bg-yellow-100 text-yellow-800",
  pending: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  excluded: "bg-zinc-200 text-zinc-600",
};

export default function FacilitiesPage() {
  const router = useRouter();
  const { data: meta } = useMeta();

  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [facilityType, setFacilityType] = useState("all");
  const [needsReview, setNeedsReview] = useState(false);
  const [withBooking, setWithBooking] = useState(false);
  const [offset, setOffset] = useState(0);

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
    facility_type: facilityType === "all" ? undefined : facilityType,
    needs_review: needsReview ? true : undefined,
    has_booking: withBooking ? true : undefined,
    sort: "updated_at",
    order: "desc",
    limit: LIMIT,
    offset,
  });

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
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={withBooking}
            onCheckedChange={(c) => {
              setWithBooking(c === true);
              setOffset(0);
            }}
          />
          Has booking URL
        </label>
      </div>

      {error && (
        <p className="text-sm text-destructive">Failed to load facilities. Is the API running?</p>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Updated</TableHead>
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
            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
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
                <TableCell className="font-medium">{f.name}</TableCell>
                <TableCell>{f.city}</TableCell>
                <TableCell>
                  {f.status && (
                    <Badge className={STATUS_STYLES[f.status] ?? ""} variant="secondary">
                      {f.status}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{f.facility_type ?? "—"}</TableCell>
                <TableCell>{f.needs_review ? <Badge variant="destructive">review</Badge> : ""}</TableCell>
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
