"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AuditNotice } from "@/components/audit-notice";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { errText } from "@/components/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useResearchImage, useResearchMutations, useResearchSample } from "@/lib/hooks";
import {
  RESEARCH_CLASSES,
  REVIEW_LABELS,
  type ResearchSampleAdmin,
  type ReviewLabel,
} from "@/lib/api/types";

const CLEAR = "__clear__";

/** Image fetched as an authenticated blob; blurred until the admin chooses to look. */
function SampleImage({ id }: { id: string }) {
  const { url, error, loading } = useResearchImage(id);
  const [revealed, setRevealed] = useState(false);

  if (loading) {
    return <div className="flex aspect-square items-center justify-center rounded-2xl border bg-muted text-sm text-muted-foreground">Loading image…</div>;
  }
  if (error || !url) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border bg-muted p-6 text-center text-sm text-destructive">
        Could not load the image{error ? `: ${errText(error)}` : "."}
      </div>
    );
  }
  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        className="relative overflow-hidden rounded-2xl border bg-muted"
        aria-label={revealed ? "Blur image" : "Reveal image"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- blob: object URL, not optimisable */}
        <img
          src={url}
          alt="Shared lesion photo"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          className={`aspect-square w-full object-contain transition-[filter] duration-200 ${revealed ? "" : "scale-105 blur-2xl"}`}
        />
        {!revealed && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-background/85 px-4 py-2 text-sm font-medium shadow">
              Click to reveal
            </span>
          </span>
        )}
      </button>
      {revealed && (
        <Button variant="outline" size="sm" onClick={() => setRevealed(false)}>
          Blur again
        </Button>
      )}
    </div>
  );
}

function ProbBars({ probs, top }: { probs: ResearchSampleAdmin["probs"]; top: string }) {
  return (
    <div className="grid gap-1.5">
      {RESEARCH_CLASSES.map((c) => {
        const p = probs?.[c] ?? 0;
        return (
          <div key={c} className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-2 text-sm">
            <span className={c === top ? "font-semibold" : "text-muted-foreground"}>{c}</span>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={c === top ? "h-full bg-primary" : "h-full bg-muted-foreground/40"}
                style={{ width: `${Math.max(0, Math.min(1, p)) * 100}%` }}
              />
            </div>
            <span className="text-right tabular-nums">{(p * 100).toFixed(1)}%</span>
          </div>
        );
      })}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value ?? "—"}</dd>
    </>
  );
}

export default function ResearchSamplePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: s, isLoading, error } = useResearchSample(id);
  const { label, remove } = useResearchMutations();
  const [reason, setReason] = useState("");

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (error || !s) {
    return (
      <div className="grid gap-2">
        <p className="text-destructive">
          {error ? `Could not load this sample: ${errText(error)}` : "Sample not found."}
        </p>
        <Link href="/research" className="text-sm underline-offset-4 hover:underline">
          ← Back to research data
        </Link>
      </div>
    );
  }

  const onLabel = (v: string) =>
    label.mutate(
      { id: s.id, review_label: v === CLEAR ? null : (v as ReviewLabel) },
      {
        onSuccess: () => toast.success(v === CLEAR ? "Label cleared" : `Labelled ${v}`),
        onError: (e: unknown) => toast.error(errText(e)),
      },
    );

  const answers = Object.entries(s.answers ?? {});

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/research" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            ← Research data
          </Link>
          <h1 className="text-2xl font-semibold">
            {s.top_class} · {s.tier}
          </h1>
          <p className="text-xs text-muted-foreground">
            {s.id} · shared {new Date(s.created_at).toLocaleString()}
          </p>
        </div>
        <ConfirmDialog
          trigger={<Button variant="destructive">Delete (identifying/unusable)</Button>}
          title="Delete this research sample?"
          description={
            <>
              <span className="block">
                The image and its metadata are permanently removed. Use this for photos that show a face,
                tattoo, jewellery, document or anything else identifying, or that are unusable.
              </span>
              <Textarea
                className="mt-3"
                rows={2}
                placeholder="Reason (optional, stored in the audit log)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </>
          }
          confirmLabel="Delete"
          destructive
          onConfirm={() =>
            remove.mutate(
              { id: s.id, reason: reason.trim() || undefined },
              {
                onSuccess: () => {
                  toast.success("Sample deleted");
                  router.replace("/research");
                },
                onError: (e: unknown) => toast.error(errText(e)),
              },
            )
          }
        />
      </div>

      <AuditNotice />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <SampleImage id={s.id} />

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Review label</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Select value={s.review_label ?? ""} onValueChange={onLabel} disabled={label.isPending}>
                <SelectTrigger className="w-56" aria-label="Review label">
                  <SelectValue placeholder="Not reviewed" />
                </SelectTrigger>
                <SelectContent>
                  {REVIEW_LABELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                  {s.review_label && <SelectItem value={CLEAR}>Clear label</SelectItem>}
                </SelectContent>
              </Select>
              {s.reviewed_at && (
                <p className="text-xs text-muted-foreground">
                  Reviewed {new Date(s.reviewed_at).toLocaleString()}
                  {s.reviewed_by_email ? ` by ${s.reviewed_by_email}` : ""}
                  {s.review_label && s.review_label !== "UNUSABLE" && (
                    <>
                      {" · "}
                      <Badge variant={s.review_label === s.top_class ? "secondary" : "outline"}>
                        {s.review_label === s.top_class ? "agrees with model" : "disagrees with model"}
                      </Badge>
                    </>
                  )}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Model output</CardTitle>
            </CardHeader>
            <CardContent>
              <ProbBars probs={s.probs} top={s.top_class} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-1.5 text-sm">
                <Row label="Body region" value={s.body_region} />
                <Row label="Age band" value={s.age_band} />
                <Row label="Sex" value={s.sex?.replaceAll("_", " ")} />
                <Row label="Fitzpatrick" value={s.fitzpatrick} />
                <Row label="Model version" value={s.model_version} />
                <Row label="Captured" value={s.captured_month} />
                <Row label="Consent version" value={s.consent_version} />
                <Row label="Image size" value={`${Math.round(s.image_bytes / 1024)} KB`} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Questionnaire answers</CardTitle>
            </CardHeader>
            <CardContent>
              {answers.length ? (
                <dl className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-1.5 text-sm">
                  {answers.map(([q, a]) => (
                    <Row key={q} label={q} value={a} />
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">No answers shared.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
