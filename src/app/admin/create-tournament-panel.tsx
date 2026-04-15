"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Plus, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function CreateTournamentPanel() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // banner state
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prizeTotal, setPrizeTotal] = useState("5000");
  const [entryFee, setEntryFee] = useState("150");
  const [maxTeams, setMaxTeams] = useState("16");
  const [format, setFormat] = useState("single_elimination");
  const [status, setStatus] = useState("open");
  const [registrationEnds, setRegistrationEnds] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [tags, setTags] = useState("aberto,premiado");
  const [rules, setRules] = useState(
    "Check-in obrigatorio\nTimes com 5 titulares\nFair play e respeito aos arbitros"
  );

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setBannerPreview(URL.createObjectURL(file));
    setBannerUrl(null);
    setIsUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const response = await fetch("/api/admin/upload-banner", {
        method: "POST",
        body: form,
      });

      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        setUploadError(payload.error ?? "Falha no upload da imagem.");
        setBannerPreview(null);
        return;
      }

      setBannerUrl(payload.url);
    } catch {
      setUploadError("Erro de conexao ao enviar imagem.");
      setBannerPreview(null);
    } finally {
      setIsUploading(false);
      // reset input so same file can be re-selected
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeBanner() {
    setBannerPreview(null);
    setBannerUrl(null);
    setUploadError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const response = await fetch("/api/admin/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          prizeTotal: Number(prizeTotal),
          entryFee: Number(entryFee),
          maxTeams: Number(maxTeams),
          format,
          status,
          registrationEnds: registrationEnds ? new Date(registrationEnds).toISOString() : null,
          registrationStarts: null,
          startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          endsAt: endsAt ? new Date(endsAt).toISOString() : null,
          rules: rules.split("\n").map((v) => v.trim()).filter(Boolean),
          tags: tags.split(",").map((v) => v.trim()).filter(Boolean),
          checkInRequired: true,
          checkInWindowMins: 30,
          region: "BR",
          featured: false,
          bannerUrl: bannerUrl ?? null,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFeedback({ type: "error", message: payload.error ?? "Nao foi possivel cadastrar o campeonato." });
        return;
      }

      setFeedback({ type: "success", message: "Campeonato cadastrado com sucesso." });
      setName("");
      setDescription("");
      setBannerPreview(null);
      setBannerUrl(null);
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
          <Shield className="h-4 w-4" />
          Area administrativa
        </div>
        <h2 className="text-2xl font-black tracking-tight">Cadastrar campeonato</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
          Esse formulario ja grava o campeonato no Supabase com valor de inscricao pronto para o fluxo fake de PIX.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          {/* Banner upload */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold">
              Banner do campeonato
              <span className="ml-2 text-xs font-normal text-[var(--muted-foreground)]">
                JPG, PNG ou WebP · max 5 MB · recomendado 1200×400px
              </span>
            </label>

            {bannerPreview ? (
              <div className="relative overflow-hidden rounded-xl border border-[var(--border)]">
                <Image
                  src={bannerPreview}
                  alt="Preview do banner"
                  width={1200}
                  height={400}
                  className="h-40 w-full object-cover"
                  unoptimized
                />

                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 text-sm font-semibold text-white">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Enviando...
                  </div>
                )}

                {!isUploading && bannerUrl && (
                  <div className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/20 px-2.5 py-1 text-xs font-semibold text-green-300">
                    Salvo no Supabase
                  </div>
                )}

                <button
                  type="button"
                  onClick={removeBanner}
                  className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition-colors hover:bg-black/80"
                  aria-label="Remover banner"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--secondary)]/40 text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)]/40 hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="text-sm font-medium">Clique para selecionar o banner</span>
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />

            {uploadError && (
              <p className="mt-1.5 text-xs text-red-300">{uploadError}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold">Nome do campeonato</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: BlueStrike Open #13" />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold">Descricao</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique proposta, publico e nivel do campeonato."
              className="min-h-28"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Premiacao total</label>
            <Input type="number" min={0} value={prizeTotal} onChange={(e) => setPrizeTotal(e.target.value)} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Inscricao via PIX</label>
            <Input type="number" min={0} value={entryFee} onChange={(e) => setEntryFee(e.target.value)} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Maximo de times</label>
            <Input type="number" min={2} value={maxTeams} onChange={(e) => setMaxTeams(e.target.value)} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Formato</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm"
            >
              <option value="single_elimination">Eliminacao simples</option>
              <option value="double_elimination">Eliminacao dupla</option>
              <option value="round_robin">Round robin</option>
              <option value="swiss">Swiss</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm"
            >
              <option value="upcoming">Em breve</option>
              <option value="open">Inscricoes abertas</option>
              <option value="ongoing">Em andamento</option>
              <option value="finished">Finalizado</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Inscricoes ate</label>
            <Input type="datetime-local" value={registrationEnds} onChange={(e) => setRegistrationEnds(e.target.value)} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Inicio</label>
            <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Fim</label>
            <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Tags</label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="aberto,premiado,hub" />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold">Regras</label>
            <Textarea value={rules} onChange={(e) => setRules(e.target.value)} className="min-h-24" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-[var(--muted-foreground)]">
            Admins podem ser cadastrados no Supabase alterando <code className="font-mono">public.profiles.is_admin</code> para <code className="font-mono">true</code>.
          </div>
          <Button
            type="submit"
            variant="gradient"
            className="gap-2"
            disabled={isPending || isUploading}
          >
            <Plus className="h-4 w-4" />
            {isPending ? "Salvando..." : isUploading ? "Aguardando upload..." : "Criar campeonato"}
          </Button>
        </div>

        {feedback && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-green-500/20 bg-green-500/10 text-green-200"
                : "border-red-500/20 bg-red-500/10 text-red-200"
            }`}
          >
            {feedback.message}
          </div>
        )}
      </form>
    </section>
  );
}
