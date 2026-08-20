"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const chooseRandomStart = () => {
      if (!Number.isFinite(video.duration) || video.duration < 4) return;
      const safeStart = Math.min(6, video.duration * 0.08);
      const safeEnd = Math.max(safeStart, video.duration - Math.min(8, video.duration * 0.1));
      video.currentTime = safeStart + Math.random() * Math.max(0, safeEnd - safeStart);

      if (reduceMotion.matches) {
        video.pause();
        setPaused(true);
        return;
      }

      void video.play().catch(() => setPaused(true));
    };

    const handleMotionPreference = () => {
      if (reduceMotion.matches) {
        video.pause();
        setPaused(true);
      }
    };

    video.addEventListener("loadedmetadata", chooseRandomStart, { once: true });
    reduceMotion.addEventListener("change", handleMotionPreference);
    return () => {
      video.removeEventListener("loadedmetadata", chooseRandomStart);
      reduceMotion.removeEventListener("change", handleMotionPreference);
    };
  }, []);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().then(() => setPaused(false)).catch(() => setPaused(true));
    } else {
      video.pause();
      setPaused(true);
    }
  }

  return (
    <>
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/assets/banner_bluestrike_home.png"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src="/assets/video_hero.mp4" type="video/mp4" />
      </video>
      <button
        type="button"
        onClick={togglePlayback}
        className="absolute bottom-5 right-5 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-lg backdrop-blur-md transition-[background-color,border-color,transform] duration-300 hover:border-white/35 hover:bg-black/70 active:scale-[0.96]"
        aria-label={paused ? "Reproduzir vídeo de fundo" : "Pausar vídeo de fundo"}
      >
        {paused ? <Play className="h-4 w-4 fill-current" aria-hidden="true" /> : <Pause className="h-4 w-4 fill-current" aria-hidden="true" />}
      </button>
    </>
  );
}
