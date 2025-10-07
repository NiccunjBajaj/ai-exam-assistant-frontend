"use client";

import { useEffect } from "react";
import ReactLenis from "lenis/react";
import Hero from "./components/Hero";
import AOS from "aos";
import "aos/dist/aos.css";

export default function Home() {
  useEffect(() => {
    AOS.init({
      duration: 1500,
      once: true,
    });
  }, []);

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      <main>
        <Hero />
      </main>
    </ReactLenis>
  );
}
