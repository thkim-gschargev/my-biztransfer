import type { ReactNode } from "react";

interface PageTitleProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageTitle({ title, description, children }: PageTitleProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      )}
    </div>
  );
}
