"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import React, { useRef } from "react";

gsap.registerPlugin(ScrollTrigger, SplitText);

const AnimatedCopy = ({
  children,
  colorinitial = "#535353",
  colorAcent = "#ffe243",
  colorFinal = "#dddddd",
}) => {
  const containerRef = useRef(null);
  const splitRefs = useRef([]);
  const lastScrollProgress = useRef(0);
  const colorTransitionTimers = useRef(new Map());
  const completeChars = useRef(new Set());

  useGSAP(
    () => {
      if (!containerRef.current) return;

      splitRefs.current = [];
      lastScrollProgress.current = 0;
      colorTransitionTimers.current.clear();
      completeChars.current.clear();

      let elements = [];
      if (containerRef.current.hasAttribute("data-copy-wrapper")) {
        elements = Array.from(containerRef.current.children);
      } else {
        elements = [containerRef.current];
      }

      elements.forEach((el) => {
        const wordSplit = SplitText.create(el, {
          type: "words",
          wordsClass: "word",
        });

        const charSplit = SplitText.create(wordSplit.words, {
          type: "chars",
          charsClass: "char",
        });

        splitRefs.current.push({ wordSplit, charSplit });
      });

      const allChars = splitRefs.current.flatMap(
        ({ charSplit }) => charSplit.chars
      );

      gsap.set(allChars, { color: colorinitial });

      const scheduleFinalTransition = (char, index) => {
        if (colorTransitionTimers.current.has(index)) {
          clearTimeout(colorTransitionTimers.current.get(index));
        }

        const timer = setTimeout(() => {
          if (!completeChars.current.has(index)) {
            gsap.to(char, {
              duration: 0.1,
              ease: "none",
              color: colorFinal,
              onComplete: () => {
                completeChars.current.add(index);
              },
            });
          }
          colorTransitionTimers.current.delete(index);
        }, 100);
        colorTransitionTimers.current.set(index, timer);
      };

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 90%",
        end: "top 10%",
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          const totalChars = allChars.length;
          const isScrollingDown = progress >= lastScrollProgress.current;
          const currentCharIndex = Math.floor(progress * totalChars);

          allChars.forEach((char, i) => {
            if (!isScrollingDown && i >= currentCharIndex) {
              if (colorTransitionTimers.current.has(i)) {
                clearTimeout(colorTransitionTimers.current.get(i));
                colorTransitionTimers.current.delete(i);
              }
              completeChars.current.delete(i);
              gsap.set(char, { color: colorinitial });
              return;
            }

            if (completeChars.current.has(i)) {
              return;
            }

            if (i <= currentCharIndex) {
              gsap.set(char, { color: colorAcent });
              if (!colorTransitionTimers.current.has(i)) {
                scheduleFinalTransition(char, i);
              }
            } else {
              gsap.set(char, { color: colorinitial });
            }
          });

          lastScrollProgress.current = progress;
        },
      });

      return () => {
        colorTransitionTimers.current.forEach((timer) => clearTimeout(timer));
        colorTransitionTimers.current.clear();
        completeChars.current.clear();

        splitRefs.current.forEach(({ wordSplit, charSplit }) => {
          if (charSplit) charSplit.revert();
          if (wordSplit) wordSplit.revert();
        });
      };
    },
    {
      scope: containerRef,
      dependencies: [colorinitial, colorAcent, colorFinal],
    }
  );

  if (React.Children.count(children) === 1) {
    return React.cloneElement(children, { ref: containerRef });
  }

  return (
    <div ref={containerRef} data-copy-wrapper="true">
      {children}
    </div>
  );
};

export default AnimatedCopy;
