import { ShieldCheckIcon } from "lucide-react";

/** Reminder shown on research pages: every sensitive admin action is audited server-side. */
export function AuditNotice() {
  return (
    <p className="flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <ShieldCheckIcon className="size-4 shrink-0" aria-hidden />
      Every image view, label, delete and export is recorded in the audit log.
    </p>
  );
}
