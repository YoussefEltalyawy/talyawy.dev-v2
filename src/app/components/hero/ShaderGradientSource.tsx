"use client";

import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";

const hiddenSourceStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: -10,
  opacity: 0,
  pointerEvents: "none",
};

export default function ShaderGradientSource() {
  return (
    <ShaderGradientCanvas
      className="shader-background-source"
      style={hiddenSourceStyle}
      pointerEvents="none"
      preserveDrawingBuffer
      pixelDensity={1}
      fov={45}
      powerPreference="high-performance"
    >
      <ShaderGradient
      control="props"
      cameraControl={false}
      animate="on"
      brightness={1.6}
      cAzimuthAngle={180}
      cDistance={2.8}
      cPolarAngle={80}
      cameraZoom={1}
      color1="#42837F"
      color2="#607e5f"
      color3="#212121"
      envPreset="city"
      fov={45}
      grain="on"
      lightType="3d"
      pixelDensity={1}
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
  );
}