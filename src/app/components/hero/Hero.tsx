  "use client";
  
  import { Canvas } from "@react-three/fiber";
  import { Suspense } from "react";
  import { ShaderGradient } from "@shadergradient/react";
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
        {/* Absolute overlay for the description text */}
        <div className="absolute top-[22vh] md:top-[25vh] right-6 md:right-8 z-10 max-w-sm md:max-w-xl text-right select-none">
          <p className="text-white font-kh-teka font-medium text-lg md:text-[22px] leading-snug md:leading-normal opacity-90">
            Creating the kind of internet worth exploring.
  
  
          </p>
        </div>
  
        <Canvas
          dpr={[1, 2]}
          camera={{
            position: [0, 0, 12],
            fov: 40,
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
          {/* Lights pulled back to the front (+5) to illuminate the text */}
          <directionalLight position={[10, 10, 5]} intensity={2.5} />
          <directionalLight position={[-10, -10, -5]} intensity={1} />
          <pointLight position={[0, 5, 5]} intensity={2} />
  
          <Suspense fallback={null}>
            <group scale={[1.3, 1.3, 1.3]}>
            <ShaderGradient
              control="props"
              animate="on"
              brightness={0.4}
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
            </group>
            <LiquidGlassText text="talyawy" />
            <Environment preset="city" environmentIntensity={0.25} />
          </Suspense>
        </Canvas>
      </div>
    );
  }