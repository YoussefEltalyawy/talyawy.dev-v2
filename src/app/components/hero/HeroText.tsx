"use client";
import { MeshTransmissionMaterial, Text3D, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

type Props = {
  text?: string;
  safeAreaPixels?: number;
  onMaterialReady?: (material: THREE.Material) => void;
  isLowTier?: boolean;
};

type LowTierProps = {
  text: string;
  targetScale: number;
  yPos: number;
  clipPlane: THREE.Plane;
  onMaterialReady?: (material: THREE.Material) => void;
};

/**
 * Isolated sub-component so useTexture is always called unconditionally.
 *
 * Why a separate component instead of a conditional hook?
 * React's rules of hooks forbid calling hooks inside an `if`.
 * By moving `useTexture` here, it is always invoked at the top-level
 * of this component — no rules broken, no linting warnings.
 *
 * Why pass `background={bgTexture}` to MTM?
 * MeshTransmissionMaterial renders an FBO of whatever is "behind" the mesh
 * in the 3D scene and uses that for refraction. On low-tier devices the
 * ShaderGradient is removed, so the scene is empty — MTM has nothing to
 * sample and falls back to transparent black (that "flat white" look).
 * Passing `background` gives MTM an explicit texture to refract through,
 * restoring the glass effect without adding anything expensive to the scene.
 *
 * The same image is already in the DOM as an <Image> overlay (Hero.tsx),
 * so the refracted content visually matches the actual background.
 */
function LowTierGlassText({
  text,
  targetScale,
  yPos,
  clipPlane,
  onMaterialReady,
}: LowTierProps) {
  const bgTexture = useTexture("/hero-wave-fallback.png");

  return (
    <Text3D
      font="/fonts/editorial.json"
      size={targetScale}
      height={targetScale * 0.005}
      curveSegments={16}
      bevelEnabled
      bevelSize={0.01}
      bevelThickness={0.01}
      bevelSegments={4}
      letterSpacing={-0.02}
      position={[0, yPos, 0]}
      // No rotation — the π-flip on capable devices only exists to counter
      // the ShaderGradient camera hijack, which doesn't happen here.
      onUpdate={(self) => {
        self.geometry.center();
      }}
    >
      {text}
      <MeshTransmissionMaterial
        ref={(mat: any) => {
          if (mat && onMaterialReady) onMaterialReady(mat);
        }}
        // Explicit refraction source — this is the whole fix.
        background={bgTexture}
        // Clip plane hides the text below the screen during the slide-up animation.
        clippingPlanes={[clipPlane]}
        // --- visual parity with capable devices ---
        color="#c8d8d8"
        metalness={0}
        roughness={1}          // starts blurry; GSAP animates this to 0.15
        transparent
        opacity={0}            // starts invisible; controlled by canvas-wrapper GSAP
        ior={1.8}
        thickness={0.45}
        reflectivity={0.45}
        chromaticAberration={0.03}
        clearcoat={1}
        clearcoatRoughness={0}
        iridescence={0.35}
        iridescenceIOR={0.8}
        iridescenceThicknessRange={[60, 180]}
        anisotropicBlur={0.55}
        distortion={0.04}
        distortionScale={0.15}
        // --- performance knobs (low-tier only) ---
        temporalDistortion={0}  // disabled — saves a GPU pass every frame
        samples={1}             // minimum FBO samples
        resolution={128}        // small FBO — plenty for a visible glass effect
      />
    </Text3D>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function LiquidGlassText({
  text = "talyawy",
  safeAreaPixels = 0,
  onMaterialReady,
  isLowTier = false,
}: Props) {
  const viewport = useThree((state) => state.viewport);
  const size = useThree((state) => state.size);

  const targetScale = isLowTier
    ? Math.min(
        viewport.width * 0.215,
        viewport.height * 0.43,
        1.29,
      )
    : Math.min(
        viewport.width * 0.23,
        viewport.height * 0.43,
        1.29,
      );

  const safeGapWorld =
    size.height > 0 ? (safeAreaPixels / size.height) * viewport.height : 0;
  const textHalfHeight = targetScale * 0.4;
  const bottomGap = isLowTier ? 0.9 : 0.35;
  const yPos = -viewport.height / 2 + bottomGap + textHalfHeight + safeGapWorld;

  const clipPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    [],
  );

  useEffect(() => {
    clipPlane.constant = -(yPos - targetScale * (isLowTier ? 1.2 : 0.85));
  }, [yPos, targetScale, clipPlane, isLowTier]);

  // ── Low-tier path ──────────────────────────────────────────────────────────
  // Delegates to LowTierGlassText so useTexture is called unconditionally.
  if (isLowTier) {
    return (
      <LowTierGlassText
        text={text}
        targetScale={targetScale}
        yPos={yPos}
        clipPlane={clipPlane}
        onMaterialReady={onMaterialReady}
      />
    );
  }

  // ── Capable-device path — UNCHANGED ────────────────────────────────────────
  return (
    <Text3D
      font="/fonts/editorial.json"
      size={targetScale}
      height={targetScale * 0.005}
      curveSegments={32}
      bevelEnabled
      bevelSize={0.01}
      bevelThickness={0.01}
      bevelSegments={12}
      letterSpacing={-0.02}
      position={[0, yPos, 0]}
      rotation={[0, Math.PI, 0]}
      onUpdate={(self) => {
        self.geometry.center();
      }}
    >
      {text}
      <MeshTransmissionMaterial
        ref={(mat: any) => {
          if (mat && onMaterialReady) onMaterialReady(mat);
        }}
        clippingPlanes={[clipPlane]}
        color="#c8d8d8"
        metalness={0}
        roughness={1}
        transparent={true}
        opacity={0}
        ior={1.8}
        thickness={0.55}
        reflectivity={0.45}
        chromaticAberration={0.03}
        clearcoat={1}
        clearcoatRoughness={0}
        iridescence={0.35}
        iridescenceIOR={0.8}
        iridescenceThicknessRange={[60, 180]}
        anisotropicBlur={0.05}
        distortion={0.06}
        distortionScale={0.18}
        temporalDistortion={0.04}
        samples={2}
        resolution={256}
      />
    </Text3D>
  );
}