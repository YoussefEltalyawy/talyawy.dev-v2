"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

export default function ShaderGradientPlane() {
  const [sourceCanvas, setSourceCanvas] = useState<HTMLCanvasElement | null>(null);
  const { viewport } = useThree();

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

      frameId = window.requestAnimationFrame(findCanvas);
    };

    findCanvas();

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  const texture = useMemo(() => {
    if (!sourceCanvas) return null;

    const nextTexture = new THREE.CanvasTexture(sourceCanvas);
    nextTexture.colorSpace = THREE.SRGBColorSpace;
    nextTexture.minFilter = THREE.LinearFilter;
    nextTexture.magFilter = THREE.LinearFilter;
    nextTexture.generateMipmaps = false;

    return nextTexture;
  }, [sourceCanvas]);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  useFrame(() => {
    if (texture) texture.needsUpdate = true;
  });

  if (!texture) return null;

  return (
    <mesh position={[0, 0, -1.6]} renderOrder={-100}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <meshBasicMaterial map={texture} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}