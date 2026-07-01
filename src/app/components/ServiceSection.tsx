"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const services = [
  {
    id: "dev",
    prefix: "Website ",
    emphasis: "development",
    suffix: "",
    testimonial: '"Every detail was thoughtfully executed." — Mostafa Mohamed, Founder at MOKOI',
  },
  {
    id: "design",
    prefix: "Website ",
    emphasis: "design",
    suffix: "",
    testimonial: '"His talent and professionalism truly stand out." — Ahmed Akram, Cofounder at WOKE',
  },
  {
    id: "ecom",
    prefix: "E-commerce & ",
    emphasis: "Shopify",
    suffix: "",
    testimonial: '"He easily understands your vision and makes it even better." — Ibrahim Akram, Founder at SALTY.',
  },
  {
    id: "analytics",
    prefix: "",
    emphasis: "Analytics",
    suffix: " & Performance",
    testimonial: '"He managed to solve our store issues quickly and professionally." — Mohamed, Co-Founder at DSTRCT',
  },
  {
    id: "3d",
    prefix: "3D Visuals & ",
    emphasis: "Interaction",
    suffix: "",
    testimonial: '"Working with him was one of the best decisions for my brand." — Ahmed Akram, Cofounder at WOKE',
  },
] as const;

export default function ServicesSection() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // ── 1. Olive background: Modern Sectioned "Blinds" Reveal ───────────────
      gsap.fromTo(
        ".srv-bg-panel",
        { clipPath: "inset(100% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          ease: "power2.inOut",
          stagger: 0.08,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 90%",
            end: "top 20%",
            scrub: 1.2,
          },
        }
      );

      // ── 2. Section label entrance ───────────────────────────────────────────
      gsap.fromTo(
        ".srv-label",
        { opacity: 0, y: 14, filter: "blur(8px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 50%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // ── 3. List Items Entrance & Mobile Scroll Trigger ──────────────────────
      const items = gsap.utils.toArray<HTMLElement>(".service-item");
      
      items.forEach((item, index) => {
        gsap.fromTo(
          item,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: index * 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: item,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );

        ScrollTrigger.create({
          trigger: item,
          start: "top 55%",
          end: "bottom 45%",
          toggleClass: "is-active",
        });
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      id="services"
      className="relative w-full overflow-hidden text-[#e8ddd0]"
    >
      {/* ── Olive background ────────────────────────────────────────────────── */}
      <div className="absolute inset-0 flex pointer-events-none" aria-hidden>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="srv-bg-panel flex-1 h-full bg-[#243323] scale-x-[1.02]"
            style={{ clipPath: "inset(100% 0% 0% 0%)" }}
          />
        ))}
      </div>

      {/* Noise overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.35] z-0"
        style={{
          backgroundImage: "url('/noise.png')",
          backgroundRepeat: "repeat",
          backgroundSize: "120px",
        }}
      />


      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="relative z-10 px-8 md:px-12 pt-10 pb-20 md:pt-14 md:pb-28 w-full text-left">
        
        <p className="srv-label mb-16 md:mb-24 text-[11px] md:text-xs uppercase tracking-[0.25em] text-[#e8ddd0]/50 font-kh-teka opacity-0">
          [03 / the services]
        </p>

        {/* ── Service list ────────────────────────────────────────────────── */}
        <div className="flex flex-col w-full">
          {services.map((svc) => (
            <div 
              key={svc.id} 
              className="service-item group relative border-t border-[#e8ddd0]/[0.13] py-8 md:py-12 cursor-pointer opacity-0"
            >
              <h3 className="text-[clamp(1.8rem,4.5vw,4.5rem)] leading-[1.05] tracking-tight flex flex-wrap items-baseline justify-start gap-x-3 md:gap-x-4">
                
                {/* Prefix (Static Sans) */}
                {svc.prefix && (
                  <span className="font-kh-teka font-medium">{svc.prefix}</span>
                )}

                {/* Emphasis Word (Rolling Text Container) */}
                {/* Added 'isolate' to ensure mobile browsers enforce the mask perfectly */}
                <span className="relative inline-grid grid-cols-1 grid-rows-1 justify-items-start overflow-hidden align-bottom pb-1 isolate">
                  
                  {/* Default Sans */}
                  {/* Increased translation to -translate-y-[140%] to clear text boundaries completely */}
                  <span className="col-start-1 row-start-1 font-kh-teka font-medium [transform:translateZ(0)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-[140%] group-[.is-active]:-translate-y-[140%]">
                    {svc.emphasis}
                  </span>
                  
                  {/* Active Serif */}
                  {/* Started at translate-y-[140%] to hide the deep italic descenders perfectly */}
                  <span className="col-start-1 row-start-1 translate-y-[140%] font-editorial italic text-[#e8ddd0] [transform:translateZ(0)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-[.is-active]:translate-y-0">
                    {svc.emphasis}
                  </span>
                  
                </span>

                {/* Suffix (Static Sans) */}
                {svc.suffix && (
                  <span className="font-kh-teka font-medium">{svc.suffix}</span>
                )}
                
              </h3>

              {/* ── Testimonial Reveal ────────────────────────────────────────── */}
              <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:grid-rows-[1fr] group-[.is-active]:grid-rows-[1fr]">
                <div className="overflow-hidden">
                  <p className="pt-4 md:pt-6 font-editorial italic text-[#e8ddd0]/50 text-sm md:text-lg max-w-md text-left">
                    {svc.testimonial}
                  </p>
                </div>
              </div>

            </div>
          ))}

          {/* Closing rule */}
          <div className="h-px w-full bg-[#e8ddd0]/[0.13]" aria-hidden />
        </div>
      </div>
    </section>
  );
}