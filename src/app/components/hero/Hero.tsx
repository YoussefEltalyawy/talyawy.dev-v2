"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect, useRef } from "react";
import { ShaderGradient } from "@shadergradient/react";
import LiquidGlassText from "./HeroText";
import { ensureShaderGradientCompat } from "./shadergradient-compat";
import { Environment, useProgress } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { detectLowTierDevice } from "@/app/lib/deviceTier";

ensureShaderGradientCompat();

gsap.registerPlugin(useGSAP);

export default function Hero() {
  const [material, setMaterial] = useState<THREE.Material | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const waveGroupRef = useRef<THREE.Group>(null);
  const textGroupRef = useRef<THREE.Group>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLowTier, setIsLowTier] = useState(false);
  const [safeAreaBottom, setSafeAreaBottom] = useState(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setIsLowTier(detectLowTierDevice());
  }, []);

  useEffect(() => {
    // Dynamically measure the hardware safe area inset at the bottom (like Safari's pill)
    const div = document.createElement("div");
    div.style.paddingBottom = "env(safe-area-inset-bottom)";
    document.body.appendChild(div);
    const pb = parseFloat(window.getComputedStyle(div).paddingBottom);
    document.body.removeChild(div);
    if (!isNaN(pb)) {
      setSafeAreaBottom(pb);
    }
  }, []);

  const { progress } = useProgress();

  useGSAP(() => {
    if (progress < 100 || !material || !waveGroupRef.current || !textGroupRef.current) return;

    if (isLowTier) {
      gsap.set(".anim-header", { opacity: 1, filter: "blur(0px)" });
      gsap.set(".anim-header-item", { y: "0%" });
      gsap.set(canvasWrapperRef.current, { opacity: 1, filter: "blur(0px)" });
      gsap.set(material, { opacity: 1, roughness: 0.5 });
      gsap.set(".anim-subtext-word", { opacity: 1, filter: "blur(0px)" });
      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" }
    });

    // Step 1: Header Section (blur -> sharp focus)
    tl.to(".anim-header", {
      opacity: 1,
      filter: "blur(0px)",
      duration: 1.2,
    });
    
    tl.fromTo(".anim-header-item",
      { y: "-100%" },
      { y: "0%", duration: 1.2 },
      "<"
    );

    // Step 2: Wave Shader (strong blur -> clear focus + slide up)
    // We animate the canvas wrapper which contains the wave shader for the blur.
    tl.to(canvasWrapperRef.current, {
      opacity: 1,
      filter: "blur(0px)",
      duration: 1.5,
    }, "-=0.2");
    
    // Animate the wave group sliding up
    tl.fromTo(waveGroupRef.current.position, 
      { y: -2 }, 
      { y: 0, duration: 1.5 }, 
      "<" // Start at the same time as the wrapper blur
    );

    // Step 3: Hero Title ("talyawy")
    // Animating the material's roughness from 1 to 0.5 (blur -> clear)
    // and opacity from 0 to 1
    tl.to(material, {
      opacity: 1,
      roughness: 0.5,
      duration: 1.5,
    }, "-=0.5");

    // Animate the hero text sliding up
    tl.fromTo(textGroupRef.current.position,
      { y: -1 },
      { y: 0, duration: 1.5 },
      "<" // Start at the same time as the material blur/opacity animation
    );

    // Step 4: Sub Hero Text
    tl.to(".anim-subtext-word", {
      opacity: 1,
      filter: "blur(0px)",
      duration: 1,
      stagger: 0.15,
    }, "-=0.5");

  }, [progress, material, isLowTier]);

  const visibleStyle: React.CSSProperties = isLowTier
    ? { opacity: 1, filter: "blur(0px)" }
    : {};

  return (
    <div
      className="relative w-screen h-[100vh] overflow-hidden bg-black"
      style={{ pointerEvents: "none" }}
    >
      {/* Absolute overlay for the description text */}
      <div className="absolute top-[22vh] md:top-[25vh] right-6 md:right-8 z-10 max-w-sm md:max-w-xl text-right select-none flex flex-wrap justify-end gap-x-1.5 md:gap-x-2">
        {["Creating", "the", "kind", "of", "internet", "worth", "exploring."].map((word, index) => (
          <span 
            key={index}
            className={`anim-subtext-word ${isLowTier ? '' : 'opacity-0'} text-white font-kh-teka font-medium text-xl md:text-[22px] leading-snug md:leading-normal`}
            style={{ ...visibleStyle, filter: isLowTier ? "blur(0px)" : "blur(10px)", willChange: "filter, opacity" }}
          >
            {word}
            {/* Insert break before "worth" on mobile to match the original break */}
            {word === "internet" && <span className="md:hidden basis-full h-0"></span>}
          </span>
        ))}
      </div>

      <div 
        ref={canvasWrapperRef}
        className={`absolute inset-0 ${isLowTier ? '' : 'opacity-0'}`} 
        style={{ ...visibleStyle, filter: isLowTier ? "blur(0px)" : `blur(${isLowTier ? 5 : 20}px)`, willChange: "filter, opacity" }}
      >
        <Canvas
          style={{ pointerEvents: "none" }}
          dpr={[1, isLowTier ? 1 : 2]}
          camera={{
            position: [0, 0, 3.8],
            fov: 45,
            near: 0.01,
            far: 1000,
          }}
          gl={{
            antialias: !isLowTier,
            alpha: true,
            localClippingEnabled: true,
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
            <group ref={waveGroupRef} scale={[2.5, 2.5, 2.5]}>
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
              pixelDensity={isLowTier ? 0.5 : 1}
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
            <group ref={textGroupRef}>
              <LiquidGlassText text="talyawy" safeAreaPixels={safeAreaBottom} onMaterialReady={setMaterial} isLowTier={isLowTier} />
            </group>
            {!isLowTier && <Environment preset="city" environmentIntensity={0.25} />}
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
