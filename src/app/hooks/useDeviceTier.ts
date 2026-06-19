"use client";

import { useEffect, useState } from "react";

export type DeviceTier = "low" | "high";

/**
 * Scores the device across multiple hardware signals.
 * Returns "low" when the combined score suggests the device will struggle
 * with the full hero (complex shader + MeshTransmissionMaterial FBO).
 *
 * Deliberately conservative — a score of ≥2 is required so that
 * borderline-mid-range phones don't get downgraded unnecessarily.
 */
function computeDeviceTier(): DeviceTier {
  if (typeof window === "undefined") return "high";

  const nav = navigator as Navigator & { deviceMemory?: number };
  let score = 0;

  // ── 1. Device RAM ─────────────────────────────────────────────────────────
  // Exposed by Chrome / Android Chrome. Not available in Safari (returns undefined).
  // Values are rounded: 0.25 / 0.5 / 1 / 2 / 4 / 8. Capped at 8 by spec.
  const mem = nav.deviceMemory;
  if (mem !== undefined) {
    if (mem < 2) score += 3; // budget phone / very old tablet
    else if (mem < 4) score += 2; // 2–3 GB — typical struggling device
  }

  // ── 2. Logical CPU cores ──────────────────────────────────────────────────
  const cores = navigator.hardwareConcurrency ?? 0;
  if (cores > 0 && cores <= 4) score += 1; // not a dealbreaker alone, but adds up

  // ── 3. WebGL capability probe ─────────────────────────────────────────────
  // Creates a tiny offline context — zero memory cost, never rendered.
  try {
    const probe = document.createElement("canvas");
    const gl =
      (probe.getContext("webgl") as WebGLRenderingContext | null) ??
      (probe.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (gl) {
      // Max texture size reveals the GPU's memory address space.
      const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
      if (maxTex < 4096) score += 3; // extremely constrained GPU
      else if (maxTex < 8192) score += 1; // limited but functional

      // GPU renderer string — match known weak/mid-range patterns.
      // Only available when WEBGL_debug_renderer_info is not blocked
      // (Chrome exposes it; privacy-hardened browsers may not).
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      if (dbg) {
        const renderer = (
          gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) as string
        ).toLowerCase();

        // ── Weak GPUs (+2 each) ───────────────────────────────────────────
        // Old Mali T-series, Mali-400/450 family, Mali-G52 (budget), legacy
        // PowerVR SGX, and budget Adreno 3xx/4xx/early-5xx
        const weak = [
          "mali-t",
          "mali-4",
          "mali-g52",
          "sgx",
          "powervr ge8",
          "powervr ge9",
          "adreno (tm) 3",
          "adreno (tm) 4",
          "adreno (tm) 50",
        ];

        // ── Mid-range GPUs (+1 each) ──────────────────────────────────────
        // Adreno 510-519, Adreno 610-619 (Snapdragon 4xx/6xx tablets),
        // Mali-G57 / G68 (Dimensity 700-800 tablets)
        const mid = [
          "adreno (tm) 51",
          "adreno (tm) 61",
          "mali-g57",
          "mali-g68",
        ];

        if (weak.some((p) => renderer.includes(p))) score += 2;
        else if (mid.some((p) => renderer.includes(p))) score += 1;
      }
    }
  } catch {
    // Probe failed (sandboxed iframe, strict CSP, etc.) — treat as capable.
  }

  return score >= 2 ? "low" : "high";
}

/**
 * Returns the device performance tier for the current session.
 *
 * - Initialises as "high" so capable devices never see a downgraded first frame.
 * - The useEffect resolves synchronously on the next microtask tick, well before
 *   the R3F canvas becomes visible (which waits for progress === 100 + GSAP).
 */
export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>("high");

  useEffect(() => {
    setTier(computeDeviceTier());
  }, []);

  return tier;
}