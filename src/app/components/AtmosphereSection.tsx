"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

export default function AtmosphereSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const outlineTextRef = useRef<HTMLDivElement>(null);
    const shimmerGradientRef = useRef<SVGLinearGradientElement>(null);
    const shimmerGroupRef = useRef<SVGGElement>(null);
    const mousePosRef = useRef({ x: -1000, y: -1000 });
    const pointerMovedRef = useRef(false);
    const rafIdRef = useRef<number | null>(null);
    const [hasPointer, setHasPointer] = useState(false);
    
    // Animation state refs
    const timeRef = useRef(0);
    const currentTXRef = useRef(-0.5); // Tracks the actual gradient position
    const hoverBoostRef = useRef(0); // Tracks hover state 0..1
    const lastTimestampRef = useRef<number | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setHasPointer(window.matchMedia("(pointer: fine)").matches);
        }
    }, []);

    const updateShimmer = useCallback(
        (timestamp: number) => {
            const container = outlineTextRef.current;
            const gradient = shimmerGradientRef.current;
            const group = shimmerGroupRef.current;

            // Delta-time based stepping
            const last = lastTimestampRef.current;
            const deltaSeconds = last !== null ? Math.min((timestamp - last) / 1000, 0.05) : 0;
            lastTimestampRef.current = timestamp;

            if (container && gradient) {
                const rect = container.getBoundingClientRect();

                if (rect.width > 0 && rect.height > 0) {
                    // 1. Continuous, slow automatic sweep
                    // 0.18 means it takes about ~11 seconds to cross the text. Very slow and premium.
                    const sweepSpeed = 0.18; 
                    timeRef.current = (timeRef.current + deltaSeconds * sweepSpeed) % 2;
                    let autoTX = timeRef.current - 0.5; // Maps 0..2 loop to -0.5..1.5

                    let targetHover = 0;
                    let mouseTX = autoTX;

                    // 2. Mouse Tracking Logic
                    if (hasPointer && pointerMovedRef.current) {
                        const margin = 140; // Trigger area around text
                        const withinX = mousePosRef.current.x > rect.left - margin && mousePosRef.current.x < rect.right + margin;
                        const withinY = mousePosRef.current.y > rect.top - margin && mousePosRef.current.y < rect.bottom + margin;

                        if (withinX && withinY) {
                            targetHover = 1;
                            const cursorNormX = (mousePosRef.current.x - rect.left) / rect.width;
                            mouseTX = cursorNormX * 2 - 0.5; // Map 0..1 to -0.5..1.5
                        }
                    }

                    // 3. Smooth Easing (Framerate independent)
                    // Fast ease for the light position
                    const posEase = 1 - Math.pow(0.001, deltaSeconds); 
                    // Slow ease for the hover state transition
                    const hoverEase = 1 - Math.pow(0.05, deltaSeconds); 

                    hoverBoostRef.current += (targetHover - hoverBoostRef.current) * hoverEase;

                    // Blend automatic sweep with mouse position based on hover state
                    let targetTX = autoTX * (1 - hoverBoostRef.current) + mouseTX * hoverBoostRef.current;

                    // Ease the actual gradient transform towards the target
                    currentTXRef.current += (targetTX - currentTXRef.current) * posEase;

                    gradient.setAttribute("gradientTransform", `translate(${currentTXRef.current} 0)`);

                    if (group) {
                        // Base glow is subtle, brightens significantly when hovered
                        group.style.opacity = String(0.6 + hoverBoostRef.current * 0.4);
                    }
                }
            }

            rafIdRef.current = requestAnimationFrame(updateShimmer);
        },
        [hasPointer],
    );

    useEffect(() => {
        lastTimestampRef.current = null;
        rafIdRef.current = requestAnimationFrame(updateShimmer);
        return () => {
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        };
    }, [updateShimmer]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
        mousePosRef.current = { x: e.clientX, y: e.clientY };
        pointerMovedRef.current = true;
    }, []);

    useGSAP(
        () => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 60%",
                    end: "bottom top",
                    toggleActions: "play none none reverse",
                },
            });

            tl.fromTo(
                ".atm-label",
                { opacity: 0, filter: "blur(8px)", y: 15 },
                { opacity: 1, filter: "blur(0px)", y: 0, duration: 1, ease: "power2.out" },
            );

            tl.fromTo(
                ".atm-outline",
                { opacity: 0, filter: "blur(12px)", scale: 0.96 },
                { opacity: 1, filter: "blur(0px)", scale: 1, duration: 1.4, ease: "power2.out" },
                "-=0.5",
            );

            tl.fromTo(
                ".atm-paragraph",
                { opacity: 0, filter: "blur(10px)", y: 24 },
                { opacity: 1, filter: "blur(0px)", y: 0, duration: 1.1, ease: "power2.out" },
                "-=0.6",
            );
        },
        { scope: containerRef },
    );

    // Shared SVG text properties to keep markup clean
    const textProps = {
        x: "100%",
        y: "100%",
        dy: "-0.18em",
        textAnchor: "end" as const,
        className: "font-editorial italic",
        style: {
            fontSize: "clamp(4.5rem, 13vw, 18rem)",
        },
        fill: "rgba(0,0,0,0)", // Fixes iOS Safari bug where fill="none" with stroke gradient fills the text
        vectorEffect: "non-scaling-stroke" as const, // Keeps stroke widths perfect on all screen sizes
        strokeLinecap: "round" as const, // Softens the ends of the stroke paths
        strokeLinejoin: "round" as const,
    };

    return (
        <section
            ref={containerRef}
            className="relative w-full h-screen bg-black text-white overflow-hidden"
            onMouseMove={handleMouseMove}
            style={{ cursor: "default" }}
        >
            <div
                className="atm-label absolute top-8 left-8 md:top-12 md:left-12 z-10 font-kh-teka font-normal text-[11px] md:text-xs uppercase tracking-[0.25em] text-neutral-500"
                style={{ willChange: "filter, opacity, transform" }}
            >
                [01 / the philosophy]
            </div>

            <div
                ref={outlineTextRef}
                className="atm-outline absolute z-[1] pointer-events-none select-none"
                style={{
                    right: "clamp(1rem, 3vw, 5rem)",
                    bottom: "clamp(14rem, 35vh, 28rem)",
                    width: "min(92vw, 1500px)",
                    height: "clamp(5.5rem, 20vw, 20rem)",
                    willChange: "filter, opacity, transform",
                }}
            >
                <svg width="100%" height="100%" style={{ overflow: "visible", display: "block" }}>
                    <defs>
                        <linearGradient
                            ref={shimmerGradientRef}
                            id="atm-shimmer-gradient"
                            gradientUnits="objectBoundingBox"
                            x1="-0.5"
                            y1="0"
                            x2="1.5"
                            y2="0.15" // Slight downward slant
                            spreadMethod="pad"
                        >
                            {/* Softened, wider falloff for a luxurious light wrap */}
                            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
                            <stop offset="30%" stopColor="#fff" stopOpacity="0" />
                            <stop offset="45%" stopColor="#fff" stopOpacity="0.2" />
                            <stop offset="50%" stopColor="#fff" stopOpacity="1" />
                            <stop offset="55%" stopColor="#fff" stopOpacity="0.2" />
                            <stop offset="70%" stopColor="#fff" stopOpacity="0" />
                            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Base Outline */}
                    <text
                        {...textProps}
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth={1}
                    >
                        "atmosphere
                    </text>

                    <g ref={shimmerGroupRef}>
                        {/* Faux-bloom stack */}
                        <text
                            {...textProps}
                            stroke="url(#atm-shimmer-gradient)"
                            strokeWidth={8}
                            strokeOpacity={0.15}
                        >
                            "atmosphere
                        </text>
                        <text
                            {...textProps}
                            stroke="url(#atm-shimmer-gradient)"
                            strokeWidth={4}
                            strokeOpacity={0.35}
                        >
                            "atmosphere
                        </text>

                        {/* Crisp shimmer pass */}
                        <text
                            {...textProps}
                            stroke="url(#atm-shimmer-gradient)"
                            strokeWidth={1.5}
                        >
                            "atmosphere
                        </text>
                    </g>
                </svg>
            </div>

            <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 z-10 font-kh-teka font-medium text-xl sm:text-2xl md:text-2xl lg:text-[1.85rem] max-w-[90vw] md:max-w-3xl leading-[1.3]">
                <div className="overflow-hidden">
                    <p className="atm-paragraph" style={{ willChange: "filter, opacity, transform" }}>
                        To me, the web is so much more than clean grids and layouts. It&apos;s an atmosphere. It&apos;s the subtle shift in mood when a page loads, and the instant, unwritten connection someone feels with a brand. I design because I love turning abstract, messy human ideas into digital spaces that people can actually feel and remember.
                    </p>
                </div>
            </div>
        </section>
    );
}