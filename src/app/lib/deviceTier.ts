export function detectLowTierDevice(): boolean {
  if (typeof window === "undefined") return false;

  let isLowTier = false;

  const cores = navigator.hardwareConcurrency;
  if (cores && cores <= 2) isLowTier = true;

  const memory = (navigator as any).deviceMemory as number | undefined;
  if (memory && memory < 4) isLowTier = true;

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    if (gl) {
      const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      if (maxTex <= 4096) isLowTier = true;
      
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
        // Flag notoriously weak or old mobile GPUs
        if (
          renderer.includes("mali-4") ||
          renderer.includes("mali-t") ||
          renderer.includes("powervr sgx") ||
          renderer.includes("adreno 3") ||
          renderer.includes("adreno 4") ||
          renderer.includes("adreno 5") ||
          renderer.includes("llvmpipe")
        ) {
          isLowTier = true;
        }
      }

      const lossExt = gl.getExtension("WEBGL_lose_context");
      if (lossExt) lossExt.loseContext();
    } else {
      // If WebGL is not supported, it's definitely low tier
      isLowTier = true;
    }
  } catch {
    isLowTier = true;
  }

  // Also consider a fallback check: mobile + weak connection
  const connection = (navigator as any).connection;
  if (connection && (connection.effectiveType === '2g' || connection.effectiveType === '3g')) {
    isLowTier = true;
  }

  return isLowTier;
}
