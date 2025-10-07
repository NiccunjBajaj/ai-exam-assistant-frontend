"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const MouseFollower = () => {
  const mouse = useRef({ x: 0, y: 0 });
  const [label, setLabel] = useState("");

  useEffect(() => {
    const cursor = document.querySelector(".circ");

    if (!cursor) return;

    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const animateCursor = () => {
      cursor.style.left = mouse.current.x - 12 + "px";
      cursor.style.top = mouse.current.y - 12 + "px";
      requestAnimationFrame(animateCursor);
    };

    animateCursor();
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useGSAP(() => {
    const cursor = document.querySelector(".circ");
    const hoverTargets = document.querySelectorAll(".hover_target");

    if (!cursor) return;

    const handleEnter = (scale) => {
      gsap.to(cursor, {
        scale: scale,
        backgroundColor: "#fff",
        mixBlendMode: "difference",
        duration: 0.7,
        ease: "expo",
      });
    };

    const handleLeave = () => {
      gsap.to(cursor, {
        scale: 1,
        backgroundColor: "#5C899D",
        mixBlendMode: "normal",
        duration: 0.7,
        ease: "expo",
      });
    };

    hoverTargets.forEach((el) => {
      el.addEventListener("mouseenter", () =>
        handleEnter(parseFloat(el.dataset.cursorScale || "1.3"))
      );
      el.addEventListener("mouseleave", handleLeave);
    });

    return () => {
      hoverTargets.forEach((el) => {
        el.removeEventListener("mouseenter", handleEnter);
        el.removeEventListener("mouseleave", handleLeave);
      });
    };
  }, []);

  useGSAP(() => {
    const cursor = document.querySelector(".circ");
    const hoverClicks = document.querySelectorAll(".hover_click");

    if (!cursor) return;

    const handleEnter = (e) => {
      const target = e.currentTarget;
      const label = target.dataset.cursorLabel || "Click";
      setLabel(label);

      gsap.to(cursor, {
        scale: 5,
        backgroundColor: "#fff",
        mixBlendMode: "difference",
        duration: 0.5,
        ease: "expo.out",
      });
    };

    const handleLeave = () => {
      setLabel("");
      gsap.to(cursor, {
        scale: 1,
        backgroundColor: "#5C899D",
        mixBlendMode: "normal",
        duration: 0.5,
        ease: "expo.out",
      });
    };

    hoverClicks.forEach((el) => {
      el.addEventListener("mouseenter", handleEnter);
      el.addEventListener("mouseleave", handleLeave);
    });

    return () => {
      hoverClicks.forEach((el) => {
        el.removeEventListener("mouseenter", handleEnter);
        el.removeEventListener("mouseleave", handleLeave);
      });
    };
  }, []);

  return (
    <div className="pointer-events-none z-[9999] circ w-[24px] h-[24px] bg-[#5C899D] rounded-full fixed top-0 left-0">
      {label && (
        <a
          href={`/${label}`}
          className="text-black text-[5px] absolute top-1 mt-1 left-1/2 -translate-x-1/2 cursor-pointer"
        >
          {label}
        </a>
      )}
    </div>
  );
};

export default MouseFollower;
