"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AuditNotice } from "@/components/audit-notice";
import { errText } from "@/components/form-field";
import { Pager } from "@/components/pager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { downloadResearchCsv, useResearchSamples, useResearchStats } from "@/lib/hooks";
import {
  RESEARCH_CLASSES,
  RISK_TIERS,
  type ResearchStats,
} from "@/lib/api/types";

const LIMIT = 50;
const FITZ = ["1", "2", "3", "4", "5", "6"];
const ALL = "all";

function pct(n: number, d: number): string {
  return d > 0 ? `${Math.round((n / d) * 100)}%` : "—";
}

/** Commits a text filter 400 ms after the last keystroke (each list request is audited). */
function useDebounced(value: string, ms = 400): string {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  allLabel,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  allLabel: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-40"} aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StatsHeader({ stats }: { stats: ResearchStats }) {
  const { agreement } = stats;
  const counts = new Map<string, number>();
  for (const row of stats.class_by_fitzpatrick) {
    counts.set(`${row.top_class}|${row.fitzpatrick ?? "unknown"}`, row.count);
  }
  const cols = [...FITZ, "unknown"];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">Samples</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.total}</CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">Reviewed</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {pct(stats.reviewed, stats.total)}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {stats.reviewed}/{stats.total}
            </span>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Model agrees with review
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {pct(agreement.model_matches_review, agreement.reviewed_non_unusable)}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {agreement.model_matches_review}/{agreement.reviewed_non_unusable}
            </span>
          </CardContent>
        </Card>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model class × Fitzpatrick</TableHead>
              {cols.map((c) => (
                <TableHead key={c} className="text-right">
                  {c === "unknown" ? "?" : c}
                </TableHead>
              ))}
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {RESEARCH_CLASSES.map((cls) => (
              <TableRow key={cls}>
                <TableCell className="font-medium">{cls}</TableCell>
                {cols.map((c) => (
                  <TableCell key={c} className="text-right tabular-nums">
                    {counts.get(`${cls}|${c}`) ?? 0}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium tabular-nums">
                  {stats.by_class[cls] ?? 0}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              {cols.map((c) => (
                <TableCell key={c} className="text-right font-medium tabular-nums">
                  {stats.by_fitzpatrick[c] ?? 0}
                </TableCell>
              ))}
              <TableCell className="text-right font-semibold tabular-nums">{stats.total}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/** Consented, de-identified screenings shared from the app for research. */
export default function ResearchPage() {
  const [topClass, setTopClass] = useState(ALL);
  const [tier, setTier] = useState(ALL);
  const [fitz, setFitz] = useState(ALL);
  const [reviewed, setReviewed] = useState(ALL);
  const [bodyRegion, setBodyRegion] = useState("");
  const [modelVersion, setModelVersion] = useState("");
  const [offset, setOffset] = useState(0);
  const [exporting, setExporting] = useState(false);

  const bodyRegionQ = useDebounced(bodyRegion.trim());
  const modelVersionQ = useDebounced(modelVersion.trim());
  // Reset to page 1 whenever a committed text filter changes.
  const [lastText, setLastText] = useState(`${bodyRegionQ}|${modelVersionQ}`);
  if (lastText !== `${bodyRegionQ}|${modelVersionQ}`) {
    setLastText(`${bodyRegionQ}|${modelVersionQ}`);
    setOffset(0);
  }

  const { data: stats, error: statsError } = useResearchStats();
  const { data, isLoading, error } = useResearchSamples({
    top_class: topClass === ALL ? undefined : topClass,
    tier: tier === ALL ? undefined : tier,
    fitzpatrick: fitz === ALL ? undefined : fitz,
    reviewed: reviewed === ALL ? undefined : reviewed,
    body_region: bodyRegionQ || undefined,
    model_version: modelVersionQ || undefined,
    limit: LIMIT,
    offset,
  });
  const items = data?.items ?? [];

  const pick = (set: (v: string) => void) => (v: string) => {
    set(v);
    setOffset(0);
  };

  const onExport = async () => {
    setExporting(true);
    try {
      await downloadResearchCsv();
      toast.success("Export downloaded");
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Research data</h1>
          <p className="text-sm text-muted-foreground">
            De-identified screenings users chose to share. Review the label, delete anything identifying.
          </p>
        </div>
        <Button variant="outline" onClick={onExport} disabled={exporting}>
          {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>

      <AuditNotice />

      {statsError && <p className="text-sm text-destructive">Failed to load stats: {errText(statsError)}</p>}
      {stats && <StatsHeader stats={stats} />}

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          value={topClass}
          onChange={pick(setTopClass)}
          placeholder="Model class"
          allLabel="All classes"
          options={RESEARCH_CLASSES.map((c) => ({ value: c, label: c }))}
        />
        <FilterSelect
          value={tier}
          onChange={pick(setTier)}
          placeholder="Tier"
          allLabel="All tiers"
          options={RISK_TIERS.map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))}
        />
        <FilterSelect
          value={fitz}
          onChange={pick(setFitz)}
          placeholder="Fitzpatrick"
          allLabel="All skin types"
          options={FITZ.map((f) => ({ value: f, label: `Fitzpatrick ${f}` }))}
        />
        <FilterSelect
          value={reviewed}
          onChange={pick(setReviewed)}
          placeholder="Review"
          allLabel="Reviewed or not"
          options={[
            { value: "false", label: "Not reviewed" },
            { value: "true", label: "Reviewed" },
          ]}
        />
        <Input
          placeholder="Body region (e.g. Chest)"
          value={bodyRegion}
          onChange={(e) => setBodyRegion(e.target.value)}
          className="w-52"
        />
        <Input
          placeholder="Model version"
          value={modelVersion}
          onChange={(e) => setModelVersion(e.target.value)}
          className="w-44"
        />
        {data && <span className="text-sm text-muted-foreground">{data.total} matching</span>}
      </div>

      {error && (
        <p className="text-sm text-destructive">Failed to load research samples: {errText(error)}</p>
      )}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_2px_8px_rgb(122_74_43/0.06)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Captured</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Fitz</TableHead>
              <TableHead>Body region</TableHead>
              <TableHead>Age / sex</TableHead>
              <TableHead>Model version</TableHead>
              <TableHead>Review</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !items.length && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  {error ? "Nothing to show." : "No shared samples match these filters."}
                </TableCell>
              </TableRow>
            )}
            {items.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="whitespace-nowrap">
                  <Link className="font-medium underline-offset-4 hover:underline" href={`/research/${s.id}`}>
                    {s.captured_month}
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{s.top_class}</span>{" "}
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {Math.round((s.probs?.[s.top_class] ?? 0) * 100)}%
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={s.tier === "high" || s.tier === "critical" ? "default" : "secondary"}>
                    {s.tier}
                  </Badge>
                </TableCell>
                <TableCell>{s.fitzpatrick ?? "—"}</TableCell>
                <TableCell>{s.body_region ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {s.age_band ?? "—"} · {s.sex?.replaceAll("_", " ") ?? "—"}
                </TableCell>
                <TableCell className="max-w-40 truncate text-xs text-muted-foreground" title={s.model_version}>
                  {s.model_version}
                </TableCell>
                <TableCell>
                  {s.review_label ? (
                    <Badge variant={s.review_label === s.top_class ? "secondary" : "outline"}>
                      {s.review_label}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not reviewed</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pager
        offset={offset}
        limit={LIMIT}
        count={items.length}
        hasMore={data ? offset + items.length < data.total : false}
        onOffsetChange={setOffset}
      />
    </div>
  );
}
