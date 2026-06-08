"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  const [time, setTime] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6 md:p-8 pointer-events-none">
      {/* Logo on the left */}
      <div className="pointer-events-auto flex items-center">
        <Link href="/" className="block opacity-90 hover:opacity-100 transition-opacity duration-200">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={25}
            height={28}
            priority
          />
        </Link>
      </div>

      {/* Time in Egypt on the right */}
      <div className="pointer-events-auto flex items-center">
        <span 
          className="text-white font-kh-teka text-base tracking-wider select-none"
          aria-live="polite"
        >
          {mounted ? time : "00:00:00"}
        </span>
      </div>
    </header>
  );
}
