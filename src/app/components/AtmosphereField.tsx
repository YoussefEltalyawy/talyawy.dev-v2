// AtmosphereField.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useDeviceTier } from "@/app/hooks/useDeviceTier"; // adjust path to match your project

const MOTE_COUNT_MIN = 18;
const MOTE_COUNT_MAX = 42;

type Mote = {
  x: number;
  y: number;
  depth: number; // 0 = far, 1 = near
  size: number;
  speed: number;
  phase: number;
};

export default function AtmosphereField({
  className = "",
}: {
  className?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tier = useDeviceTier();
  const [reducedMotion, setReducedMotion] = useState(false);
  const isVisibleRef = useRef(false);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (tier !== "high" || reducedMotion) return;

    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Pre-render the soft mote sprite once — every frame just drawImage()s it,
    // instead of constructing a radial gradient per particle per frame.
    const SPRITE_SIZE = 64;
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = SPRITE_SIZE;
    const sctx = sprite.getContext("2d")!;
    const grad = sctx.createRadialGradient(
      SPRITE_SIZE / 2,
      SPRITE_SIZE / 2,
      0,
      SPRITE_SIZE / 2,
      SPRITE_SIZE / 2,
      SPRITE_SIZE / 2
    );
    grad.addColorStop(0, "rgba(255,255,255,0.9)");
    grad.addColorStop(0.4, "rgba(255,255,255,0.35)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);

    let width = 0;
    let height = 0;
    let dpr = 1;
    let motes: Mote[] = [];

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5); // cap retina cost
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const area = width * height;
      const count = Math.round(
        Math.min(MOTE_COUNT_MAX, Math.max(MOTE_COUNT_MIN, area / 26000))
      );
      motes = Array.from({ length: count }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          depth,
          size: 4 + depth * 10, // nearer motes are bigger
          speed: 0.25 + depth * 0.5, // nearer motes drift faster (parallax)
          phase: Math.random() * Math.PI * 2,
        };
      });
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    io.observe(wrapper);

    const handleVisibility = () => {
      if (document.hidden) isVisibleRef.current = false;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const handleMove = (e: MouseEvent) => {
      const rect = wrapper.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };
    window.addEventListener("mousemove", handleMove, { passive: true });

    let rafId = 0;
    let last = performance.now();
    let elapsed = 0;

    const frame = (now: number) => {
      rafId = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!isVisibleRef.current) return; // paused off-screen / hidden tab
      elapsed += dt;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      // Slow global breathing pulse — ~13s full cycle
      const breathing = 0.55 + Math.sin(elapsed * ((Math.PI * 2) / 13)) * 0.2;

      for (const m of motes) {
        // Cheap pseudo curl-noise field (sum of sines) — organic drift, no deps
        const fx =
          Math.sin(m.y * 0.01 + elapsed * 0.15 + m.phase) * 0.6 +
          Math.sin(m.y * 0.004 - elapsed * 0.08) * 0.4;
        const fy =
          Math.cos(m.x * 0.012 - elapsed * 0.12 + m.phase) * 0.5 +
          Math.cos(m.x * 0.005 + elapsed * 0.07) * 0.4;

        // Cursor disturbs the air locally — agitation, not repulsion
        let agitation = 1;
        if (mouseRef.current.active) {
          const dx = m.x - mouseRef.current.x;
          const dy = m.y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const radius = 180;
          if (dist < radius) {
            agitation = 1 + (1 - dist / radius) * 2.2;
          }
        }

        m.x += fx * m.speed * agitation;
        m.y += fy * m.speed * agitation * 0.6;

        if (m.x < -20) m.x = width + 20;
        if (m.x > width + 20) m.x = -20;
        if (m.y < -20) m.y = height + 20;
        if (m.y > height + 20) m.y = -20;

        const localBoost = agitation > 1 ? Math.min(agitation - 1, 1) * 0.5 : 0;
        const alpha = Math.min(
          (0.12 + m.depth * 0.18 + localBoost) * breathing,
          0.9
        );
        const size = m.size * (1 + localBoost * 0.3);

        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, m.x - size / 2, m.y - size / 2, size, size);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("mousemove", handleMove);
    };
  }, [tier, reducedMotion]);

  // Low-tier / reduced-motion fallback — zero JS, pure compositor animation
  if (tier !== "high" || reducedMotion) {
    return (
      <div
        ref={wrapperRef}
        aria-hidden
        className={`pointer-events-none ${className}`}
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.04), transparent 60%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.03), transparent 55%)",
          animation: "atm-breathe 14s ease-in-out infinite",
        }}
      />
    );
  }

  return (
    <div ref={wrapperRef} aria-hidden className={`pointer-events-none ${className}`}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}