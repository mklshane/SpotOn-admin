"use client";

import { Button } from "@/components/ui/button";

export function Pager({
  offset,
  limit,
  count,
  hasMore,
  onOffsetChange,
}: {
  offset: number;
  limit: number;
  count: number;
  hasMore: boolean;
  onOffsetChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center justify-between pt-3">
      <span className="text-sm text-muted-foreground">
        {count === 0 ? "No rows" : `Rows ${offset + 1}–${offset + count}`}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={offset === 0}
          onClick={() => onOffsetChange(Math.max(0, offset - limit))}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasMore}
          onClick={() => onOffsetChange(offset + limit)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
