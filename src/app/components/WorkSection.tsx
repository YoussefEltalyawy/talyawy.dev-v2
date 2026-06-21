"use client";

import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import SplitType from "split-type";
import Image from "next/image";
import { projects, type Project } from "@/app/data/projects";
import { useDeviceTier } from "@/app/hooks/useDeviceTier";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

/**
 * "the work" section
 * --------------------
 * • Edge-to-edge showcase media (video → image fallback) for the active project.
 * • Project list (top-left) — click once to preview, click again to open.
 * • Description (bottom-right) with animated text swap on project change.
 * • Entire section uses the KH Teka typeface.
 */
export default function WorkSection() {
    const containerRef = useRef<HTMLElement>(null);
    const descriptionRef = useRef<HTMLDivElement>(null);
    const descriptionInnerRef = useRef<HTMLParagraphElement>(null);

    // Active = the project currently being previewed. It's underlined in the
    // list, its description is shown, and its showcase media fills the section.
    const [activeId, setActiveId] = useState<string>(projects[0].id);

    // Per-project readiness for the showcase video. We keep every project's
    // <video> mounted in the DOM (see the JSX below) so the browser can cache
    // the data; tracking readiness per project means a previously-watched
    // video shows instantly on re-select, while the fallback image only
    // appears for projects whose video truly isn't ready / has failed.
    const [videoReady, setVideoReady] = useState<Record<string, boolean>>({});
    const [videoFailed, setVideoFailed] = useState<Record<string, boolean>>({});
    const [isMobile, setIsMobile] = useState(false);

    const tier = useDeviceTier();

    const activeProject = useMemo<Project>(
        () => projects.find((p) => p.id === activeId) ?? projects[0],
        [activeId],
    );

    const activeReady = videoReady[activeId] === true;
    const activeFailed = videoFailed[activeId] === true;

    // ── Responsive detection ─────────────────────────────────────────────────
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const fallbackSrc = isMobile
        ? activeProject.mobileFallback
        : activeProject.desktopFallback;
    const videoSrc = isMobile
        ? activeProject.mobileShowcase
        : activeProject.desktopShowcase;

    // Find the <video> for the active project and (re)play it. Because every
    // project's <video> is mounted at all times, this is just a DOM lookup
    // — no remount, no reload — so re-selecting a previously-watched project
    // is instant.
    useEffect(() => {
        if (!containerRef.current) return;
        const v = containerRef.current.querySelector<HTMLVideoElement>(
            `video[data-video-id="${activeId}"]`,
        );
        if (!v) return;
        // Always rewind so a quick swap doesn't keep playing the old frame
        try {
            v.currentTime = 0;
        } catch {
            /* some browsers throw if the video isn't loaded yet — safe to ignore */
        }
        const playPromise = v.play();
        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
                /* autoplay was blocked or interrupted — leave the poster visible */
            });
        }
    }, [activeId, isMobile]);

    // ── Intro animation (label → project list → description) ───────────────
    useGSAP(
        () => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 70%",
                    toggleActions: "play none none reverse",
                },
            });

            tl.fromTo(
                ".work-label",
                { opacity: 0, filter: "blur(8px)", y: 12 },
                {
                    opacity: 1,
                    filter: "blur(0px)",
                    y: 0,
                    duration: 0.9,
                    ease: "power2.out",
                },
            );

            tl.fromTo(
                ".work-project",
                { opacity: 0, filter: "blur(8px)", y: 18 },
                {
                    opacity: 1,
                    filter: "blur(0px)",
                    y: 0,
                    duration: 0.7,
                    ease: "power2.out",
                    stagger: 0.12,
                },
                "-=0.4",
            );

            // The description is animated line-by-line in its own effect so
            // the same SplitType-driven reveal handles both the intro and
            // every subsequent project switch.

            // Showcase media softly fades in as the final reveal
            tl.fromTo(
                ".work-media",
                { opacity: 0, scale: 1.04, filter: "blur(14px)" },
                {
                    opacity: 1,
                    scale: 1,
                    filter: "blur(0px)",
                    duration: 1.4,
                    ease: "power2.out",
                },
                "-=1.1",
            );
        },
        { scope: containerRef },
    );

    // ── Description text swap animation ────────────────────────────────────
    // Re-splits the paragraph into lines and reveals them in the same style
    // as the atmosphere section: opacity + blur + slight Y rise, staggered.
    const descSplitRef = useRef<SplitType | null>(null);
    useLayoutEffect(() => {
        const inner = descriptionInnerRef.current;
        if (!inner) return;

        // Revert any previous split so the new text starts from a clean DOM.
        if (descSplitRef.current) {
            descSplitRef.current.revert();
            descSplitRef.current = null;
        }

        const split = new SplitType(inner, { types: "lines" });
        descSplitRef.current = split;

        const lines = split.lines && split.lines.length > 0
            ? split.lines
            : [inner];

        // Stagger is intentionally larger than the atmosphere paragraph so
        // each line clearly lands before the next one starts — the cascade
        // is the whole point of the reveal.
        gsap.fromTo(
            lines,
            { opacity: 0, filter: "blur(10px)", y: 16 },
            {
                opacity: 1,
                filter: "blur(0px)",
                y: 0,
                duration: 0.7,
                ease: "power2.out",
                stagger: 0.22,
            },
        );

        return () => {
            if (descSplitRef.current) {
                descSplitRef.current.revert();
                descSplitRef.current = null;
            }
        };
    }, [activeId]);

    // ── Outline animation on selection change ─────────────────────────────
    // When the active project changes, the newly selected label briefly
    // reveals an outline (text-stroke) and a soft glow, then settles back
    // to the resting state. Implemented as a GSAP timeline so it can be
    // expanded later (e.g. a sweep) without re-wiring the trigger.
    const isFirstSelection = useRef(true);
    useEffect(() => {
        if (!containerRef.current) return;
        const el = containerRef.current.querySelector<HTMLElement>(
            `[data-project-id="${activeId}"]`,
        );
        if (!el) return;
        // First mount: the outline is already on the resting state — skip.
        if (isFirstSelection.current) {
            isFirstSelection.current = false;
            return;
        }
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
            // Animate the outline thickness from a peak down to its resting value
            // while pulsing a soft glow, so the eye is pulled to the new pick.
            tl.fromTo(
                el,
                {
                    "--stroke": "0.6px",
                    "--glow": "14px",
                    textShadow: "0 0 14px rgba(255,255,255,0.55)",
                    WebkitTextStroke: "1.4px rgba(255,255,255,0.95)",
                },
                {
                    "--stroke": "0.6px",
                    "--glow": "0px",
                    duration: 0.85,
                    textShadow: "0 0 0px rgba(255,255,255,0)",
                    WebkitTextStroke: "0.6px rgba(255,255,255,0.55)",
                },
            );
        }, containerRef);
        return () => ctx.revert();
    }, [activeId]);

    // ── Interaction: click once to preview, click again to open ────────────
    const handleProjectClick = useCallback(
        (project: Project) => {
            if (activeId === project.id) {
                // Second click on the already-active project → open URL
                window.open(project.url, "_blank", "noopener,noreferrer");
                return;
            }
            setActiveId(project.id);
        },
        [activeId],
    );

    // Reduced motion + weak devices: keep the showcase media static.
    const isLowTier = tier === "low";
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mq.matches);
        const handler = (e: MediaQueryListEvent) =>
            setPrefersReducedMotion(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    return (
        <section
            ref={containerRef}
            id="work"
            className="relative w-full h-screen min-h-[640px] bg-black text-white overflow-hidden font-kh-teka"
        >
            {/* ── Showcase media (edge-to-edge, centered, object-cover) ── */}
            <div
                className="work-media absolute inset-0 z-0"
                style={{ willChange: "filter, opacity, transform" }}
            >
                {/* Fallback image for the active project. Only the active
                    project's image is in the DOM at a time; it shows while
                    that project's video is still loading / has failed, and
                    fades out as soon as the video is ready. */}
                <Image
                    src={fallbackSrc}
                    alt={`${activeProject.name} showcase`}
                    fill
                    priority={activeId === projects[0].id}
                    sizes="100vw"
                    className="object-cover"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                        opacity: !activeReady || activeFailed ? 1 : 0,
                        transition: "opacity 600ms ease-out",
                    }}
                />

                {/* All showcase videos stay mounted so the browser can cache
                    the data. Switching projects is just a CSS opacity flip;
                    if a video was already playing, it shows immediately. */}
                {!isLowTier &&
                    !prefersReducedMotion &&
                    projects.map((project) => {
                        const isActive = project.id === activeId;
                        const projectReady = videoReady[project.id] === true;
                        const projectFailed = videoFailed[project.id] === true;
                        return (
                            <video
                                key={project.id}
                                data-video-id={project.id}
                                src={
                                    isMobile
                                        ? project.mobileShowcase
                                        : project.desktopShowcase
                                }
                                poster={
                                    isMobile
                                        ? project.mobileFallback
                                        : project.desktopFallback
                                }
                                preload={isActive ? "auto" : "metadata"}
                                muted
                                loop
                                playsInline
                                autoPlay={isActive}
                                onLoadedData={() =>
                                    setVideoReady((prev) => ({
                                        ...prev,
                                        [project.id]: true,
                                    }))
                                }
                                onError={() =>
                                    setVideoFailed((prev) => ({
                                        ...prev,
                                        [project.id]: true,
                                    }))
                                }
                                className="absolute inset-0"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    objectPosition: "center",
                                    opacity:
                                        isActive && projectReady && !projectFailed
                                            ? 1
                                            : 0,
                                    transition: "opacity 600ms ease-out",
                                    pointerEvents: "none",
                                }}
                            />
                        );
                    })}

                {/* Full black wash over the showcase — keeps the type legible
                    no matter how busy the media is, plus a softer top/bottom
                    fade so the edge text still has somewhere to breathe. */}
                <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 30%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.65) 100%)",
                    }}
                />
                <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none bg-black/45"
                />
            </div>

            {/* ── Section label (top-left) ──────────────────────────────── */}
            <div
                className="work-label absolute top-8 left-8 md:top-12 md:left-12 z-20 text-[11px] md:text-xs uppercase tracking-[0.25em] text-neutral-300"
                style={{ willChange: "filter, opacity, transform" }}
            >
                [02 / the work]
            </div>

            {/* ── Project list (top-left, below label) ──────────────────── */}
            <nav
                aria-label="Selected work"
                className="work-projects absolute top-[4.5rem] md:top-[5.25rem] left-8 md:left-12 z-20 flex flex-col gap-1"
            >
                {projects.map((project) => {
                    const isSelected = project.id === activeId;
                    return (
                        <button
                            key={project.id}
                            type="button"
                            data-project-id={project.id}
                            onClick={() => handleProjectClick(project)}
                            className="work-project text-left text-lg sm:text-xl md:text-2xl lg:text-2xl leading-[1.1] tracking-tight font-kh-teka font-medium text-white transition-[opacity,filter,transform,color] duration-300 hover:opacity-100"
                            style={{
                                opacity: isSelected ? 1 : 0.55,
                                textDecorationLine: isSelected ? "underline" : "none",
                                textUnderlineOffset: "0.22em",
                                textDecorationThickness: "1px",
                                WebkitTextStroke: isSelected
                                    ? "0.6px rgba(255,255,255,0.55)"
                                    : "0px transparent",
                                willChange: "filter, opacity, transform",
                            }}
                            aria-current={isSelected ? "true" : undefined}
                        >
                            {project.name}
                        </button>
                    );
                })}
            </nav>

            {/* ── Description (bottom-right) ────────────────────────────── */}
            <div
                ref={descriptionRef}
                className="work-description absolute bottom-8 right-8 md:bottom-12 md:right-12 z-20 max-w-[92vw] md:max-w-md text-right overflow-hidden"
                style={{ willChange: "filter, opacity, transform" }}
            >
                <p
                    key={activeId}
                    ref={descriptionInnerRef}
                    className="work-description-inner text-[15px] md:text-[17px] leading-[1.5] text-white/90 font-kh-teka font-normal"
                >
                    {activeProject.description}
                </p>
            </div>
        </section>
    );
}
