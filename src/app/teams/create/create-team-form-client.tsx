"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Lock,
  Plus,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CreateTeamFormProps {
  backHref: string;
  successRedirectPath: string;
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

export default function CreateTeamFormClient({ backHref, successRedirectPath }: CreateTeamFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [successPayload, setSuccessPayload] = useState<{
    name: string;
    tag: string;
    teamPath: string;
  } | null>(null);

  const slug = slugify(name);
  const tagValid = tag.trim().length >= 2 && tag.trim().length <= 5;
  const nameValid = name.trim().length >= 3;
  const canSubmit = nameValid && tagValid && (!usePassword || password.trim().length >= 4);

  useEffect(() => {
    if (!successPayload) {
      return;
    }

    const timeout = window.setTimeout(() => {
      router.push(successRedirectPath);
    }, 1400);

    return () => window.clearTimeout(timeout);
  }, [router, successPayload, successRedirectPath]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/teams", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            tag,
            description,
            password: usePassword ? password : null,
          }),
        });

        const payload = (await response.json()) as {
          error?: string;
          team?: {
            name: string;
            tag: string;
            slug: string;
          };
        };

        if (!response.ok || !payload.team) {
          throw new Error(payload.error ?? "Nao foi possivel criar o time.");
        }

        setSuccessPayload({
          name: payload.team.name,
          tag: payload.team.tag,
          teamPath: `/teams/${payload.team.slug}`,
        });
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Nao foi possivel criar o time.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                <Shield className="h-4 w-4" />
                Identidade
              </div>
              <h2 className="text-2xl font-black tracking-tight">Nome e tag do time</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                Escolha um nome unico. A tag aparece nas partidas e vira parte da identidade publica da line.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_160px]">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Nome do time <span className="text-red-400">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
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
                  onChange={(event) =>
                    setTag(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5))
                  }
                  placeholder="BSP"
                  maxLength={5}
                  className="font-mono tracking-widest"
                />
                <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">2-5 caracteres</p>
              </div>
            </div>

            {feedback && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {feedback}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="mb-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                <Users className="h-4 w-4" />
                Sobre o time
              </div>
              <h2 className="text-xl font-black tracking-tight">Apresentacao</h2>
            </div>

            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descreva estilo de jogo, faixa de ELO, rotina de treino e o tipo de jogador que encaixa na line."
              maxLength={400}
              className="min-h-28"
            />
            <p className="mt-1.5 text-right text-xs text-[var(--muted-foreground)]">
              {description.length}/400
            </p>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="mb-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                <Lock className="h-4 w-4" />
                Controle de acesso
              </div>
              <h2 className="text-xl font-black tracking-tight">Senha de entrada</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                Opcional. Se ativar, cada jogador do convite vai precisar informar essa senha antes de entrar.
              </p>
            </div>

            <label className="mb-4 flex cursor-pointer items-center gap-3">
              <div
                role="checkbox"
                aria-checked={usePassword}
                tabIndex={0}
                onClick={() => setUsePassword((value) => !value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setUsePassword((value) => !value);
                  }
                }}
                className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
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
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimo 4 caracteres"
                  minLength={4}
                  maxLength={32}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black tracking-tight">Tudo pronto?</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Assim que criar, o time ja entra no catalogo e voce vira capitao automaticamente.
                </p>
              </div>

              <div className="flex gap-2">
                <Button asChild variant="outline" size="lg" type="button">
                  <Link href={backHref}>Cancelar</Link>
                </Button>
                <Button size="lg" variant="gradient" type="submit" disabled={!canSubmit || isPending}>
                  <Plus className="h-4 w-4" />
                  {isPending ? "Criando..." : "Criar time"}
                </Button>
              </div>
            </div>
          </section>
        </div>

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
                  desc: "Voce vira capitao automaticamente e ganha a pagina publica da equipe.",
                },
                {
                  step: "2",
                  title: "Compartilhe o convite",
                  desc: "O codigo de entrada fica disponivel para voce levar a line pelo Discord ou WhatsApp.",
                },
                {
                  step: "3",
                  title: "Feche os 5 titulares",
                  desc: "Com a line principal completa, a equipe ja fica pronta para se inscrever em campeonatos.",
                },
                {
                  step: "4",
                  title: "Gerencie a equipe",
                  desc: "Na pagina do time voce pode expulsar jogadores, ajustar vagas e excluir a equipe se precisar.",
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
                <span className="ml-4 max-w-[160px] truncate text-right font-medium">{name || "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Tag</span>
                <span className="font-mono font-bold">{tag || "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Acesso</span>
                <Badge variant={usePassword ? "upcoming" : "open"}>
                  {usePassword ? "Com senha" : "Aberto"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Voce</span>
                <Badge variant="gold">Capitao</Badge>
              </div>
            </div>
          </section>
        </div>
      </div>

      {successPayload && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-green-500/20 bg-[var(--card)] p-6 shadow-2xl">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/15 text-green-300">
              <Sparkles className="h-6 w-6" />
            </div>

            <div className="mb-2 text-sm font-semibold text-green-300">Time criado com sucesso</div>
            <h3 className="text-2xl font-black tracking-tight">
              {successPayload.name} <span className="text-[var(--primary)]">[{successPayload.tag}]</span>
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
              O time ja entrou no hub, aparece no catalogo publico e estamos te levando para a aba
              de time do seu perfil agora.
            </p>

            <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                URL do time
              </div>
              <div className="mt-2 font-mono text-sm text-[var(--foreground)]">{successPayload.teamPath}</div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <span className="text-xs text-[var(--muted-foreground)]">Redirecionando...</span>
              <Button
                type="button"
                variant="gradient"
                className="gap-2"
                onClick={() => {
                  router.push(successRedirectPath);
                }}
              >
                Ir agora
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
