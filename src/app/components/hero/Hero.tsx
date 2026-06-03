"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import ShaderGradientSource from "./ShaderGradientSource";
import ShaderGradientPlane from "./ShaderGradientPlane";
import LiquidGlassText from "./LiquidGlassText";
import { ensureShaderGradientCompat } from "./shadergradient-compat";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
// Apply compatibility patch for three.js and shadergradient on the client side
ensureShaderGradientCompat();

export default function Hero() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* 1. Offscreen Canvas source for the shader gradient */}
      <ShaderGradientSource />

      {/* 2. Main 3D Canvas rendering the scene */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Canvas
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            toneMappingExposure: 1.5,
            stencil: false,
            alpha: true,
            toneMapping: THREE.NeutralToneMapping,
          }}
          dpr={[1, 1.5]}
        >
          {/* Lights necessary for the transmission/glass material refraction */}
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 10, 5]} intensity={2.5} />
          <directionalLight position={[-10, -10, -5]} intensity={1} />
          <pointLight position={[0, 5, 5]} intensity={2} />
          
          <Suspense fallback={null}>
            {/* The background plane projection */}
            <ShaderGradientPlane />
            
            {/* The refracting 3D glass text */}
            <LiquidGlassText text="talyawy" />
            <Environment preset="warehouse" environmentIntensity={0.25} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}