"use client";

import { useEffect, useRef, useState } from "react";
import type * as ThreeNS from "three";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Karambit girando, construída por código.
 *
 * Geometria procedural em vez de mesh baixado: o modelo é código legível e
 * versionável, sem um `.glb` de vários MB para o usuário baixar.
 *
 * ── Dois erros que a primeira versão cometeu, documentados para não voltarem ──
 *
 * 1. **Lâmina sem espessura.** O contorno era duas curvas bézier soltas que
 *    acabaram quase sobrepostas, e o resultado foi uma lasca. Agora a forma sai
 *    de uma linha de centro com largura aplicada ponto a ponto
 *    (`perfilComEspessura`): não tem como sair fina por acidente.
 *
 * 2. **Metal preto.** `metalness` alto sem mapa de ambiente renderiza quase
 *    preto, porque material metálico não tem componente difusa — ele só
 *    reflete, e sem nada em volta não há o que refletir. Daí o objeto escuro e
 *    azulado. A correção é o `envMap` gerado abaixo: um degradê em memória que
 *    dá ao aço alguma coisa para espelhar.
 *
 * ── Regras de performance ────────────────────────────────────────────────────
 * - Three.js só é importado quando o bloco entra na tela.
 * - O laço de render morre fora da tela e com a aba escondida.
 * - Sem WebGL ou com `prefers-reduced-motion`, o fundo estático fica no lugar.
 * - `pixelRatio` no teto de 2.
 */
