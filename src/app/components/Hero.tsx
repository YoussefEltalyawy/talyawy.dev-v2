"use client";
import React from "react";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";

export default function Hero() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <ShaderGradientCanvas className="pointer-events-none">
        <ShaderGradient
          animate="on"
          brightness={1.6}
          cAzimuthAngle={180}
          cDistance={2.8}
          cPolarAngle={80}
          cameraZoom={9.1}
          color1="#42837F"
          color2="#607e5f"
          color3="#212121"
          envPreset="city"
          fov={45}
          grain="on"
          lightType="3d"
          pixelDensity={3}
          positionX={0}
          positionY={-5.2}
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
      </ShaderGradientCanvas>

      {/* Hero text overlay */}
      <div className="absolute -bottom-18 inset-0 flex items-end justify-center pointer-events-none z-10">
        <h1 className="font-editorial italic select-none text-[460px] ">talyawy</h1>
      </div>
    </div>
  );
}
