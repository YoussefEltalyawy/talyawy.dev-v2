"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

export default function ShaderGradientPlane() {
  const [sourceCanvas, setSourceCanvas] =
    useState<HTMLCanvasElement | null>(null);

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
    <mesh
      position={[0, 0, -1]}
      renderOrder={-100}
    >
      <planeGeometry args={[20, 20]} />
      <meshBasicMaterial
        map={texture}
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
}