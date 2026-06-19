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
    const glowRef = useRef<HTMLDivElement>(null);
    const mousePosRef = useRef({ x: -1000, y: -1000 });
    const rafIdRef = useRef<number | null>(null);
    const [hasPointer, setHasPointer] = useState(false);
    const autoGlowPos = useRef({ x: 0, y: 0, time: 0 });

    // Check if device has pointer
    useEffect(() => {
        if (typeof window !== "undefined") {
            setHasPointer(window.matchMedia("(pointer: fine)").matches);
        }
    }, []);

    // Smooth mouse tracking using rAF to avoid React re-renders
    const updateGlow = useCallback(() => {
        if (glowRef.current && outlineTextRef.current) {
            const rect = outlineTextRef.current.getBoundingClientRect();
            
            let x, y;
            if (hasPointer) {
                x = mousePosRef.current.x - rect.left;
                y = mousePosRef.current.y - rect.top;
            } else {
                // Automatic animated glow for non-pointer devices
                autoGlowPos.current.time += 0.02;
                const t = autoGlowPos.current.time;
                
                // Circular motion around the text
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const radius = Math.min(rect.width, rect.height) * 0.6;
                
                x = centerX + Math.cos(t) * radius;
                y = centerY + Math.sin(t * 1.2) * radius * 0.7;
            }
            
            glowRef.current.style.maskImage = `radial-gradient(circle 200px at ${x}px ${y}px, black 0%, transparent 100%)`;
            glowRef.current.style.webkitMaskImage = `radial-gradient(circle 200px at ${x}px ${y}px, black 0%, transparent 100%)`;
        }
        rafIdRef.current = requestAnimationFrame(updateGlow);
    }, [hasPointer]);

    useEffect(() => {
        rafIdRef.current = requestAnimationFrame(updateGlow);
        return () => {
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        };
    }, [updateGlow]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
        mousePosRef.current = { x: e.clientX, y: e.clientY };
    }, []);

    // GSAP scroll-triggered intro animations — matching hero's cinematic style
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

            // Step 1: Top-left label — blur → sharp focus (matches hero header anim)
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

            // Step 2: "atmosphere" outline text — scale + blur reveal (matches hero title anim)
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

            // Step 3: Main paragraph — line-by-line blur → focus (matches hero subtext stagger)
            tl.fromTo(
                ".atm-line",
                { opacity: 0, filter: "blur(10px)", y: 30 },
                {
                    opacity: 1,
                    filter: "blur(0px)",
                    y: 0,
                    duration: 1,
                    stagger: 0.15,
                    ease: "power2.out",
                },
                "-=0.6",
            );
        },
        { scope: containerRef },
    );

    return (
        <section
            ref={containerRef}
            className="relative w-full h-screen bg-black text-white overflow-hidden"
            onMouseMove={handleMouseMove}
            style={{ cursor: "default" }}
        >
            {/* ── Top-Left Label ── */}
            <div
                className="atm-label absolute top-8 left-8 md:top-12 md:left-12 z-10 font-kh-teka font-normal text-[11px] md:text-xs uppercase tracking-[0.25em] text-neutral-500"
                style={{ willChange: "filter, opacity, transform" }}
            >
                [01 / the philosophy]
            </div>

            {/* ── "atmosphere" Outline Text — right-aligned, above main text ── */}
            <div
                ref={outlineTextRef}
                className="atm-outline absolute z-[1] pointer-events-none select-none font-editorial italic"
                style={{
                    right: "clamp(1rem, 3vw, 5rem)",
                    bottom: "clamp(14rem, 35vh, 28rem)",
                    lineHeight: "1.1",
                    paddingBottom: "0.15em",
                    willChange: "filter, opacity, transform",
                }}
            >
                {/* Base outline — visible at rest */}
                <div
                    className="text-[clamp(3rem,8vw,18rem)] md:text-[clamp(6rem,16vw,18rem)] text-transparent"
                    style={{
                        WebkitTextStroke: "1px rgba(255,255,255,0.35)",
                    }}
                >
                    &ldquo;atmosphere
                </div>

                {/* Glow layer — cursor-masked */}
                <div
                    ref={glowRef}
                    className="absolute inset-0 text-[clamp(3rem,8vw,18rem)] md:text-[clamp(6rem,16vw,18rem)] text-transparent"
                    style={{
                        lineHeight: "1.1",
                        WebkitTextStroke: "1.5px rgba(255,255,255,1)",
                        textShadow:
                            "0 0 30px rgba(255,255,255,0.5), 0 0 60px rgba(255,255,255,0.2), 0 0 100px rgba(255,255,255,0.08)",
                        maskImage:
                            "radial-gradient(circle 200px at -1000px -1000px, black 0%, transparent 100%)",
                        WebkitMaskImage:
                            "radial-gradient(circle 200px at -1000px -1000px, black 0%, transparent 100%)",
                    }}
                >
                    &ldquo;atmosphere
                </div>
            </div>

            {/* ── Bottom-Left Paragraph ── */}
            <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 z-10 font-kh-teka font-medium text-base sm:text-lg md:text-xl lg:text-[1.85rem] max-w-[90vw] md:max-w-3xl leading-[1.2]">
                <div className="overflow-hidden">
                    <div
                        className="atm-line"
                        style={{ willChange: "filter, opacity, transform" }}
                    >
                        I see the web as more than screens & layouts.
                    </div>
                </div>
                <div className="overflow-hidden">
                    <div
                        className="atm-line"
                        style={{ willChange: "filter, opacity, transform" }}
                    >
                        It&apos;s atmosphere. Emotion. Perception.
                    </div>
                </div>
                <div className="overflow-hidden ">
                    <div
                        className="atm-line"
                        style={{ willChange: "filter, opacity, transform" }}
                    >
                        Every project is an opportunity to turn
                    </div>
                </div>
                <div className="overflow-hidden">
                    <div
                        className="atm-line"
                        style={{ willChange: "filter, opacity, transform" }}
                    >
                        an idea into something people can feel.
                    </div>
                </div>
            </div>
        </section>
    );
}
