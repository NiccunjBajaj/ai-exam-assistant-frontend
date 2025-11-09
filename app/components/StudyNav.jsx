import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { HomeIcon, LibraryBig } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/study/notes", label: "Notes", data: "notes" },
  { href: "/study/flashcards", label: "Flashcards", data: "flashcards" },
  { href: "/study/quiz", label: "Quiz", data: "quiz" },
];

const StudyNav = () => {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useGSAP(() => {
    if (isMobile) return;
    gsap.to(".link", {
      scale: 1,
      stagger: 0.1,
      duration: 0.4,
    });
  }, [isMobile]);
  return (
    <>
      {isMobile ? (
        <div className="fixed bottom-4 left-4 z-50">
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex flex-col gap-3 mb-3"
              >
                <Link
                  href="/study"
                  className="bg-[#ffe655] text-[#00141b] rounded-full py-2 px-4 flex items-center gap-2"
                >
                  <LibraryBig size={20} />
                  <span>Study</span>
                </Link>
                {navLinks.map((link, i) => (
                  <Link
                    key={i}
                    href={link.href}
                    className={`${
                      pathname === link.href
                        ? "bg-[#0B1E26] text-[#e2e8f0]"
                        : "bg-[#ffe655] text-[#00141b]"
                    } rounded-full py-2 px-4`}
                  >
                    {link.label}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="bg-[#ffe655] text-[#00141b] rounded-full p-4"
          >
            <LibraryBig size={24} />
          </button>
        </div>
      ) : (
        <div className="flex gap-[1vw] absolute top-[1.35vw] left-[2vw] items-center">
          <div className="bg-[#ffe655] scale-0 hover:bg-[#F1E596] text-[#00141b] rounded-full py-[0.4vw] transition-all duration-[0.2s] px-[0.6vw] link">
            <Link
              className="text-[1.4vw] flex items-center gap-[0.3vw]"
              href="/study"
            >
              Study <LibraryBig />
            </Link>
          </div>
          {navLinks.map((link, i) => (
            <div
              className={`${
                pathname === link.href
                  ? "bg-[#0B1E26] text-[#e2e8f0] pointer-events-none"
                  : "bg-[#ffe655]"
              } scale-0 hover:bg-[#0B1E26] hover:text-[#e2e8f0] text-[#00141b] rounded-full py-[0.4vw] transition-all duration-[0.2s] px-[0.6vw] link`}
            >
              <Link key={i} className="text-[1.2vw]" href={link.href}>
                {link.label} &#8599;
              </Link>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default StudyNav;
