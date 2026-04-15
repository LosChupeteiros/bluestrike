"use client";

import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ProfileModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  widthClassName?: string;
}

export default function ProfileModalShell({
  open,
  onClose,
  title,
  description,
  children,
  widthClassName = "max-w-3xl",
}: ProfileModalShellProps) {
  const titleId = useId();
  const descriptionId = useId();
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || !portalTarget) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/84 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`flex max-h-[calc(100vh-3rem)] w-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[var(--background)] shadow-[0_32px_120px_rgba(0,0,0,0.55)] ${widthClassName}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-[linear-gradient(135deg,rgba(8,24,36,0.95),rgba(4,10,16,0.9))] px-6 py-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-black tracking-tight text-[var(--foreground)]">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)]/35 hover:text-[var(--foreground)]"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth" style={{ WebkitOverflowScrolling: "touch" }}>{children}</div>
      </div>
    </div>,
    portalTarget
  );
}
