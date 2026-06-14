# Tiered Rendering Plan — Wave Shader & Liquid Glass Text

## Problem

The hero section crashes 5-year-old tablets. The root cause is the combined GPU cost of:
1. `MeshTransmissionMaterial` — offscreen 1024×1024 render target + 8-sample refraction + iridescence + clearcoat + distortion every frame
2. `ShaderGradient` waterPlane — per-pixel GLSL water simulation at up to 2× DPR with antialiasing
3. CSS `filter: blur(20px)` on the canvas wrapper + blur on 7 subtext spans
4. `<Environment preset="city" />` HDR cubemap sampled on every reflective surface

On weak GPUs, this exceeds the VRAM budget or triggers a GPU watchdog timeout, killing the browser's GPU process.

---

## Question 1: How Do You Detect Device Performance?

There is **no single API** that tells you "this device is fast/slow." You combine several signals into a score. Here are the available browser APIs:

### Signal 1: `navigator.hardwareConcurrency` (CPU cores)

```js
navigator.hardwareConcurrency // e.g. 2, 4, 8
```

- **Availability:** All modern browsers
- **Reliability:** High. Old tablets typically have 2–4 cores; modern phones have 6–8; desktops 8–16+
- **Caveat:** Some browsers cap this at 8 for privacy

### Signal 2: `navigator.deviceMemory` (RAM in GB)

```js
navigator.deviceMemory // e.g. 2, 4, 8 (rounded to nearest power of 2)
```

- **Availability:** Chrome/Edge only. Firefox and Safari return `undefined`
- **Reliability:** Good on Chromium. Old tablets often report 2 GB

### Signal 3: WebGL Renderer String (actual GPU name)

```js
const gl = document.createElement('canvas').getContext('webgl');
const ext = gl.getExtension('WEBGL_debug_renderer_info');
const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
// e.g. "Adreno (TM) 610" or "Apple GPU" or "NVIDIA GeForce RTX 3080"
```

- **Availability:** Most browsers (not Firefox on some platforms)
- **Reliability:** Very high — this is the actual GPU model. You can maintain a blocklist of known-weak GPUs
- **Caveat:** The extension might be blocked in some privacy modes

### Signal 4: `navigator.connection.effectiveType` (network speed)

```js
navigator.connection?.effectiveType // "slow-2g" | "2g" | "3g" | "4g"
```

- **Availability:** Chromium only
- **Use:** Helps decide whether to load video assets or shaders. A slow connection means downloading a large Three.js bundle is painful regardless of GPU power

### Signal 5: Max Texture Size (GPU capability proxy)

```js
const gl = document.createElement('canvas').getContext('webgl');
const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
// e.g. 4096, 8192, 16384
```

- **Availability:** All WebGL-supporting browsers
- **Reliability:** Good proxy for GPU generation. Old GPUs often max out at 4096. Modern GPUs support 16384+
- **Bonus:** Free, no extra extensions needed

### Signal 6: Quick FPS Benchmark (most accurate, but costs time)

Render a few throwaway WebGL frames and measure the time:

```js
async function benchmarkGPU() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const gl = canvas.getContext('webgl');
  // Draw a few complex frames
  const start = performance.now();
  for (let i = 0; i < 10; i++) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.finish(); // Force GPU sync
  }
  const elapsed = performance.now() - start;
  return elapsed; // Lower = faster GPU
}
```

- **Availability:** All WebGL browsers
- **Reliability:** Most accurate real-world measure
- **Caveat:** Adds 50–200ms to page load. Must run before deciding which tier to render

### Proposed Scoring System

Combine signals into a 0–100 score:

```js
function getDeviceScore() {
  let score = 50; // baseline

  // CPU cores
  const cores = navigator.hardwareConcurrency || 2;
  if (cores >= 8) score += 20;
  else if (cores >= 6) score += 10;
  else if (cores <= 2) score -= 20;

  // Device memory (Chromium only)
  const mem = navigator.deviceMemory;
  if (mem !== undefined) {
    if (mem >= 8) score += 15;
    else if (mem >= 4) score += 5;
    else score -= 15;
  }

  // Max texture size
  const gl = document.createElement('canvas').getContext('webgl');
  const maxTex = gl?.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
  if (maxTex >= 16384) score += 10;
  else if (maxTex <= 4096) score -= 15;

  // Network
  const net = navigator.connection?.effectiveType;
  if (net === '2g' || net === 'slow-2g') score -= 10;

  return Math.max(0, Math.min(100, score));
}
```

### Tier Mapping

