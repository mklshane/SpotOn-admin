"use client";

// Toggleable badge group for array-of-vocab fields (services, specialties).
// Options come from /admin/meta so the admin can only pick valid values.

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function EnumMultiSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const selected = value.includes(opt);
        return (
          <button key={opt} type="button" onClick={() => toggle(opt)}>
            <Badge
              variant={selected ? "default" : "outline"}
              className={cn("cursor-pointer select-none", !selected && "text-muted-foreground")}
            >
              {opt}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
