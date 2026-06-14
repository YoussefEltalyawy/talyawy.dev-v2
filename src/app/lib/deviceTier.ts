export function detectLowTierDevice(): boolean {
  if (typeof window === "undefined") return false;

  const cores = navigator.hardwareConcurrency || 8;
  if (cores > 4) return false;

  const memory = (navigator as any).deviceMemory as number | undefined;
  if (memory === undefined || memory > 4) return false;

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    if (gl) {
      const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);

      const lossExt = gl.getExtension("WEBGL_lose_context");
      if (lossExt) lossExt.loseContext();

      return maxTex <= 4096;
    }
  } catch {}

  return false;
}