| Score | Tier | Wave | Liquid Glass Text |
|-------|------|------|-------------------|
| 70–100 | **High** | Full ShaderGradient shader | Full `MeshTransmissionMaterial` (current settings) |
| 30–69 | **Medium** | Pre-rendered video loop | Reduced `MeshTransmissionMaterial` (see below) |
| 0–29 | **Low** | Pre-rendered video loop | CSS glass effect |

---

## Question 2: How Much Does This Affect Load Time?

### Current Load Time (What Happens Today)

Right now, **every device** downloads and executes:

| Asset | Approximate Size (gzipped) | Notes |
|-------|---------------------------|-------|
| `three` | ~150 KB | Full Three.js library |
| `@react-three/fiber` | ~25 KB | React renderer for Three.js |
| `@react-three/drei` | ~80–120 KB | Tree-shaken, but `MeshTransmissionMaterial`, `Text3D`, `Environment`, `Center`, `useProgress` are imported |
| `@shadergradient/react` | ~30 KB | Custom shader rendering |
| `gsap` + `@gsap/react` | ~30 KB | Animation engine |
| `three-stdlib` | ~40 KB | Three.js utilities (pulled in by drei) |
| `PPEditorialNew` font (OTF) | ~80–150 KB | Font for Text3D geometry |
| `KHTeka` fonts (2 weights) | ~100–200 KB | Subtext font |
| `editorial.json` (font JSON for Text3D) | ~50–100 KB | Three.js font descriptor |
| HDR environment map (`city`) | ~200–500 KB | Loaded at runtime by drei `<Environment>` |
| **TOTAL** | **~785 KB – 1.3 MB** | **All loaded on every device, no code splitting** |

There are **zero** `dynamic()` imports or `lazy()` in your codebase. Everything loads upfront regardless of device.

### Load Time With Tiered Rendering

#### High Tier (Desktop/Modern Phones) — Same as Current

No change. All assets load as they do today. The detection logic adds **<1ms** of JS execution before rendering begins.

**Net impact: ~0ms difference.**

#### Medium Tier (Older Phones/Tablets) — Faster

| Change | Impact |
|--------|--------|
| Skip `@shadergradient/react` (use `<video>` instead) | **−30 KB** JS not loaded |
| Reduce `MeshTransmissionMaterial` (fewer imports from drei still needed, but lighter runtime) | No bundle change, but GPU load drops **60–70%** |
| Skip HDR environment map (use a simpler lighting setup) | **−200–500 KB** not fetched |
| Video file (WebM, 5-second loop, 720p) | **+300–600 KB** downloaded, but video is streamed and hardware-decoded (trivial CPU cost) |

**Net JS bundle: ~−30 KB.** Net bandwidth: roughly **same or slightly less** (video replaces HDR map).  
**Key win:** GPU load drops massively. The transmission material at reduced settings (samples: 2, resolution: 256, no iridescence/clearcoat) is roughly **5–8× cheaper** per frame.

#### Low Tier (Very Old Devices) — Much Faster

| Change | Impact |
|--------|--------|
| Skip `three`, `@react-three/fiber`, `@react-three/drei`, `@shadergradient/react` entirely | **−325–450 KB** JS not loaded |
| Skip `gsap` (use CSS animations instead) | **−30 KB** |
| Skip `editorial.json` font descriptor | **−50–100 KB** |
| Skip HDR environment map | **−200–500 KB** |
| Add CSS glass effect (inline styles, ~1 KB) | **+~1 KB** |
| Video file (WebM) | **+300–600 KB** |

**Net JS bundle: ~−550–950 KB.** This is a **massive** reduction. The page becomes almost instant on weak devices because you skip the entire Three.js ecosystem.

### Load Time Summary

| Tier | JS Downloaded | Total Payload | Time-to-Interactive (est. on 4G) |
|------|--------------|---------------|----------------------------------|
| High (current) | ~450 KB | ~1.1 MB | ~2–4s |
| High (tiered) | ~450 KB | ~1.1 MB | ~2–4s (no change) |
| Medium | ~420 KB | ~1.0 MB | ~2–3s |
| Low | ~50 KB (just Next.js + React + CSS) | ~400 KB | **~0.5–1s** |

The low tier is **4–8× faster** to interactive because it skips the entire 3D stack.

---

## Implementation Plan

### Step 1: Create the Device Detection Utility

**File:** `src/app/lib/deviceTier.ts`

A pure function that runs on the client and returns the tier. Uses the scoring system described above. Must run synchronously (before React hydration) to avoid a flash of wrong content.

