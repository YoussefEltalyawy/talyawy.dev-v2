"use client";

import * as THREE from "three";

let patched = false;

export function ensureShaderGradientCompat() {
  if (patched || typeof window === "undefined") return;
  patched = true;

  // Intercept console.warn globally to filter out the THREE.Clock deprecation warning
  try {
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      if (
        typeof args[0] === "string" &&
        args[0].includes("THREE.Clock: This module has been deprecated")
      ) {
        return;
      }
      originalWarn.apply(console, args);
    };
  } catch (e) {
    console.error("Failed to install console.warn patch:", e);
  }

  if (THREE.ShaderChunk) {
    // Fixes @shadergradient/react on newer Three.js versions
    (THREE.ShaderChunk as any).uv2_pars_vertex = "";
    (THREE.ShaderChunk as any).uv2_vertex = "";
    (THREE.ShaderChunk as any).uv2_pars_fragment = "";
    (THREE.ShaderChunk as any).uv2_fragment = "";

    if (!(THREE.ShaderChunk as any).colors_pars_fragment) {
      (THREE.ShaderChunk as any).colors_pars_fragment =
        (THREE.ShaderChunk as any).color_pars_fragment || "";
    }

    if (!(THREE.ShaderChunk as any).colors_pars_vertex) {
      (THREE.ShaderChunk as any).colors_pars_vertex =
        (THREE.ShaderChunk as any).color_pars_vertex || "";
    }

    if (!(THREE.ShaderChunk as any).colors_vertex) {
      (THREE.ShaderChunk as any).colors_vertex =
        (THREE.ShaderChunk as any).color_vertex || "";
    }

    if (!(THREE.ShaderChunk as any).colors_fragment) {
      (THREE.ShaderChunk as any).colors_fragment =
        (THREE.ShaderChunk as any).color_fragment || "";
    }

    if (!(THREE.ShaderChunk as any).encodings_pars_fragment) {
      (THREE.ShaderChunk as any).encodings_pars_fragment =
        (THREE.ShaderChunk as any).colorspace_pars_fragment || "";
    }

    if (!(THREE.ShaderChunk as any).encodings_fragment) {
      (THREE.ShaderChunk as any).encodings_fragment =
        (THREE.ShaderChunk as any).colorspace_fragment || "";
    }
  }
}