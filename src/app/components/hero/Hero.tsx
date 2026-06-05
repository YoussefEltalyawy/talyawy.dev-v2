"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { ShaderGradient } from "@shadergradient/react"; // import the mesh, not the canvas
import LiquidGlassText from "./LiquidGlassText";
import { ensureShaderGradientCompat } from "./shadergradient-compat";
import { Environment } from "@react-three/drei";
import * as THREE from "three";

ensureShaderGradientCompat();

export default function Hero() {
    return (
        <div
            className="relative w-screen h-screen overflow-hidden bg-black"
            style={{ pointerEvents: "none" }}
        >
            <Canvas
                dpr={[1, 2]}
                camera={{
                    position: [0, 0, 15],
                    fov: 35,
                    near: 0.01,
                    far: 1000,
                }}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance",
                    toneMapping: THREE.NeutralToneMapping,
                    toneMappingExposure: 1.5,
                }}
            >
                <ambientLight intensity={1.5} />
                <directionalLight position={[10, 10, 5]} intensity={2.5} />
                <directionalLight position={[-10, -10, -5]} intensity={1} />
                <pointLight position={[0, 5, 5]} intensity={2} />

                <Suspense fallback={null}>
                    {/* Gradient is now a real mesh IN the scene — glass refracts it natively */}
                    <ShaderGradient
                        control="props"
                        cameraControl={false}
                        animate="on"
                        brightness={1.35}
                        cAzimuthAngle={180}
                        cDistance={3.8}
                        cPolarAngle={80}
                        cameraZoom={1}
                        color1="#13906f"
                        color2="#487548"
                        color3="#000000"
                        envPreset="city"
                        fov={45}
                        grain="on"
                        lightType="3d"
                        pixelDensity={1}
                        positionX={0}
                        positionY={-4.6}
                        positionZ={0}
                        reflection={0.1}
                        rotationX={50}
                        rotationY={0}
                        rotationZ={0}
                        type="waterPlane"
                        uAmplitude={0}
                        uDensity={1.5}
                        uFrequency={0}
                        uSpeed={0.3}
                        uStrength={1}
                        uTime={8}
                        wireframe={false}
                    />
                    <LiquidGlassText text="talyawy" />
                    <Environment preset="city" environmentIntensity={0.25} />
                </Suspense>
            </Canvas>
        </div>
    );
}
