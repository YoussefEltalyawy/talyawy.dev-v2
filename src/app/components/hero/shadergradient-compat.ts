"use client";

import * as THREE from "three";

let patched = false;

export function ensureShaderGradientCompat() {
  if (patched || typeof window === "undefined") return;
  patched = true;

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