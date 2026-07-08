"use client";

import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { errText, Field } from "@/components/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { usePlatformMutations, usePlatforms } from "@/lib/hooks";
import type { Platform } from "@/lib/api/types";

interface Draft {
  id?: string;
  slug: string;
  name: string;
  website: string;
  booking_url: string;
  description: string;
  is_dedicated_derma: boolean;
  is_active: boolean;
}

const emptyDraft: Draft = {
  slug: "",
  name: "",
  website: "",
  booking_url: "",
  description: "",
  is_dedicated_derma: false,
  is_active: true,
};

export default function PlatformsPage() {
  const { data: platforms, isLoading, error } = usePlatforms();
  const { create, update, remove } = usePlatformMutations();
  const [draft, setDraft] = useState<Draft | null>(null);

  const save = () => {
    if (!draft) return;
    if (!draft.slug.trim() || !draft.name.trim() || !draft.website.trim()) {
      toast.error("Slug, name and website are required.");
      return;
    }
    const body = {
      slug: draft.slug.trim(),
      name: draft.name.trim(),
      website: draft.website.trim(),
      booking_url: draft.booking_url.trim() || null,
      description: draft.description.trim() || null,
      is_dedicated_derma: draft.is_dedicated_derma,
      is_active: draft.is_active,
    };
    const opts = {
      onSuccess: () => {
        toast.success(draft.id ? "Platform updated" : "Platform created");
        setDraft(null);
      },
      onError: (e: unknown) => toast.error(errText(e)),
    };
    if (draft.id) update.mutate({ id: draft.id, body }, opts);
    else create.mutate(body, opts);
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Telemedicine platforms</h1>
        <Button onClick={() => setDraft(emptyDraft)}>New platform</Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">Failed to load platforms. Is the API running?</p>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Derma-only</TableHead>
              <TableHead>Status</TableHead>
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
            {(platforms ?? []).map((p: Platform) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="font-mono text-xs">{p.slug}</TableCell>
                <TableCell className="max-w-48 truncate">
                  <a
                    href={p.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    {p.website}
                  </a>
                </TableCell>
                <TableCell>{p.is_dedicated_derma ? "yes" : "no"}</TableCell>
                <TableCell>
                  <Badge variant={p.is_active ? "secondary" : "outline"}>
                    {p.is_active ? "active" : "inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setDraft({
                          id: p.id,
                          slug: p.slug,
                          name: p.name,
                          website: p.website,
                          booking_url: p.booking_url ?? "",
                          description: p.description ?? "",
                          is_dedicated_derma: p.is_dedicated_derma,
                          is_active: p.is_active,
                        })
                      }
                    >
                      Edit
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="sm">
                          {p.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      }
                      title={p.is_active ? "Deactivate platform?" : "Activate platform?"}
                      description={
                        p.is_active
                          ? "Hides it from the public platform list. Mobile offline caches pick this up on their next full refresh."
                          : "Makes it visible in the public platform list again."
                      }
                      confirmLabel={p.is_active ? "Deactivate" : "Activate"}
                      onConfirm={() =>
                        update.mutate(
                          { id: p.id, body: { is_active: !p.is_active } },
                          {
                            onSuccess: () => toast.success("Platform updated"),
                            onError: (e) => toast.error(errText(e)),
                          },
                        )
                      }
                    />
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="sm" className="text-destructive">
                          Delete
                        </Button>
                      }
                      title="Permanently delete platform?"
                      description="Fails if any booking links still reference it. Prefer Deactivate."
                      confirmLabel="Delete permanently"
                      destructive
                      onConfirm={() =>
                        remove.mutate(
                          { id: p.id, hard: true },
                          {
                            onSuccess: () => toast.success("Platform deleted"),
                            onError: (e) => toast.error(errText(e)),
                          },
                        )
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit platform" : "New platform"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name">
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  />
                </Field>
                <Field label="Slug">
                  <Input
                    placeholder="lowercase-slug"
                    value={draft.slug}
                    onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Website">
                <Input
                  value={draft.website}
                  onChange={(e) => setDraft({ ...draft, website: e.target.value })}
                />
              </Field>
              <Field label="Booking URL">
                <Input
                  value={draft.booking_url}
                  onChange={(e) => setDraft({ ...draft, booking_url: e.target.value })}
                />
              </Field>
              <Field label="Description">
                <Textarea
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </Field>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.is_dedicated_derma}
                    onCheckedChange={(c) => setDraft({ ...draft, is_dedicated_derma: c === true })}
                  />
                  Dedicated derma
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
                  {draft.id ? "Save" : "Create"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
