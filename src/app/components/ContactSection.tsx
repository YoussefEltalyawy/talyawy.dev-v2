"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import DitherHandCanvas from "./contact/DitherHandCanvas";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ContactSection() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Single, decisive reveal — label and copy settle in together rather
      // than a multi-stage sequence.
      gsap.fromTo(
        [".contact-label", ".contact-copy"],
        { opacity: 0, y: 24, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      id="contact"
      className="relative w-full min-h-screen overflow-hidden bg-[#111B11] text-[#e8ddd0]"
    >
      {/* Dithered reaching-hands visual */}
      <DitherHandCanvas className="absolute bottom-0 right-0 w-full h-[45%] md:inset-y-0 md:h-full md:w-[55%]" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col px-8 md:px-12 py-10 md:py-14">
        <p className="contact-label font-kh-teka font-normal text-[11px] md:text-xs uppercase tracking-[0.25em] text-[#e8ddd0]/50 opacity-0">
          [04 / the contact]
        </p>

        <div className="flex flex-1 items-center">
          <div className="contact-copy max-w-xl opacity-0">
            <h2 className="font-editorial text-[clamp(2.4rem,6vw,5.5rem)] leading-[1.05] tracking-tight mb-10 md:mb-14">
              Got an idea?
              <br />
              Let&apos;s build it together.
            </h2>

            <div className="flex flex-col items-start gap-3 font-kh-teka text-base md:text-lg">
              <a
                href="mailto:talyawy@proton.me"
                className="w-fit underline underline-offset-4 decoration-[#e8ddd0]/40 transition-colors hover:decoration-[#e8ddd0]"
              >
                talyawy@proton.me
              </a>
              <a
                href="tel:+201149173309"
                className="w-fit text-[#e8ddd0]/70 transition-colors hover:text-[#e8ddd0]"
              >
                01149173309
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Noise overlay, matching the rest of the site (now overlays the canvas and content) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.06] z-20"
        style={{
          backgroundImage: "url('/noise.png')",
          backgroundRepeat: "repeat",
          backgroundSize: "120px",
        }}
      />
    </section>
  );
}
