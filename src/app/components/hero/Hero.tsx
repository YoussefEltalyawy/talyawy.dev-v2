"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { ShaderGradient } from "@shadergradient/react";
import LiquidGlassText from "./HeroText";
import { ensureShaderGradientCompat } from "./shadergradient-compat";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";

ensureShaderGradientCompat();

export default function Hero() {
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const waveGroupRef = useRef<THREE.Group | null>(null);
  const textGroupRef = useRef<THREE.Group | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [safeAreaBottom, setSafeAreaBottom] = useState(0);

  // --- Robust readiness tracking via refs ---
  // Each prerequisite sets its ref and calls tryStartAnimation().
  // The animation fires exactly once when ALL conditions are met,
  // regardless of the order the prerequisites resolve.
  const materialRef = useRef<THREE.Material | null>(null);
  const hasPlayedRef = useRef(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const safetyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const div = document.createElement("div");
    div.style.paddingBottom = "env(safe-area-inset-bottom)";
    document.body.appendChild(div);
    const pb = parseFloat(window.getComputedStyle(div).paddingBottom);
    document.body.removeChild(div);
    if (!isNaN(pb)) {
      setSafeAreaBottom(pb);
    }
  }, []);

  const tryStartAnimation = useCallback(() => {
    // Guard: only fire once, and only when every piece is ready
    if (hasPlayedRef.current) return;
    if (
      !materialRef.current ||
      !waveGroupRef.current ||
      !textGroupRef.current ||
      !canvasWrapperRef.current
    )
      return;

    hasPlayedRef.current = true;

    // Clear safety-net interval once animation starts
    if (safetyIntervalRef.current) {
      clearInterval(safetyIntervalRef.current);
      safetyIntervalRef.current = null;
    }

    const mat = materialRef.current;
    const waveGroup = waveGroupRef.current;
    const textGroup = textGroupRef.current;
    const canvasWrapper = canvasWrapperRef.current;

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
    });
    timelineRef.current = tl;

    // Step 1: Header Section (blur -> sharp focus)
    tl.to(".anim-header", {
      opacity: 1,
      filter: "blur(0px)",
      duration: 1.2,
    });

    tl.fromTo(
      ".anim-header-item",
      { y: "-100%" },
      { y: "0%", duration: 1.2 },
      "<"
    );

    // Step 2: Wave Shader (strong blur -> clear focus + slide up)
    tl.to(
      canvasWrapper,
      {
        opacity: 1,
        filter: "blur(0px)",
        duration: 1.5,
      },
      "-=0.2"
    );

    tl.fromTo(
      waveGroup.position,
      { y: -2 },
      { y: 0, duration: 1.5 },
      "<"
    );

    // Step 3: Hero Title ("talyawy")
    tl.to(
      mat,
      {
        opacity: 1,
        roughness: 0.5,
        duration: 1.5,
      },
      "-=0.5"
    );

    tl.fromTo(
      textGroup.position,
      { y: -1 },
      { y: 0, duration: 1.5 },
      "<"
    );

    // Step 4: Sub Hero Text
    tl.to(
      ".anim-subtext-word",
      {
        opacity: 1,
        filter: "blur(0px)",
        duration: 1,
        stagger: 0.15,
      },
      "-=0.5"
    );
  }, []);

  // Safety-net: poll every 500ms in case a ref callback was missed.
  // Automatically stops once the animation starts or component unmounts.
  useEffect(() => {
    safetyIntervalRef.current = setInterval(() => {
      if (hasPlayedRef.current) {
        clearInterval(safetyIntervalRef.current!);
        safetyIntervalRef.current = null;
        return;
      }
      tryStartAnimation();
    }, 500);

    return () => {
      if (safetyIntervalRef.current) {
        clearInterval(safetyIntervalRef.current);
        safetyIntervalRef.current = null;
      }
    };
  }, [tryStartAnimation]);

  // Cleanup the timeline on unmount
  useEffect(() => {
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
    };
  }, []);

  // Callback for when the material is ready from HeroText
  const handleMaterialReady = useCallback(
    (mat: THREE.Material) => {
      materialRef.current = mat;
      tryStartAnimation();
    },
    [tryStartAnimation]
  );

  // Ref callbacks for 3D groups — called when Suspense resolves and groups mount.
  // Unlike onCreated (which fires before Suspense resolves), these fire at the
  // exact moment each group enters the scene graph.
  const waveGroupRefCallback = useCallback(
    (node: THREE.Group | null) => {
      waveGroupRef.current = node;
      if (node) tryStartAnimation();
    },
    [tryStartAnimation]
  );

  const textGroupRefCallback = useCallback(
    (node: THREE.Group | null) => {
      textGroupRef.current = node;
      if (node) tryStartAnimation();
    },
    [tryStartAnimation]
  );

  return (
    <div
      className="relative w-screen h-[100vh] overflow-hidden bg-black"
      style={{ pointerEvents: "none" }}
    >
      {/* Absolute overlay for the description text */}
      <div className="absolute top-[22vh] md:top-[25vh] right-6 md:right-8 z-10 max-w-sm md:max-w-xl text-right select-none flex flex-wrap justify-end gap-x-1.5 md:gap-x-2">
        {[
          "Creating",
          "the",
          "kind",
          "of",
          "internet",
          "worth",
          "exploring.",
        ].map((word, index) => (
          <span
            key={index}
            className="anim-subtext-word opacity-0 text-white font-kh-teka font-medium text-xl md:text-[22px] leading-snug md:leading-normal"
            style={{ filter: "blur(10px)", willChange: "filter, opacity" }}
          >
            {word}
            {word === "internet" && (
              <span className="md:hidden basis-full h-0"></span>
            )}
          </span>
        ))}
      </div>

      <div
        ref={canvasWrapperRef}
        className="absolute inset-0 opacity-0"
        style={{ filter: "blur(20px)", willChange: "filter, opacity" }}
      >
        <Canvas
          style={{ pointerEvents: "none" }}
          dpr={[1, 2]}
          camera={{
            position: [0, 0, 3.8],
            fov: 45,
            near: 0.01,
            far: 1000,
          }}
          gl={{
            antialias: true,
            alpha: true,
            localClippingEnabled: true,
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
            <group ref={waveGroupRefCallback} scale={[2.5, 2.5, 2.5]}>
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
                // @ts-ignore
                fov={40}
                grain="on"
                lightType="3d"
                pixelDensity={1}
                positionX={0}
                positionY={isMobile ? -5.2 : -4.6}
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
            <group ref={textGroupRefCallback}>
              <LiquidGlassText
                text="talyawy"
                safeAreaPixels={safeAreaBottom}
                onMaterialReady={handleMaterialReady}
              />
            </group>
            <Environment preset="city" environmentIntensity={0.25} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}

