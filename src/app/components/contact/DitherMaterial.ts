"use client";

import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";

// ─────────────────────────────────────────────────────────────────────────
// DitherMaterial
//
// GPU-friendly stand-in for Floyd–Steinberg error diffusion. True error
// diffusion propagates rounding error to neighbouring pixels sequentially,
// which doesn't parallelize on a GPU — so instead we quantize luminance
// into 4 tonal bands (uColors[0..3]) and jitter the quantization threshold
// with a per-block hash, which reads as the same grainy, banded dither
// look at a fraction of the cost.
//
// uColors[0] is expected to sit close to the section background so the
// darkest band dissolves into it rather than reading as a hard edge.
// ─────────────────────────────────────────────────────────────────────────

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uResolution;      // plane size in pixels
  uniform vec2 uVideoResolution; // natural video size in pixels
  uniform float uPixelation;     // dither block size, in pixels
  uniform float uBrightness;
  uniform float uContrast;
  uniform float uDitherStrength; // 0..1, how much the threshold jitters
  uniform float uOpacity;
  uniform vec3 uColors[4];
  uniform vec2 uMouse;           // cursor position in UV space (0..1)
  uniform float uMouseRadius;    // radius of cursor influence in UV space

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  // "background-size: contain" style UV remap so the video is fully visible
  // without any cropping, letterboxed if needed.
  vec2 containUv(vec2 uv, vec2 res, vec2 mediaRes) {
    float resAspect = res.x / res.y;
    float mediaAspect = mediaRes.x / mediaRes.y;
    vec2 scale = resAspect > mediaAspect
      ? vec2(mediaAspect / resAspect, 1.0)
      : vec2(1.0, resAspect / mediaAspect);
    vec2 mapped = (uv - 0.5) / scale + 0.5;
    return mapped;
  }

  void main() {
    vec2 res = max(uResolution, vec2(1.0));
    float pixelation = max(uPixelation, 1.0);

    // Snap to a block grid in screen space so blocks stay crisp
    // regardless of how the plane itself is scaled.
    vec2 screenPx = vUv * res;
    vec2 blockCoord = floor(screenPx / pixelation);
    vec2 blockCenterPx = blockCoord * pixelation + pixelation * 0.5;

    vec2 normalizedUv = blockCenterPx / res;

    // ── Cursor scatter: repel blocks away from mouse ──
    vec2 delta = normalizedUv - uMouse;
    float mouseDist = length(delta);
    float scatterInfluence = 1.0 - smoothstep(0.0, uMouseRadius, mouseDist);
    // Each block gets a unique scatter direction mixed with the radial push
    float blockNoise = hash(blockCoord);
    float angle = blockNoise * 6.2831853;  // random angle per block
    vec2 randomDir = vec2(cos(angle), sin(angle));
    // Blend radial (away from cursor) + random scatter
    vec2 pushDir = mouseDist > 0.001 ? normalize(delta) : vec2(0.0);
    vec2 scatterDir = normalize(mix(pushDir, randomDir, 0.45));
    // Displace the sampling UV — blocks scatter outward
    float scatterStrength = scatterInfluence * scatterInfluence * 0.08;
    vec2 scatteredUv = normalizedUv + scatterDir * scatterStrength;

    vec2 sampleUv = containUv(scatteredUv, res, uVideoResolution);

    // If outside the video bounds, output the darkest band color (background)
    if (sampleUv.x < 0.0 || sampleUv.x > 1.0 || sampleUv.y < 0.0 || sampleUv.y > 1.0) {
      gl_FragColor = vec4(uColors[0], uOpacity);
      return;
    }

    sampleUv = clamp(sampleUv, 0.001, 0.999);

    vec3 color = texture2D(uMap, sampleUv).rgb;
    color = ((color - 0.5) * uContrast + 0.5) * uBrightness;
    color = clamp(color, 0.0, 1.0);

    float luma = dot(color, vec3(0.299, 0.587, 0.114));

    // Subtle luminance boost near cursor for a glow accent
    luma = clamp(luma + scatterInfluence * 0.2, 0.0, 1.0);

    // Scale dither noise by luminance — dark areas stay clean,
    // dithering fades in only once there's enough signal.
    float ditherMix = smoothstep(0.05, 0.25, luma);
    float noise = hash(blockCoord) - 0.5;
    float dithered = clamp(luma + noise * uDitherStrength * ditherMix, 0.0, 0.999);

    float bandF = dithered * 4.0;
    int band = int(floor(bandF));

    vec3 outColor = uColors[0];
    if (band == 1) outColor = uColors[1];
    else if (band == 2) outColor = uColors[2];
    else if (band >= 3) outColor = uColors[3];

    gl_FragColor = vec4(outColor, uOpacity);
  }
`;

export const DitherMaterial = shaderMaterial(
  {
    uMap: null as THREE.Texture | null,
    uResolution: new THREE.Vector2(1, 1),
    uVideoResolution: new THREE.Vector2(16, 9),
    uPixelation: 4,
    uBrightness: 1,
    uContrast: 1.15,
    uDitherStrength: 0.55,
    uOpacity: 1,
    uMouse: new THREE.Vector2(-1, -1),
    uMouseRadius: 0.2,
    uColors: [
      new THREE.Color("#111b11"),
      new THREE.Color("#2e422e"),
      new THREE.Color("#3f6856"),
      new THREE.Color("#8adaaa"),
    ],
  },
  vertexShader,
  fragmentShader
);

DitherMaterial.key = THREE.MathUtils.generateUUID();

extend({ DitherMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    ditherMaterial: ThreeElements["shaderMaterial"] & {
      uMap?: THREE.Texture | null;
      uResolution?: THREE.Vector2;
      uVideoResolution?: THREE.Vector2;
      uPixelation?: number;
      uBrightness?: number;
      uContrast?: number;
      uDitherStrength?: number;
      uOpacity?: number;
      uMouse?: THREE.Vector2;
      uMouseRadius?: number;
      uColors?: THREE.Color[];
      transparent?: boolean;
    };
  }
}
