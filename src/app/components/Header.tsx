"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { detectLowTierDevice } from "@/app/lib/deviceTier";

export default function Header() {
  const [time, setTime] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [isLowTier, setIsLowTier] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    setIsLowTier(detectLowTierDevice());
    const updateTime = () => {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Africa/Cairo",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      setTime(formatter.format(new Date()));
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <header 
      className="anim-header opacity-0 fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6 md:p-8 pointer-events-none"
      style={{ filter: "blur(10px)" }}
    >
      {/* Logo on the left */}
      <div className="pointer-events-auto flex items-center overflow-hidden py-1">
        <Link href="/" className="anim-header-item block opacity-90 hover:opacity-100 transition-opacity duration-200">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={25}
            height={28}
            priority
          />
        </Link>
      </div>

      {/* Device Tier Indicator in the center */}
      <div className="pointer-events-auto flex items-center justify-center overflow-hidden py-1">
        <span 
          className="anim-header-item block text-white/50 text-[10px] md:text-xs font-mono tracking-widest select-none uppercase bg-black/20 px-3 py-1 rounded-full border border-white/10"
        >
          {mounted ? (isLowTier ? "Device: Weak (Image)" : "Device: Capable (Shader)") : "..."}
        </span>
      </div>

      {/* Time in Egypt on the right */}
      <div className="pointer-events-auto flex items-center overflow-hidden py-1">
        <span 
          className="anim-header-item block text-white font-kh-teka text-base tracking-wider select-none"
          aria-live="polite"
        >
          {mounted ? time : "00:00:00"}
        </span>
      </div>
    </header>
  );
}
