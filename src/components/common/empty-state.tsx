import type { ReactNode } from "react";
import { InboxIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function EmptyState({ title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground/50">
        <InboxIcon className="h-7 w-7" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
