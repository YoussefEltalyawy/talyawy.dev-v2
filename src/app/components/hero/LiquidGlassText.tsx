"use client";

import { Center, MeshTransmissionMaterial, Text3D } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

type Props = {
    text?: string;
};

export default function LiquidGlassText({ text = "talyawy" }: Props) {
    const { viewport, size } = useThree();

    const textSize = Math.min(
        viewport.width * 0.07,
        viewport.height * 0.18,
        1.5,
    );

    // Mobile is perfect at ~ -1.0 (textSize ~ 0.6).
    // On big screens (textSize = 1.5), the previous position (-0.65) was slightly too low, 
    // causing the bottom of the 'y' to get cut off by the wave/screen edge.
    // We linearly interpolate based on textSize to maintain the perfect mobile gap
    // while lifting the text up to -0.3 on desktop so the 'y' clears the bottom.
    const yPos = -1.46 + (textSize * 0.77);

    return (
        <Center position={[0, yPos, 0]} rotation={[0, Math.PI, 0]}>
            <Text3D
                font="/fonts/editorial.json"
                size={textSize}
                height={textSize * 0.005}
                curveSegments={32}
                bevelEnabled
                bevelSize={0.01}
                bevelThickness={0.01}
                bevelSegments={12}
                letterSpacing={-0.02}
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
        </Center>
    );
}
