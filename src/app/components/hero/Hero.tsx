"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import ShaderGradientSource from "./ShaderGradientSource";
import ShaderGradientPlane from "./ShaderGradientPlane";
import LiquidGlassText from "./LiquidGlassText";
import { ensureShaderGradientCompat } from "./shadergradient-compat";
import { Environment } from "@react-three/drei";
import * as THREE from "three";

ensureShaderGradientCompat();

export default function Hero() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <ShaderGradientSource />

      <div className="absolute inset-0">
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
            <ShaderGradientPlane />
            <LiquidGlassText text="talyawy" />
            <Environment
              preset="city"
              environmentIntensity={0.25}
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}