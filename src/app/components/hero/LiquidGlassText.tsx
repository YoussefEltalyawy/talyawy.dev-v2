"use client";

import { Center, MeshTransmissionMaterial, Text3D } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

type Props = {
  text?: string;
};

export default function LiquidGlassText({ text = "talyawy" }: Props) {
  const viewport = useThree((state) => state.viewport);

  // Pushed the multiplier slightly up to 0.23 to squeeze out every last drop of width safely.
  const targetScale = Math.min(
    viewport.width * 0.23,
    viewport.height * 0.43,
    1.29,
  );

  // Increased the bottom gap from 0.2 to 0.35 to ensure the 'y' descender has enough breathing room.
  const textHalfHeight = targetScale * 0.4;
  const yPos = -viewport.height / 2 + 0.35 + textHalfHeight;

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
        color="#c8d8d8"
        metalness={0}
        roughness={0.5}
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
        samples={8}
        resolution={1024}
      />
    </Text3D>
  );
}
