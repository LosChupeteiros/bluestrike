"use client";

import { useEffect, useRef, useState } from "react";
import type * as ThreeNS from "three";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Faca de CS2 girando, construída por código.
 *
 * Geometria procedural em vez de mesh baixado: o modelo é código legível e
 * versionável, e não há um `.glb` de vários MB para o usuário baixar. A
 * silhueta é a de uma karambit — lâmina curva, cabo com anel — que é a faca
 * mais reconhecível do jogo.
 *
 * Regras que este componente segue à risca, porque WebGL numa página que
 * precisa ser fluida é fácil de fazer errado:
 *
 * - **Nada carrega antes de precisar.** O Three.js só é importado quando o
 *   bloco entra na tela. Quem nunca rola até aqui não paga os ~150 KB.
 * - **Para quando não está visível.** O laço de render morre ao sair da tela e
 *   com a aba em segundo plano; uma cena girando atrás de outra aba é bateria
 *   queimada à toa.
 * - **Falha em silêncio.** Sem WebGL, com `prefers-reduced-motion` ou se o
 *   import falhar, o fundo estático abaixo continua lá e ninguém vê erro.
 * - **Resolução limitada.** `pixelRatio` no teto de 2: em telas 3x o ganho
 *   visual é nulo e o custo de preenchimento triplica.
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
            renderer.domElement.style.cssText = "width:100%;height:100%;display:block";
            host.current.appendChild(renderer.domElement);

            const cena = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(38, largura / altura, 0.1, 100);
            camera.position.set(0, 0, 7.2);

            // ── Luz ────────────────────────────────────────────────────────
            // Duas fontes coloridas nas cores dos lados (CT azul, TR laranja)
            // varrendo o metal — é o que faz a lâmina "acender" ao girar em vez
            // de parecer um objeto cinza.
            cena.add(new THREE.AmbientLight(0xffffff, 0.28));
            const chaveCiano = new THREE.DirectionalLight(0x00c8ff, 2.4);
            chaveCiano.position.set(-4, 3, 5);
            cena.add(chaveCiano);
            const preenchimentoLaranja = new THREE.DirectionalLight(0xfb923c, 1.1);
            preenchimentoLaranja.position.set(5, -2, 3);
            cena.add(preenchimentoLaranja);
            const contraLuz = new THREE.DirectionalLight(0xffffff, 0.9);
            contraLuz.position.set(0, 4, -6);
            cena.add(contraLuz);

            const faca = new THREE.Group();

            // ── Lâmina ─────────────────────────────────────────────────────
            // Curva da karambit desenhada como Shape e extrudada. O bisel vem
            // do bevel do próprio extrude, que dá o fio sem precisar de mesh.
            const perfil = new THREE.Shape();
            perfil.moveTo(0, 0);
            perfil.bezierCurveTo(0.9, 0.15, 1.75, 0.75, 2.05, 1.85);
            perfil.bezierCurveTo(1.9, 0.95, 1.25, 0.35, 0.15, 0.28);
            perfil.lineTo(0, 0);

            const lamina = new THREE.Mesh(
              new THREE.ExtrudeGeometry(perfil, {
                depth: 0.11,
                bevelEnabled: true,
                bevelThickness: 0.05,
                bevelSize: 0.045,
                bevelSegments: 3,
                curveSegments: 26,
              }),
              new THREE.MeshStandardMaterial({
                color: 0xd8dee8,
                metalness: 0.96,
                roughness: 0.19,
              })
            );
            lamina.position.set(-0.55, -0.5, -0.055);
            faca.add(lamina);

            // ── Cabo ───────────────────────────────────────────────────────
            const materialCabo = new THREE.MeshStandardMaterial({
              color: 0x1c1f26,
              metalness: 0.55,
              roughness: 0.62,
            });
            const cabo = new THREE.Mesh(
              new THREE.CapsuleGeometry(0.17, 1.25, 6, 14),
              materialCabo
            );
            cabo.position.set(-0.72, -1.15, 0);
            cabo.rotation.z = 0.42;
            faca.add(cabo);

            // Anel do dedo — a assinatura da karambit.
            const anel = new THREE.Mesh(
              new THREE.TorusGeometry(0.32, 0.075, 12, 34),
              new THREE.MeshStandardMaterial({
                color: 0xd8dee8,
                metalness: 0.94,
                roughness: 0.24,
              })
            );
            anel.position.set(-1.32, -1.72, 0);
            faca.add(anel);

            faca.rotation.set(0.22, -0.5, 0.15);
            cena.add(faca);

            // ── Laço ───────────────────────────────────────────────────────
            let raf = 0;
            let ultimo = performance.now();
            let rodando = true;

            const render = (agora: number) => {
              if (cancelado) return;
              const dt = Math.min((agora - ultimo) / 1000, 0.05);
              ultimo = agora;

              // Rotação principal no eixo Y, mais uma oscilação lenta em X:
              // gira sem parecer um carrossel de vitrine.
              faca.rotation.y += dt * 0.55;
              faca.rotation.x = 0.22 + Math.sin(agora / 2600) * 0.13;

              renderer.render(cena, camera);
              if (rodando) raf = requestAnimationFrame(render);
            };
            raf = requestAnimationFrame(render);
            setAtivo(true);

            // Para com a aba escondida.
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

            // Para quando sai da tela.
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
        {/* Fundo estático — é o que aparece antes da cena carregar e o que
            permanece se o WebGL não estiver disponível. */}
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
