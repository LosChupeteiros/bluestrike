"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Shield, Users, Lock, Eye, EyeOff, CheckCircle2, Plus, Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CreateTeamFormProps {
  backHref: string;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export default function CreateTeamForm({ backHref }: CreateTeamFormProps) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const slug = slugify(name);
  const tagValid = tag.trim().length >= 2 && tag.trim().length <= 5;
  const nameValid = name.trim().length >= 3;
  const canSubmit = nameValid && tagValid && (!usePassword || password.trim().length >= 4);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    startTransition(async () => {
      // TODO: replace with real API call to /api/teams (POST)
      // const res = await fetch("/api/teams", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ name, tag, description, password: usePassword ? password : null }),
      // });
      // const data = await res.json();
      // router.push(`/teams/${data.slug}`);
      await new Promise((r) => setTimeout(r, 800));
      alert(`Time "${name}" criado! Em breve você será redirecionado para a página do time.`);
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Identity */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                <Shield className="h-4 w-4" />
                Identidade
              </div>
              <h2 className="text-2xl font-black tracking-tight">Nome e tag do time</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                Escolha um nome único. A tag aparece nas partidas — máx. 5 caracteres.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_160px]">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Nome do time <span className="text-red-400">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: BlueStrike Prime"
                  maxLength={48}
                />
                {slug && (
                  <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                    URL: <span className="font-mono text-[var(--foreground)]">/teams/{slug}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Tag <span className="text-red-400">*</span>
                </label>
                <Input
                  value={tag}
                  onChange={(e) => setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5))}
                  placeholder="BSP"
                  maxLength={5}
                  className="font-mono tracking-widest"
                />
                <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">2–5 caracteres</p>
              </div>
            </div>
          </section>

          {/* Description */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="mb-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                <Users className="h-4 w-4" />
                Sobre o time
              </div>
              <h2 className="text-xl font-black tracking-tight">Apresentação</h2>
            </div>

            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o estilo de jogo do time, faixa de ELO esperada, dias e horários de treino..."
              maxLength={400}
              className="min-h-28"
            />
            <p className="mt-1.5 text-right text-xs text-[var(--muted-foreground)]">
              {description.length}/400
            </p>
          </section>

          {/* Password */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="mb-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                <Lock className="h-4 w-4" />
                Controle de acesso
              </div>
              <h2 className="text-xl font-black tracking-tight">Senha de entrada</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                Opcional. Jogadores que receberem seu link de convite precisarão digitar a senha para entrar.
              </p>
            </div>

            <label className="mb-4 flex cursor-pointer items-center gap-3">
              <div
                role="checkbox"
                aria-checked={usePassword}
                tabIndex={0}
                onClick={() => setUsePassword((v) => !v)}
                onKeyDown={(e) => e.key === "Enter" && setUsePassword((v) => !v)}
                className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                  usePassword
                    ? "border-[var(--primary)] bg-[var(--primary)]"
                    : "border-[var(--border)] bg-transparent"
                }`}
              >
                {usePassword && <CheckCircle2 className="h-3 w-3 text-black" />}
              </div>
              <span className="text-sm font-medium">Proteger entrada com senha</span>
            </label>

            {usePassword && (
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  minLength={4}
                  maxLength={32}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}
          </section>

          {/* Submit */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black tracking-tight">Tudo pronto?</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Depois de criar, você receberá o link de convite para compartilhar com a sua line.
                </p>
              </div>

              <div className="flex gap-2">
                <Button asChild variant="outline" size="lg" type="button">
                  <Link href={backHref}>Cancelar</Link>
                </Button>
                <Button
                  size="lg"
                  variant="gradient"
                  type="submit"
                  disabled={!canSubmit || isPending}
                >
                  <Plus className="h-4 w-4" />
                  {isPending ? "Criando..." : "Criar time"}
                </Button>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
              <Info className="h-4 w-4" />
              Como funciona
            </div>

            <ol className="space-y-4 text-sm">
              {[
                {
                  step: "1",
                  title: "Crie o time",
                  desc: "Você vira capitão automaticamente. Defina nome, tag e senha opcional.",
                },
                {
                  step: "2",
                  title: "Compartilhe o convite",
                  desc: "Um link único é gerado. Envie para seus amigos pelo Discord, WhatsApp ou onde preferir.",
                },
                {
                  step: "3",
                  title: "Jogadores entram",
                  desc: "Cada um acessa o link, cria sua conta Steam e entra no time.",
                },
                {
                  step: "4",
                  title: "Capitão distribui funções",
                  desc: "Com 5 titulares, o capitão define as funções in-game e libera inscrição em campeonatos.",
                },
              ].map((item) => (
                <li key={item.step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-xs font-black text-[var(--primary)]">
                    {item.step}
                  </span>
                  <div>
                    <div className="font-semibold">{item.title}</div>
                    <div className="mt-0.5 text-[var(--muted-foreground)]">{item.desc}</div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
              <Users className="h-4 w-4" />
              Resumo
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Nome</span>
                <span className="font-medium truncate ml-4 max-w-[160px] text-right">{name || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Tag</span>
                <span className="font-mono font-bold">{tag || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Acesso</span>
                <Badge variant={usePassword ? "upcoming" : "open"}>
                  {usePassword ? "Com senha" : "Aberto"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Você</span>
                <Badge variant="gold">Capitão</Badge>
              </div>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