```
Inputs: navigator.hardwareConcurrency, navigator.deviceMemory, WebGL max texture size, navigator.connection
Output: 'high' | 'medium' | 'low'
```

Cache the result in `sessionStorage` so it doesn't re-run on navigation.

### Step 2: Create the Wave Component with Tiered Logic

**File:** `src/app/components/hero/WaveBackground.tsx`

This component receives the tier and renders accordingly:

- **High:** Renders the current `<ShaderGradient>` inside the R3F `<Canvas>` (the existing code, moved into this component)
- **Medium:** Renders a `<video>` element with the pre-rendered wave loop
- **Low:** Renders a `<video>` element with the pre-rendered wave loop (same as medium)

The video should be:
- Format: WebM (VP9) with MP4 (H.264) fallback
- Resolution: 1080p for medium, 720p for low (served via `srcSet` or conditional `src`)
- Duration: 5–10 second seamless loop
- Attributes: `autoPlay loop muted playsInline preload="auto"`
- Generated once by screen-recording the current shader or rendering offline

### Step 3: Create the Liquid Glass Text Component with Tiered Logic

**File:** `src/app/components/hero/LiquidGlassTitle.tsx`

This component receives the tier and renders accordingly:

- **High:** Current `MeshTransmissionMaterial` with full settings (the existing `HeroText.tsx` code)
- **Medium:** `MeshTransmissionMaterial` with reduced settings:
  - `resolution`: 256 (was 1024)
  - `samples`: 2 (was 8)
  - `iridescence`: 0 (was 0.35)
  - `clearcoat`: 0 (was 1)
  - `chromaticAberration`: 0.01 (was 0.03)
  - `anisotropicBlur`: 0 (was 0.05)
  - `distortion`: 0.02 (was 0.06)
  - `curveSegments`: 16 (was 32)
  - `bevelSegments`: 4 (was 12)
- **Low:** Pure CSS glass text — no Three.js, no WebGL:
  - `backdrop-filter: blur(12px) saturate(1.8)`
  - `background: linear-gradient(...)` with semi-transparent whites
  - `text-shadow` for glow
  - `-webkit-background-clip: text` + `color: transparent`
  - Optional: SVG `<feTurbulence>` filter for a subtle distortion that mimics the glass effect

### Step 4: Create the Low-Tier CSS Glass Component

**File:** `src/app/components/hero/CSSGlassText.tsx`

A pure HTML/CSS component that renders "talyawy" as styled text (not 3D). Uses:
- The `PPEditorialNew` font (already loaded)
- `backdrop-filter` for the frosted glass look
- A subtle CSS `animation` for a shimmer/pulse that mimics the liquid quality
- GSAP can be skipped here — use CSS `@keyframes` for the entrance animation

This component has **zero JS dependencies** beyond React.

### Step 5: Refactor Hero.tsx to Use Tiers

**File:** `src/app/components/hero/Hero.tsx`

The Hero component becomes a coordinator:

```
1. On mount, run getDeviceTier() → 'high' | 'medium' | 'low'
2. Dynamically import the right components:
   - High: import('./FullHero')     — current R3F Canvas + ShaderGradient + MeshTransmissionMaterial
   - Medium: import('./MediumHero') — video wave + reduced MeshTransmissionMaterial
   - Low: import('./LowHero')       — video wave + CSS glass text
3. Render the appropriate sub-component
```

Use Next.js `dynamic()` for code splitting so that the Three.js bundle **is never downloaded on low-tier devices**.

### Step 6: Dynamic Import Strategy

This is the **most important optimization** for load time. Currently, the `Hero.tsx` file statically imports:

```
@react-three/fiber    → always loaded
@react-three/drei     → always loaded
@shadergradient/react → always loaded
three                 → always loaded
gsap                  → always loaded
```

With tiered rendering and `next/dynamic`, only the high and medium tiers load Three.js. The low tier loads just React + CSS.

```
src/app/components/hero/
├── Hero.tsx                  ← Coordinator: detects tier, dynamic-imports the right sub-component
├── FullHero.tsx              ← High tier: current Canvas + ShaderGradient + LiquidGlass (all the heavy imports live HERE)
├── MediumHero.tsx            ← Medium tier: video wave + reduced LiquidGlass (imports Three.js but lighter drei usage)
├── LowHero.tsx               ← Low tier: video wave + CSS glass (imports NOTHING heavy)
├── CSSGlassText.tsx          ← Pure CSS text component
├── WaveVideo.tsx             ← Shared <video> component for medium + low
└── HeroText.tsx              ← Current liquid glass text (used by FullHero and MediumHero with different props)
```

