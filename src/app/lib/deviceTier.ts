export function detectLowTierDevice(): boolean {
  if (typeof window === "undefined") return false;

  let score = 0;

  const cores = navigator.hardwareConcurrency || 8;
  if (cores <= 4) score++;
  if (cores <= 2) score++;

  const memory = (navigator as any).deviceMemory as number | undefined;
  if (memory !== undefined && memory <= 4) score++;

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    if (gl) {
      const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      if (maxTex <= 4096) score++;

      const lossExt = gl.getExtension("WEBGL_lose_context");
      if (lossExt) lossExt.loseContext();
    }
  } catch {}

  if (screen.width <= 1024 || screen.height <= 768) score++;

  return score >= 2;
}
