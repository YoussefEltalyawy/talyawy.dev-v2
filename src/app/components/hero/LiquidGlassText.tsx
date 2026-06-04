"use client";

import {
  Center,
  MeshTransmissionMaterial,
  Text3D,
  Outlines,
  Text
} from "@react-three/drei";
import { useThree } from "@react-three/fiber";

type Props = {
  text?: string;
};

export default function LiquidGlassText({
  text = "talyawy",
}: Props) {
  const { viewport } = useThree();

  const textSize = viewport.width * 0.2;

  return (
    <Center
      position={[
        0,
        -viewport.height * 0.23,
        0,
      ]}
    >
      <Text font="/fonts/editorial.otf" fontSize={textSize * 0.18}>
        {text}
        {/* Set the main color to transparent so it disappears */}
        <meshBasicMaterial color="white" transparent opacity={0} />
        {/* Outlines creates the visible white stroke around the text */}
        <Outlines thickness={0.05} color="white" />
      </Text>

      <Text3D
        font="/fonts/editorial.json"
        size={textSize}
        height={textSize * 0.01}
        curveSegments={20}
        bevelEnabled
        bevelSize={textSize * 0.01}
        bevelSegments={8}
        bevelThickness={textSize * 0.01}
        letterSpacing={-0.01}
      >
        {text}

        <MeshTransmissionMaterial
          color="#c8d8d8"
          metalness={0}
          roughness={.5}
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
    </Center>
  );
}