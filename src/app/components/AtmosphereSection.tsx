"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import gsap from "gsap";
import SplitType from "split-type";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import AtmosphereField from "./AtmosphereField";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

export default function AtmosphereSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const outlineTextRef = useRef<HTMLDivElement>(null);
    const shimmerMaskRectRef = useRef<SVGRectElement>(null);
    const shimmerGroupRef = useRef<SVGGElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const mousePosRef = useRef({ x: -1000, y: -1000 });
    const lastMousePosRef = useRef({ x: -1000, y: -1000 });
    const pointerMovedRef = useRef(false);
    const rafIdRef = useRef<number | null>(null);
    const [hasPointer, setHasPointer] = useState(false);

    // Animation state refs
    const timeRef = useRef(0);
    const currentTXRef = useRef(-0.5); // Tracks the actual gradient position
    const hoverBoostRef = useRef(0); // Tracks hover state 0..1
    const gyroRef = useRef({ x: 0, y: 0 });
    const depthPosRef = useRef({ x: 0, y: 0 });
    const lastTimestampRef = useRef<number | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setHasPointer(window.matchMedia("(pointer: fine)").matches);

            const handleOrientation = (e: DeviceOrientationEvent) => {
                if (e.gamma !== null && e.beta !== null) {
                    const x = gsap.utils.clamp(-1, 1, e.gamma / 45);
                    const y = gsap.utils.clamp(-1, 1, (e.beta - 45) / 45);
                    gyroRef.current = { x, y };
                }
            };
            window.addEventListener("deviceorientation", handleOrientation);
            return () =>
                window.removeEventListener(
                    "deviceorientation",
                    handleOrientation,
                );
        }
    }, []);

    const updateShimmer = useCallback(
        (timestamp: number) => {
            const container = outlineTextRef.current;
            const maskRect = shimmerMaskRectRef.current;
            const group = shimmerGroupRef.current;

            // Delta-time based stepping
            const last = lastTimestampRef.current;
            const deltaSeconds =
                last !== null ? Math.min((timestamp - last) / 1000, 0.05) : 0;
            lastTimestampRef.current = timestamp;

            if (container && maskRect) {
                const rect = container.getBoundingClientRect();

                if (rect.width > 0 && rect.height > 0) {
                    let targetHover = 0;
                    let mouseDeltaX = 0;

                    // 1. Mouse Tracking Logic
                    if (hasPointer && pointerMovedRef.current) {
                        const margin = 140; // Trigger area around text
                        const withinX =
                            mousePosRef.current.x > rect.left - margin &&
                            mousePosRef.current.x < rect.right + margin;
                        const withinY =
                            mousePosRef.current.y > rect.top - margin &&
                            mousePosRef.current.y < rect.bottom + margin;

                        if (withinX && withinY) {
                            targetHover = 1;
                            if (lastMousePosRef.current.x !== -1000) {
                                mouseDeltaX = (mousePosRef.current.x - lastMousePosRef.current.x) / rect.width;
                            }
                        }
                    }
                    
                    lastMousePosRef.current.x = mousePosRef.current.x;
                    lastMousePosRef.current.y = mousePosRef.current.y;

                    // 2. Smooth Easing for Hover State
                    const hoverEase = 1 - Math.pow(0.05, deltaSeconds);
                    hoverBoostRef.current += (targetHover - hoverBoostRef.current) * hoverEase;

                    // 3. Continuous automatic sweep + Mouse Scrubbing
                    const sweepSpeed = 0.35; // Base automatic speed
                    const mouseScrub = mouseDeltaX * targetHover * 2.0; // Mouse pushes the light
                    
                    timeRef.current += (deltaSeconds * sweepSpeed) + mouseScrub;

                    // Safe modulo for looping between 0 and 2.0 (covers -1.0 to 1.0 range)
                    const loopMax = 2.0;
                    timeRef.current = ((timeRef.current % loopMax) + loopMax) % loopMax;

                    let targetTX = timeRef.current - 1.0; // Maps 0..2.0 to -1.0..1.0

                    // 4. Ease the actual gradient transform towards the target
                    const posEase = 1 - Math.pow(0.001, deltaSeconds);
                    const diff = targetTX - currentTXRef.current;
                    
                    // Detect wrap-around and snap currentTXRef directly without rewind ease
                    if (Math.abs(diff) > 1.0) {
                        currentTXRef.current = targetTX;
                    } else {
                        currentTXRef.current += diff * posEase;
                    }

                    // Calculate parallax depth effect
                    const maxDepth = hasPointer ? 35 : 20;
                    let targetDepthX = 0;
                    let targetDepthY = 0;

                    if (hasPointer && pointerMovedRef.current) {
                        const centerX = rect.left + rect.width / 2;
                        const centerY = rect.top + rect.height / 2;
                        targetDepthX =
                            ((mousePosRef.current.x - centerX) /
                                window.innerWidth) *
                            maxDepth;
                        targetDepthY =
                            ((mousePosRef.current.y - centerY) /
                                window.innerHeight) *
                            maxDepth;
                    } else if (!hasPointer) {
                        targetDepthX = gyroRef.current.x * maxDepth;
                        targetDepthY = gyroRef.current.y * maxDepth;
                    }

                    // Smooth depth easing
                    depthPosRef.current.x +=
                        (targetDepthX - depthPosRef.current.x) * 0.05;
                    depthPosRef.current.y +=
                        (targetDepthY - depthPosRef.current.y) * 0.05;

                    if (svgRef.current) {
                        // Inverse movement creates a sense of spatial depth
                        svgRef.current.style.transform = `translate3d(${-depthPosRef.current.x}px, ${-depthPosRef.current.y}px, 0)`;
                    }

                    if (maskRect) {
                        maskRect.style.transform = `translateX(${currentTXRef.current * 100}%)`;
                    }

                    if (group) {
                        // Base glow is subtle, brightens significantly when hovered
                        group.style.opacity = String(
                            0.6 + hoverBoostRef.current * 0.4,
                        );
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
                {
                    opacity: 1,
                    filter: "blur(0px)",
                    y: 0,
                    duration: 1,
                    ease: "power2.out",
                },
            );

            tl.fromTo(
                ".atm-outline",
                { opacity: 0, filter: "blur(12px)", scale: 0.96 },
                {
                    opacity: 1,
                    filter: "blur(0px)",
                    scale: 1,
                    duration: 1.4,
                    ease: "power2.out",
                },
                "-=0.5",
            );

            // Layered Parallax Scroll (Forces depth dynamically on iOS/Mobile)
            gsap.to(".atm-outline", {
                y: -160,
                ease: "power1.out",
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1.5,
                },
            });

            const paragraphEl =
                containerRef.current?.querySelector(".atm-paragraph");
            let splitText: SplitType | null = null;
            if (paragraphEl) {
                splitText = new SplitType(paragraphEl as HTMLElement, {
                    types: "lines",
                });
            }

            if (splitText && splitText.lines) {
                tl.fromTo(
                    splitText.lines,
                    { opacity: 0, filter: "blur(10px)", y: 24 },
                    {
                        opacity: 1,
                        filter: "blur(0px)",
                        y: 0,
                        duration: 1.1,
                        ease: "power2.out",
                        stagger: 0.15,
                    },
                    "-=0.6",
                );
            } else {
                tl.fromTo(
                    ".atm-paragraph",
                    { opacity: 0, filter: "blur(10px)", y: 24 },
                    {
                        opacity: 1,
                        filter: "blur(0px)",
                        y: 0,
                        duration: 1.1,
                        ease: "power2.out",
                    },
                    "-=0.6",
                );
            }

            return () => {
                if (splitText) splitText.revert();
            };
        },
        { scope: containerRef },
    );

    // Shared SVG text properties to keep markup clean
    const textProps = {
        x: "100%",
        y: "100%",
        dy: "-0.18em",
        textAnchor: "end" as const,
        className: "font-editorial italic stroke-[1px] md:stroke-[1.5px]",
        style: {
            fontSize: "clamp(2.5rem, 15vw, 18rem)",
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
            <AtmosphereField className="absolute inset-0 z-0" />
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
                    bottom: "clamp(16rem, 28vh, 22rem)",
                    width: "min(92vw, 1500px)",
                    height: "clamp(5.5rem, 20vw, 20rem)",
                    willChange: "filter, opacity, transform",
                }}
            >
                <svg
                    ref={svgRef}
                    width="100%"
                    height="100%"
                    style={{
                        overflow: "visible",
                        display: "block",
                        willChange: "transform",
                    }}
                >
                    <defs>
                        <linearGradient
                            id="atm-shimmer-gradient"
                            gradientUnits="objectBoundingBox"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0.15" // Slight downward slant
                            spreadMethod="pad"
                        >
                            {/* Softened, wider falloff for a luxurious light wrap */}
                            <stop
                                offset="0%"
                                stopColor="#fff"
                                stopOpacity="0"
                            />
                            <stop
                                offset="30%"
                                stopColor="#fff"
                                stopOpacity="0"
                            />
                            <stop
                                offset="45%"
                                stopColor="#fff"
                                stopOpacity="0.2"
                            />
                            <stop
                                offset="50%"
                                stopColor="#fff"
                                stopOpacity="1"
                            />
                            <stop
                                offset="55%"
                                stopColor="#fff"
                                stopOpacity="0.2"
                            />
                            <stop
                                offset="70%"
                                stopColor="#fff"
                                stopOpacity="0"
                            />
                            <stop
                                offset="100%"
                                stopColor="#fff"
                                stopOpacity="0"
                            />
                        </linearGradient>

                        <mask
                            id="atm-shimmer-mask"
                            x="-20%"
                            y="-20%"
                            width="140%"
                            height="140%"
                        >
                            <rect
                                ref={shimmerMaskRectRef}
                                x="0"
                                y="0"
                                width="100%"
                                height="100%"
                                fill="url(#atm-shimmer-gradient)"
                            />
                        </mask>
                    </defs>

                    {/* Base Outline */}
                    <text {...textProps} stroke="rgba(255,255,255,0.15)">
                        &ldquo;atmosphere
                    </text>

                    <g ref={shimmerGroupRef} mask="url(#atm-shimmer-mask)">
                        {/* Faux-bloom stack */}
                        <text
                            {...textProps}
                            stroke="#ffffff"
                            strokeWidth={6}
                            strokeOpacity={0.1}
                        >
                            &ldquo;atmosphere
                        </text>
                        <text
                            {...textProps}
                            stroke="#ffffff"
                            strokeWidth={3}
                            strokeOpacity={0.25}
                        >
                            &ldquo;atmosphere
                        </text>

                        {/* Crisp shimmer pass */}
                        <text {...textProps} stroke="#ffffff">																								
                            &ldquo;atmosphere
                        </text>
                    </g>
                </svg>
            </div>

            <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 z-10 font-kh-teka font-medium text-xl sm:text-2xl md:text-2xl lg:text-[1.85rem] max-w-[90vw] md:max-w-3xl leading-[1.3]">
                <div className="overflow-hidden">
                    <p
                        className="atm-paragraph"
                        style={{ willChange: "filter, opacity, transform" }}
                    >
                        To me, the web is so much more than clean grids and
                        layouts. It&apos;s an atmosphere. It&apos;s the subtle
                        shift in mood when a page loads, and the instant,
                        unwritten connection someone feels with a brand. I
                        design because I love turning abstract, messy human
                        ideas into digital spaces that people can actually feel
                        and remember.
                    </p>
                </div>
            </div>
        </section>
    );
}
