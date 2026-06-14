"use client";

import { Center, MeshTransmissionMaterial, Text3D } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

type Props = {
  text?: string;
  safeAreaPixels?: number;
  onMaterialReady?: (material: THREE.Material) => void;
};

export default function LiquidGlassText({
  text = "talyawy",
  safeAreaPixels = 0,
  onMaterialReady,
}: Props) {
  const viewport = useThree((state) => state.viewport);
  const size = useThree((state) => state.size);

  // Pushed the multiplier slightly up to 0.23 to squeeze out every last drop of width safely.
  const targetScale = Math.min(
    viewport.width * 0.23,
    viewport.height * 0.43,
    1.29,
  );

  // Convert the exact pixel height of the Safari pill into 3D world units.
  const safeGapWorld =
    size.height > 0 ? (safeAreaPixels / size.height) * viewport.height : 0;

  // Keep the bottom edge firmly near the visual bottom of the screen, lifted up exactly past the pill.
  const textHalfHeight = targetScale * 0.4;
  const yPos = -viewport.height / 2 + 0.35 + textHalfHeight + safeGapWorld;

  // Clipping plane for the "invisible line" reveal
  const clipPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    [],
  );

  useEffect(() => {
    // We place the clipping plane relative to the text's final position.
    // The text's bottom edge is roughly at yPos - targetScale * 0.5.
    // By placing the plane at yPos - targetScale * 0.85, it sits comfortably below the text
    // (and its refraction bleeding) so no line is visible once the animation finishes.
    // During the animation, the text starts at y = -1, pushing it well below this plane.
    clipPlane.constant = -(yPos - targetScale * 0.85);
  }, [yPos, targetScale, clipPlane]);

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
        // Native, instant centering directly on the geometry.
        // This permanently prevents any resizing glitches caused by wrapper components!
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
        roughness={1} /* Start fully rough/blurred for the animation */
        transparent={true}
        opacity={0} /* Start invisible */
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
