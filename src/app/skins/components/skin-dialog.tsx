"use client";

import { useRef, useState, useTransition } from "react";
import { Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { saveSkin } from "../actions";

const WEAR_PRESETS = [
  { label: "FN", fullLabel: "Factory New", value: 0.0 },
  { label: "MW", fullLabel: "Minimal Wear", value: 0.07 },
  { label: "FT", fullLabel: "Field-Tested", value: 0.15 },
  { label: "WW", fullLabel: "Well-Worn", value: 0.38 },
  { label: "BS", fullLabel: "Battle-Scarred", value: 0.45 },
];

interface SkinDialogProps {
  defindex: number;
  paintId: number;
  paintName: string;
  currentWear: number;
  currentSeed: number;
  team: number;
}

export function SkinDialog({ defindex, paintId, paintName, currentWear, currentSeed, team }: SkinDialogProps) {
  const [open, setOpen] = useState(false);
  const [wear, setWear] = useState(currentWear.toFixed(2));
  const [seed, setSeed] = useState(String(currentSeed));
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleWearPreset(value: number) {
    setWear(value.toFixed(2));
  }

  function handleRandomSeed() {
    setSeed(String(Math.floor(Math.random() * 1001)));
  }

  function handleSubmit() {
    const fd = new FormData();
    fd.set("defindex", String(defindex));
    fd.set("paintId", String(paintId));
    fd.set("wear", wear);
    fd.set("seed", seed);
    fd.set("team", String(team));

    startTransition(async () => {
      await saveSkin(fd);
      setOpen(false);
    });
  }

  const wearNum = parseFloat(wear);
  const activePreset = WEAR_PRESETS.find((p) => Math.abs(p.value - wearNum) < 0.001);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mt-2 text-xs">
          Ajustes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{paintName}</DialogTitle>
        </DialogHeader>

        <form ref={formRef} className="space-y-4">
          <div>
            <p className="text-xs text-[var(--muted-foreground)] mb-2">Desgaste</p>
            <div className="flex gap-1 mb-2">
              {WEAR_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  title={p.fullLabel}
                  onClick={() => handleWearPreset(p.value)}
                  className={cn(
                    "flex-1 rounded px-1 py-1 text-[10px] font-bold transition-colors border",
                    activePreset?.value === p.value
                      ? "bg-[var(--primary)] text-black border-[var(--primary)]"
                      : "bg-[var(--secondary)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--primary)]/40"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.001"
              value={wear}
              onChange={(e) => setWear(e.target.value)}
              className="h-8 text-sm font-mono"
            />
          </div>

          <div>
            <p className="text-xs text-[var(--muted-foreground)] mb-2">Padrão (seed)</p>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                max="1000"
                value={seed}
                onChange={(e) => {
                  const v = Math.min(1000, Math.max(0, parseInt(e.target.value) || 0));
                  setSeed(String(v));
                }}
                className="h-8 text-sm font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 shrink-0"
                title="Aleatório"
                onClick={handleRandomSeed}
              >
                <Dices className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" size="sm">
              Cancelar
            </Button>
          </DialogClose>
          <Button size="sm" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Aplicando..." : "Aplicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
