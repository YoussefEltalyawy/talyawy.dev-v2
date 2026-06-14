export function detectLowTierDevice(): boolean {
  if (typeof window === "undefined") return false;

  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory as number | undefined;

  if (cores <= 4 && memory !== undefined && memory <= 2) return true;

  if (cores <= 2) return true;

  return false;
}
