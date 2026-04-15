"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  current: "cards" | "list";
}

export default function ViewToggle({ current }: ViewToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function switchView(view: "cards" | "list") {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "cards") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    params.delete("page");
    const suffix = params.toString();
    router.push(suffix ? `/players?${suffix}` : "/players");
  }

  const base =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors";
  const active = "bg-[var(--primary)]/15 text-[var(--primary)]";
  const inactive =
    "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]";

  return (
    <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1">
      <button
        type="button"
        aria-label="Cards"
        onClick={() => switchView("cards")}
        className={cn(base, current === "cards" ? active : inactive)}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Lista"
        onClick={() => switchView("list")}
        className={cn(base, current === "list" ? active : inactive)}
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
