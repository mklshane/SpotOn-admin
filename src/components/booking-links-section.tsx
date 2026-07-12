"use client";

import { useState } from "react";
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
import { useBookingLinkMutations, usePlatforms } from "@/lib/hooks";
import type { BookingLink, Doctor } from "@/lib/api/types";

interface LinkDraft {
  id?: string;
  platform_id: string;
  url: string;
  consultation_fee: string;
  rating: string;
  review_count: string;
  is_introductory_fee: boolean;
  available_text: string;
  is_active: boolean;
  last_verified: string; // yyyy-mm-dd
  next_available: string; // datetime-local
}

const emptyDraft: LinkDraft = {
  platform_id: "",
  url: "",
  consultation_fee: "",
  rating: "",
  review_count: "",
  is_introductory_fee: false,
  available_text: "",
  is_active: true,
  last_verified: "",
  next_available: "",
};

function toDraft(link: BookingLink): LinkDraft {
  return {
    id: link.id,
    platform_id: link.platform_id,
    url: link.url,
    consultation_fee: link.consultation_fee?.toString() ?? "",
    rating: link.rating?.toString() ?? "",
    review_count: link.review_count?.toString() ?? "",
    is_introductory_fee: link.is_introductory_fee,
    available_text: link.available_text ?? "",
    is_active: link.is_active,
    last_verified: link.last_verified ?? "",
    next_available: link.next_available ? link.next_available.slice(0, 16) : "",
  };
}

export function BookingLinksSection({ doctor }: { doctor: Doctor }) {
  const { data: platforms } = usePlatforms();
  const { create, update, remove } = useBookingLinkMutations(doctor.id);
  const [draft, setDraft] = useState<LinkDraft | null>(null);

  const save = () => {
    if (!draft) return;
    if (!draft.platform_id || !draft.url.trim()) {
      toast.error("Platform and URL are required.");
      return;
    }
    const body = {
      platform_id: draft.platform_id,
      url: draft.url.trim(),
      consultation_fee: draft.consultation_fee ? Number(draft.consultation_fee) : null,
      rating: draft.rating ? Number(draft.rating) : null,
      review_count: draft.review_count ? Number(draft.review_count) : null,
      is_introductory_fee: draft.is_introductory_fee,
      available_text: draft.available_text.trim() || null,
      is_active: draft.is_active,
      last_verified: draft.last_verified || null,
      next_available: draft.next_available || null,
    };
    const opts = {
      onSuccess: () => {
        toast.success(draft.id ? "Booking link updated" : "Booking link added");
        setDraft(null);
      },
      onError: (e: unknown) => toast.error(errText(e)),
    };
    if (draft.id) update.mutate({ id: draft.id, body }, opts);
    else create.mutate(body, opts);
  };

  return (
    <Card className="max-w-3xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Booking links</CardTitle>
        <Button size="sm" onClick={() => setDraft(emptyDraft)}>
          Add link
        </Button>
      </CardHeader>
      <CardContent>
        {doctor.booking_links.length === 0 ? (
          <p className="text-sm text-muted-foreground">No booking links.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctor.booking_links.map((link) => (
                <TableRow key={link.id}>
                  <TableCell>{link.platform?.name ?? link.platform_id.slice(0, 8)}</TableCell>
                  <TableCell className="max-w-48 truncate">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      {link.url}
                    </a>
                  </TableCell>
                  <TableCell>{link.consultation_fee != null ? `₱${link.consultation_fee}` : "—"}</TableCell>
                  <TableCell>
                    {link.rating != null ? `${link.rating} (${link.review_count ?? 0})` : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {link.last_verified ?? "—"}
                    {link.next_available && (
                      <div>next: {new Date(link.next_available).toLocaleDateString()}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={link.is_active ? "secondary" : "outline"}>
                      {link.is_active ? "active" : "inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setDraft(toDraft(link))}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          update.mutate(
                            { id: link.id, body: { is_active: !link.is_active } },
                            {
                              onSuccess: () =>
                                toast.success(link.is_active ? "Link deactivated" : "Link activated"),
                              onError: (e) => toast.error(errText(e)),
                            },
                          )
                        }
                      >
                        {link.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="sm" className="text-destructive">
                            Delete
                          </Button>
                        }
                        title="Delete booking link?"
                        description="Hard delete. Prefer Deactivate — the public API already hides inactive links."
                        confirmLabel="Delete"
                        destructive
                        onConfirm={() =>
                          remove.mutate(link.id, {
                            onSuccess: () => toast.success("Booking link deleted"),
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

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit booking link" : "Add booking link"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="grid gap-3">
              <Field label="Platform">
                <Select
                  value={draft.platform_id || undefined}
                  onValueChange={(v) => setDraft({ ...draft, platform_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {(platforms ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {!p.is_active && " (inactive)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="URL">
                <Input
                  value={draft.url}
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Fee (₱)">
                  <Input
                    type="number"
                    value={draft.consultation_fee}
                    onChange={(e) => setDraft({ ...draft, consultation_fee: e.target.value })}
                  />
                </Field>
                <Field label="Rating (0–5)">
                  <Input
                    type="number"
                    step="0.1"
                    value={draft.rating}
                    onChange={(e) => setDraft({ ...draft, rating: e.target.value })}
                  />
                </Field>
                <Field label="Reviews">
                  <Input
                    type="number"
                    value={draft.review_count}
                    onChange={(e) => setDraft({ ...draft, review_count: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Availability text">
                <Input
                  value={draft.available_text}
                  onChange={(e) => setDraft({ ...draft, available_text: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Last verified">
                  <Input
                    type="date"
                    value={draft.last_verified}
                    onChange={(e) => setDraft({ ...draft, last_verified: e.target.value })}
                  />
                </Field>
                <Field label="Next available slot">
                  <Input
                    type="datetime-local"
                    value={draft.next_available}
                    onChange={(e) => setDraft({ ...draft, next_available: e.target.value })}
                  />
                </Field>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.is_introductory_fee}
                    onCheckedChange={(c) => setDraft({ ...draft, is_introductory_fee: c === true })}
                  />
                  Introductory fee
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.is_active}
                    onCheckedChange={(c) => setDraft({ ...draft, is_active: c === true })}
                  />
                  Active
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
                <Button onClick={save} disabled={create.isPending || update.isPending}>
                  {draft.id ? "Save" : "Add"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
