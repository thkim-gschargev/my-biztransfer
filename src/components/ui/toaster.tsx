"use client";

import { useSyncExternalStore } from "react";
import { CheckCircle2Icon, AlertCircleIcon, InfoIcon, XIcon } from "lucide-react";
import {
  subscribeToasts,
  getToastsSnapshot,
  getServerSnapshot,
  toast,
  type ToastVariant,
} from "@/lib/toast";
import { cn } from "@/lib/utils";

const VARIANT_STYLES: Record<ToastVariant, string> = {
  default: "border-border bg-card text-card-foreground",
  error: "border-destructive/40 bg-destructive text-white",
  success:
    "border-green-500/40 bg-green-50 text-green-800 dark:bg-green-950/80 dark:text-green-200",
};

const VARIANT_ICON = {
  default: InfoIcon,
  error: AlertCircleIcon,
  success: CheckCircle2Icon,
} as const;

export function Toaster() {
  const toasts = useSyncExternalStore(
    subscribeToasts,
    getToastsSnapshot,
    getServerSnapshot,
  );

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = VARIANT_ICON[t.variant];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2.5 shadow-lg",
              "animate-in slide-in-from-bottom-2 fade-in",
              VARIANT_STYLES[t.variant],
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1 text-sm leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              aria-label="닫기"
              className="shrink-0 rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
