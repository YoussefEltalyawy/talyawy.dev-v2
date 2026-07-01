"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import "./DitherMaterial";
import { useDeviceTier } from "@/app/hooks/useDeviceTier";

const DITHER_COLORS: [string, string, string, string] = [
  "#111b11",
  "#2e422e",
  "#3f6856",
  "#8adaaa",
];

/** Sets the Three.js scene background so bloom has a solid base (no alpha artifacts). */
function SceneBg() {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color("#111b11");
    return () => { scene.background = null; };
  }, [scene]);
  return null;
}

function DitherPlane({
  video,
  ready,
  mouseRef,
}: {
  video: HTMLVideoElement;
  ready: boolean;
  mouseRef: React.RefObject<THREE.Vector2>;
}) {
  const { size } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const tier = useDeviceTier();
  const smoothMouse = useRef(new THREE.Vector2(-1, -1));

  useEffect(() => {
    console.log("DitherPlane: Rendering. Three.js canvas size:", size.width, "x", size.height, "ready state flag:", ready);
  }, [size, ready]);

  const texture = useMemo(() => {
    console.log("DitherPlane: Creating new VideoTexture for video:", video.src);
    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
  }, [video]);

  useEffect(() => {
    return () => {
      console.log("DitherPlane: Disposing VideoTexture");
      texture.dispose();
    };
  }, [texture]);

  const videoResolution = useMemo(
    () => {
      console.log("DitherPlane: Computing video resolution:", video.videoWidth, "x", video.videoHeight);
      return new THREE.Vector2(video.videoWidth || 16, video.videoHeight || 9);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [video, ready]
  );

  const pixelation = tier === "low" ? 4 : 3;

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uResolution.value.set(
        size.width,
        size.height
      );
      // Smoothly lerp mouse position for a fluid cursor glow
      const target = mouseRef.current ?? new THREE.Vector2(-1, -1);
      smoothMouse.current.lerp(target, 0.08);
      materialRef.current.uniforms.uMouse.value.copy(smoothMouse.current);
    }
  });

  const colors = useMemo(
    () => DITHER_COLORS.map((c) => new THREE.Color(c)),
    []
  );

  return (
    <mesh scale={[size.width, size.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <ditherMaterial
        ref={materialRef}
        uMap={texture}
        uVideoResolution={videoResolution}
        uPixelation={pixelation}
        uOpacity={ready ? 1 : 0}
        uColors={colors}
      />
    </mesh>
  );
}

export default function DitherHandCanvas({
  className = "",
  videoSrc = "/contact-hands-reaching.mp4",
}: {
  className?: string;
  videoSrc?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mouseUvRef = useRef(new THREE.Vector2(-1, -1));
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const isVisibleRef = useRef(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Create + own the <video> element manually so we control exactly when
  // it plays (paused off-screen / hidden tab / reduced-motion).
  useEffect(() => {
    console.log("DitherHandCanvas: Initializing video with src:", videoSrc);
    const el = document.createElement("video");
    el.src = videoSrc;
    el.muted = true;
    el.loop = true;
    el.playsInline = true;
    el.crossOrigin = "anonymous";
    el.preload = "auto";
    videoRef.current = el;

    const handleLoaded = () => {
      console.log("DitherHandCanvas: Video loadeddata event fired. Natural size:", el.videoWidth, "x", el.videoHeight);
      setVideo(el);
      setReady(true);
    };

    const handleMetadata = () => {
      console.log("DitherHandCanvas: Video loadedmetadata event. Size:", el.videoWidth, "x", el.videoHeight);
    };

    const handleError = (e: Event) => {
      console.error("DitherHandCanvas: Video failed to load. Event:", e, "Error object:", el.error);
    };

    el.addEventListener("loadedmetadata", handleMetadata);
    el.addEventListener("loadeddata", handleLoaded);
    el.addEventListener("error", handleError);

    // If video is already cached/loaded, readyState will be >= 2 (HAVE_CURRENT_DATA)
    if (el.readyState >= 2) {
      console.log("DitherHandCanvas: Video readyState already >= 2 on init. ReadyState:", el.readyState);
      handleLoaded();
    }

    return () => {
      console.log("DitherHandCanvas: Cleaning up video element");
      el.removeEventListener("loadedmetadata", handleMetadata);
      el.removeEventListener("loadeddata", handleLoaded);
      el.removeEventListener("error", handleError);
      el.pause();
      el.src = "";
      videoRef.current = null;
    };
  }, [videoSrc]);

  // Pause/play based on viewport visibility + tab visibility + reduced motion.
  useEffect(() => {
    if (!wrapperRef.current) {
      console.warn("DitherHandCanvas: wrapperRef.current is null on playback sync setup");
      return;
    }

    const syncPlayback = () => {
      const el = videoRef.current;
      if (!el) {
        console.log("DitherHandCanvas: syncPlayback called, but no video element exists yet.");
        return;
      }
      const shouldPlay =
        isVisibleRef.current && !document.hidden && !reducedMotion;
      console.log("DitherHandCanvas: syncPlayback evaluation", {
        isVisible: isVisibleRef.current,
        documentHidden: document.hidden,
        reducedMotion,
        shouldPlay,
        readyState: el.readyState,
        paused: el.paused
      });
      if (shouldPlay) {
        el.play()
          .then(() => console.log("DitherHandCanvas: video started playing successfully"))
          .catch((err) => console.error("DitherHandCanvas: el.play() failed:", err));
      } else {
        el.pause();
        console.log("DitherHandCanvas: video paused");
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        console.log("DitherHandCanvas: IntersectionObserver triggered. isIntersecting:", entry.isIntersecting);
        isVisibleRef.current = entry.isIntersecting;
        syncPlayback();
      },
      { threshold: 0.05 }
    );
    io.observe(wrapperRef.current);

    const handleVisibility = () => {
      console.log("DitherHandCanvas: visibilitychange triggered. document.hidden:", document.hidden);
      syncPlayback();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Reduced-motion / video-ready changes also need a resync.
    syncPlayback();

    return () => {
      console.log("DitherHandCanvas: Cleaning up playback sync");
      io.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [video, reducedMotion]);

  // Track mouse globally to bypass pointer-events blocking from sibling overlays (like the content div).
  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      
      const x = rawX / rect.width;
      // Invert Y because WebGL UV space starts at bottom-left (0,0)
      const y = 1.0 - (rawY / rect.height);
      
      // If mouse is within the bounding box of the canvas (with a small buffer)
      if (x >= -0.05 && x <= 1.05 && y >= -0.05 && y <= 1.05) {
        mouseUvRef.current.set(x, y);
      } else {
        mouseUvRef.current.set(-1, -1);
      }
    };

    window.addEventListener("mousemove", handleGlobalMove);
    return () => {
      window.removeEventListener("mousemove", handleGlobalMove);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={className || "relative"}
      style={{
        opacity: ready ? 1 : 0,
        transition: "opacity 900ms ease",
      }}
      aria-hidden
    >
      {video && (
        <Canvas
          orthographic
          camera={{ position: [0, 0, 10], zoom: 1 }}
          dpr={[1, 1.5]}
          gl={{ 
            antialias: false, 
            alpha: false, 
            powerPreference: "low-power",
            toneMapping: THREE.NoToneMapping
          }}
          style={{ pointerEvents: "none" }}
        >
          <SceneBg />
          <DitherPlane video={video} ready={ready} mouseRef={mouseUvRef} />
          <EffectComposer>
            <Bloom
              intensity={0.8}
              luminanceThreshold={0.4}
              luminanceSmoothing={0.7}
              radius={0.85}
              mipmapBlur
            />
          </EffectComposer>
        </Canvas>
      )}
    </div>
  );
}