### Step 7: Prepare Video Assets

Record the current wave shader as a video:

1. Open the site on a desktop
2. Use OBS or a screen recording tool to capture the wave animation for 5–10 seconds
3. Export as:
   - `wave-1080.webm` (VP9, ~500 KB) for medium tier
   - `wave-720.webm` (VP9, ~250 KB) for low tier
   - `wave-1080.mp4` (H.264, ~600 KB) as Safari/iOS fallback
   - `wave-720.mp4` (H.264, ~300 KB) as Safari/iOS fallback
4. Place in `public/videos/`

### Step 8: Adjust GSAP Animations Per Tier

The GSAP timeline currently animates:
- Header blur → sharp
- Canvas wrapper blur → sharp + wave slide
- Material roughness/opacity (transmission material)
- Subtext blur → sharp

For **medium tier**: The GSAP timeline works the same, but skip animating `material.roughness` if the reduced material doesn't look good at roughness=1. Instead, animate only `material.opacity`.

For **low tier**: Replace GSAP with CSS animations:
- `@keyframes fadeBlurIn` for header, subtext (blur → sharp + opacity)
- `@keyframes slideUp` for wave video and text
- No material animation needed (CSS glass doesn't have roughness)

---

## Visual Fidelity Comparison

| Aspect | High (Current) | Medium | Low (CSS) |
|--------|---------------|--------|-----------|
| Wave animation | Real-time GLSL water simulation | Pre-rendered video (visually identical) | Pre-rendered video (720p, still looks good) |
| Glass text refraction | True 3D refraction with 8 samples, iridescence, clearcoat | Refraction with 2 samples, no iridescence/clearcoat — **still looks glassy, slightly less "premium"** | CSS `backdrop-filter` blur — **reads as glass but lacks depth** |
| Text geometry | 3D beveled mesh (high poly) | 3D beveled mesh (lower poly, barely visible difference at reading distance) | Flat 2D text with the same font |
| Chromatic aberration | 0.03 (visible rainbow fringing) | 0.01 (subtle) | Not possible in CSS |
| Distortion | Animated temporal distortion | Minimal static distortion | Static SVG turbulence (optional) |
| Environment reflections | HDR city cubemap | Skip (use simple lights) | Not applicable |

**Honest assessment:** A visitor who has never seen the high tier will not know they're missing anything on medium. The low tier looks noticeably simpler but still reads as a "glass text" design — it just lacks the 3D depth and refraction.

---

## File Changes Summary

| File | Action |
|------|--------|
| `src/app/lib/deviceTier.ts` | **Create** — detection logic |
| `src/app/components/hero/Hero.tsx` | **Modify** — become a tier coordinator with `next/dynamic` |
| `src/app/components/hero/FullHero.tsx` | **Create** — move current Hero body here (high tier) |
| `src/app/components/hero/MediumHero.tsx` | **Create** — video wave + reduced transmission |
| `src/app/components/hero/LowHero.tsx` | **Create** — video wave + CSS glass |
| `src/app/components/hero/WaveVideo.tsx` | **Create** — shared `<video>` component |
| `src/app/components/hero/CSSGlassText.tsx` | **Create** — pure CSS glass text |
| `src/app/components/hero/HeroText.tsx` | **Modify** — accept tier-dependent props for reduced settings |
| `src/app/components/hero/ShaderGradientPlane.tsx` | **Delete** — unused dead code |
| `src/app/components/hero/ShaderGradientSource.tsx` | **Delete** — unused dead code |
| `public/videos/wave-*.webm/.mp4` | **Create** — recorded video assets (4 files) |
| `src/app/globals.css` | **Modify** — add low-tier CSS glass keyframes |

---

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Detection is wrong (e.g., powerful device scored low) | Store tier in `sessionStorage` with a "force high" URL param override (`?tier=high`) for testing |
| Flash of wrong tier on hydration | Run detection in a `<script>` tag in `layout.tsx` before hydration, set a CSS class on `<html>` (`data-tier="high"`) |
| Video doesn't autoplay on iOS | iOS requires `playsInline` + `muted` (both included). Test on real device. |
| CSS `backdrop-filter` not supported on very old browsers | Fallback to a solid semi-transparent background. `@supports (backdrop-filter: blur(1px))` check. |
| Reduced `MeshTransmissionMaterial` looks too different | Fine-tune in browser. The biggest visual contributor is `resolution` — 512 is a good middle ground if 256 looks too blurry. |
