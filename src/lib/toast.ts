// 의존성 없는 경량 toast 스토어. 모듈 레벨 이벤트 emitter + <Toaster /> 구독 패턴.
// Context 없이 어디서든(프로바이더, 일반 함수 포함) toast.error(...) 호출 가능.

export type ToastVariant = "default" | "error" | "success";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();
const AUTO_DISMISS_MS = 4000;

function emit(): void {
  for (const listener of listeners) listener(toasts);
}

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function dismiss(id: string): void {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function push(message: string, variant: ToastVariant): string {
  const id = genId();
  toasts = [...toasts, { id, message, variant }];
  emit();
  if (typeof window !== "undefined") {
    window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
  }
  return id;
}

export const toast = {
  show: (message: string) => push(message, "default"),
  error: (message: string) => push(message, "error"),
  success: (message: string) => push(message, "success"),
  dismiss,
};

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToastsSnapshot(): ToastItem[] {
  return toasts;
}

const EMPTY: ToastItem[] = [];
export function getServerSnapshot(): ToastItem[] {
  return EMPTY;
}
