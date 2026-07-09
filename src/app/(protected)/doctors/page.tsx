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
import { useDoctors, useMeta } from "@/lib/hooks";

const LIMIT = 25;

export default function DoctorsPage() {
  const router = useRouter();
  const { data: meta } = useMeta();

  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const [pdsOnly, setPdsOnly] = useState(false);
  const [withBooking, setWithBooking] = useState(false);
  const [offset, setOffset] = useState(0);

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
    has_booking: withBooking ? true : undefined,
    sort: "updated_at",
    order: "desc",
    limit: LIMIT,
    offset,
  });

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
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={withBooking}
            onCheckedChange={(c) => {
              setWithBooking(c === true);
              setOffset(0);
            }}
          />
          Has booking link
        </label>
      </div>

      {error && (
        <p className="text-sm text-destructive">Failed to load doctors. Is the API running?</p>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
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
