"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

export default function ShaderGradientPlane() {
  const { size } = useThree(); 
  const aspect = size.width / size.height; // Calculate the exact shape of the screen

  const [sourceCanvas, setSourceCanvas] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let frameId = 0;
    const findCanvas = () => {
      const nextCanvas = document.querySelector(
        ".shader-background-source canvas"
      ) as HTMLCanvasElement | null;

      if (nextCanvas) {
        setSourceCanvas(nextCanvas);
        return;
      }
      frameId = requestAnimationFrame(findCanvas);
    };

    findCanvas();
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  const texture = useMemo(() => {
    if (!sourceCanvas) return null;
    const tex = new THREE.CanvasTexture(sourceCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
  }, [sourceCanvas]);

  useFrame(() => {
    if (texture) texture.needsUpdate = true;
  });

  useEffect(() => {
    return () => texture?.dispose();
  }, [texture]);

  if (!texture) return null;

  return (
    <mesh position={[0, 0, -5]} renderOrder={-100}>
      {/* We keep the height at 20 to ensure it covers the background, 
        but multiply the width by the aspect ratio. 
        This guarantees the wave perfectly retains its natural shape!
      */}
      <planeGeometry args={[20 * aspect, 20]} />
      <meshBasicMaterial map={texture} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}