export default function KnifeShowcase({ className }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

    let limpar: (() => void) | undefined;
    let cancelado = false;

    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        observer.disconnect();

        (async () => {
          try {
            const THREE = await import("three");
            if (cancelado || !host.current) return;

            const largura = host.current.clientWidth;
            const altura = host.current.clientHeight;
            if (largura === 0 || altura === 0) return;

            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.setSize(largura, altura);
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.15;
            renderer.domElement.style.cssText = "width:100%;height:100%;display:block";
            host.current.appendChild(renderer.domElement);

            const cena = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(36, largura / altura, 0.1, 100);
            camera.position.set(0, 0, 6.4);

            // ── Ambiente para o metal refletir ─────────────────────────────
            // Degradê vertical gerado em memória: escuro embaixo, ciano da
            // marca em cima. É o que transforma o aço de uma silhueta preta
            // numa superfície com brilho.
            const LADO = 32;
            const dados = new Uint8Array(LADO * LADO * 4);
            for (let y = 0; y < LADO; y++) {
              const t = y / (LADO - 1);
              const r = Math.round(10 + t * 24);
              const g = Math.round(16 + t * 120);
              const b = Math.round(24 + t * 168);
              for (let x = 0; x < LADO; x++) {
                const i = (y * LADO + x) * 4;
                dados[i] = r; dados[i + 1] = g; dados[i + 2] = b; dados[i + 3] = 255;
              }
            }
            const textura = new THREE.DataTexture(dados, LADO, LADO, THREE.RGBAFormat);
            textura.mapping = THREE.EquirectangularReflectionMapping;
            textura.needsUpdate = true;
            const pmrem = new THREE.PMREMGenerator(renderer);
            const ambiente = pmrem.fromEquirectangular(textura).texture;
            cena.environment = ambiente;
            pmrem.dispose();
            textura.dispose();

            // ── Luz ────────────────────────────────────────────────────────
            // Chave neutra para a forma se ler, e duas laterais nas cores dos
            // lados só no contorno. Colorir a luz principal tinge o metal
            // inteiro e ele deixa de parecer aço.
            cena.add(new THREE.AmbientLight(0xffffff, 0.35));
            const chave = new THREE.DirectionalLight(0xffffff, 2.1);
            chave.position.set(-3, 4, 6);
            cena.add(chave);
            const contornoCiano = new THREE.DirectionalLight(0x00c8ff, 2.6);
            contornoCiano.position.set(-5, 1, -3);
            cena.add(contornoCiano);
            const contornoLaranja = new THREE.DirectionalLight(0xfb923c, 1.3);
            contornoLaranja.position.set(5, -2, -2);
            cena.add(contornoLaranja);

            /**
             * Percorre a curva e abre `largura(t)` em cada ponto, metade para
             * cada lado da normal. Garante espessura por construção.
             */
            const perfilComEspessura = (
              curva: ThreeNS.CubicBezierCurve,
              largura: (t: number) => number,
              amostras = 90
            ) => {
              const pts = curva.getPoints(amostras);
              const esq: ThreeNS.Vector2[] = [];
              const dir: ThreeNS.Vector2[] = [];

              for (let i = 0; i < pts.length; i++) {
                const p = pts[i];
                const a = pts[Math.max(0, i - 1)];
                const b = pts[Math.min(pts.length - 1, i + 1)];
                const tx = b.x - a.x;
                const ty = b.y - a.y;
                const len = Math.hypot(tx, ty) || 1;
                const nx = -ty / len;
                const ny = tx / len;
                const w = largura(i / (pts.length - 1)) / 2;
                esq.push(new THREE.Vector2(p.x + nx * w, p.y + ny * w));
                dir.push(new THREE.Vector2(p.x - nx * w, p.y - ny * w));
              }

              const forma = new THREE.Shape();
              forma.moveTo(esq[0].x, esq[0].y);
              for (let i = 1; i < esq.length; i++) forma.lineTo(esq[i].x, esq[i].y);
              for (let i = dir.length - 1; i >= 0; i--) forma.lineTo(dir[i].x, dir[i].y);
              forma.closePath();
              return forma;
            };

            const aco = new THREE.MeshStandardMaterial({
              color: 0xc9d2e0,
              metalness: 0.82,
              roughness: 0.24,
              envMapIntensity: 1.5,
            });
            const grafite = new THREE.MeshStandardMaterial({
              color: 0x23262d,
              metalness: 0.35,
              roughness: 0.72,
              envMapIntensity: 0.7,
            });

            const faca = new THREE.Group();

            // Lâmina: gancho da karambit, curvando de volta sobre si mesma.
            const espinha = new THREE.CubicBezierCurve(
              new THREE.Vector2(-0.12, -0.08),
              new THREE.Vector2(1.45, 0.05),
              new THREE.Vector2(1.8, 1.15),
              new THREE.Vector2(0.42, 1.38)
            );
            const lamina = new THREE.Mesh(
              new THREE.ExtrudeGeometry(
                perfilComEspessura(espinha, (t) => 0.46 * (1 - t) ** 0.7 + 0.04),
                { depth: 0.1, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 2 }
              ),
              aco
            );
            lamina.position.z = -0.05;
            faca.add(lamina);

            // Punho, saindo da base da lâmina.
            const punhoCurva = new THREE.CubicBezierCurve(
              new THREE.Vector2(-0.08, -0.05),
              new THREE.Vector2(-0.48, -0.42),
              new THREE.Vector2(-0.82, -0.78),
              new THREE.Vector2(-1.02, -1.1)
            );
            const punho = new THREE.Mesh(
              new THREE.ExtrudeGeometry(
                perfilComEspessura(punhoCurva, () => 0.34),
                { depth: 0.14, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.035, bevelSegments: 2 }
              ),
              grafite
            );
            punho.position.z = -0.07;
            faca.add(punho);

            // Anel do dedo — a assinatura da karambit.
            const anel = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.082, 14, 40), aco);
            anel.position.set(-1.18, -1.28, 0);
            faca.add(anel);

            // Centraliza para girar em torno do próprio eixo, não de um canto.
            const caixa = new THREE.Box3().setFromObject(faca);
            faca.position.sub(caixa.getCenter(new THREE.Vector3()));

            const envelope = new THREE.Group();
            envelope.add(faca);
            envelope.rotation.set(0.2, 0, 0.35);
            cena.add(envelope);

            // ── Laço ───────────────────────────────────────────────────────
            let raf = 0;
            let ultimo = performance.now();
            let rodando = true;

            const render = (agora: number) => {
              if (cancelado) return;
              const dt = Math.min((agora - ultimo) / 1000, 0.05);
              ultimo = agora;

              envelope.rotation.y += dt * 0.5;
              envelope.rotation.x = 0.2 + Math.sin(agora / 2800) * 0.11;

              renderer.render(cena, camera);
              if (rodando) raf = requestAnimationFrame(render);
            };
            raf = requestAnimationFrame(render);
            setAtivo(true);

            const aoTrocarVisibilidade = () => {
              if (document.hidden) {
                rodando = false;
                cancelAnimationFrame(raf);
              } else if (!rodando && !cancelado) {
                rodando = true;
                ultimo = performance.now();
                raf = requestAnimationFrame(render);
              }
            };
            document.addEventListener("visibilitychange", aoTrocarVisibilidade);

            const observerVisivel = new IntersectionObserver(
              ([e]) => {
                if (e.isIntersecting && !rodando && !document.hidden && !cancelado) {
                  rodando = true;
                  ultimo = performance.now();
                  raf = requestAnimationFrame(render);
                } else if (!e.isIntersecting) {
                  rodando = false;
                  cancelAnimationFrame(raf);
                }
              },
              { threshold: 0 }
            );
            observerVisivel.observe(el);

            const aoRedimensionar = () => {
              if (!host.current) return;
              const w = host.current.clientWidth;
              const h = host.current.clientHeight;
              if (w === 0 || h === 0) return;
              camera.aspect = w / h;
              camera.updateProjectionMatrix();
              renderer.setSize(w, h);
            };
            const ro = new ResizeObserver(aoRedimensionar);
            ro.observe(el);

            limpar = () => {
              rodando = false;
              cancelAnimationFrame(raf);
              document.removeEventListener("visibilitychange", aoTrocarVisibilidade);
              observerVisivel.disconnect();
              ro.disconnect();
              // Descarte explícito: sem isto o contexto WebGL e os buffers
              // ficam presos e o navegador acaba derrubando contextos antigos.
              cena.traverse((obj) => {
                const m = obj as ThreeNS.Mesh;
                m.geometry?.dispose?.();
                const mat = m.material;
                if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
                else mat?.dispose?.();
              });
              ambiente.dispose();
              renderer.dispose();
              renderer.domElement.remove();
            };
          } catch {
            // Sem WebGL ou import falhou: o fundo estático fica no lugar.
          }
        })();
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => {
      cancelado = true;
      observer.disconnect();
      limpar?.();
    };
  }, []);

  return (
    <div className={className}>
      <div ref={host} className="relative h-full w-full">
        {/* Fundo estático — aparece antes da cena carregar e permanece se o
            WebGL não estiver disponível. */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${ativo ? "opacity-0" : "opacity-100"}`}
        >
          <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)]/10 blur-3xl" />
        </div>
      </div>
    </div>
  );
}
