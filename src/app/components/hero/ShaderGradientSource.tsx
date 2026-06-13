"use client";

import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";

const hiddenSourceStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  zIndex: -10,
  opacity: 0.001, // Keeps it hidden but active
  pointerEvents: "none",
};

export default function ShaderGradientSource() {
  return (
    <ShaderGradientCanvas
      className="shader-background-source"
      style={hiddenSourceStyle}
      pointerEvents="none"
      preserveDrawingBuffer
      pixelDensity={0.5} // <-- THIS IS THE LAG KILLER. Cuts rendering workload in half.
      fov={45}
      powerPreference="high-performance"
    >
      <ShaderGradient
        control="props"
        // @ts-ignore
        cameraControl={false}
        animate="on"
        brightness={1.35}
        cAzimuthAngle={180}
        cDistance={2.8}
        cPolarAngle={80}
        color1="#13906f"
        color2="#487548"
        color3="#000000"
        envPreset="city"
        fov={45}
        grain="on"
        lightType="3d"
        positionX={0}
        positionY={-4.6}
        positionZ={0}
        reflection={0.1}
        rotationX={50}
        type="waterPlane"
        uDensity={1.5}
        uSpeed={0.3}
        uTime={8}
      />
    </ShaderGradientCanvas>
  );
}