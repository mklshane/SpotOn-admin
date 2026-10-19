"use client";

import { useState } from "react";

import { errText } from "@/components/form-field";
import { Pager } from "@/components/pager";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuditLog } from "@/lib/hooks";

const LIMIT = 100;

const ACTION_LABEL: Record<string, string> = {
  list: "Listed",
  view_image: "Viewed image",
  label: "Labelled",
  delete: "Deleted",
  export: "Exported",
};

function detailText(detail: unknown): string {
  if (detail === null || detail === undefined || detail === "") return "—";
  if (typeof detail === "string") return detail;
  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
}

/** Read-only log of admin access to shared research data. */
export default function AuditPage() {
  const [offset, setOffset] = useState(0);
  const { data, isLoading, error } = useAuditLog({ limit: LIMIT, offset });
  const items = data?.items ?? [];

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          Every admin view, label, delete and export of shared research data. Review monthly.
          {data ? ` ${data.total} entries.` : ""}
        </p>
      </div>

      {error && <p className="text-sm text-destructive">Failed to load the audit log: {errText(error)}</p>}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_2px_8px_rgb(122_74_43/0.06)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !items.length && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No audit entries.
                </TableCell>
              </TableRow>
            )}
            {items.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(e.created_at).toLocaleString()}
                </TableCell>
                <TableCell className="text-sm">{e.admin_email ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={e.action === "delete" || e.action === "export" ? "default" : "secondary"}>
                    {ACTION_LABEL[e.action] ?? e.action}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-56 truncate font-mono text-xs" title={e.target ?? ""}>
                  {e.target ?? "—"}
                </TableCell>
                <TableCell className="max-w-96 truncate text-xs text-muted-foreground" title={detailText(e.detail)}>
                  {detailText(e.detail)}
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
