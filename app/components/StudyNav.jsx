import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { HomeIcon, LibraryBig } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const navLinks = [
  { href: "/study/notes", label: "Notes", data: "notes" },
  { href: "/study/flashcards", label: "Flashcards", data: "flashcards" },
  { href: "/study/quiz", label: "Quiz", data: "quiz" },
];

const StudyNav = () => {
  const pathname = usePathname();

  useGSAP(() => {
    gsap.to(".link", {
      scale: 1,
      stagger: 0.1,
      duration: 0.4,
    });
  });
  return (
    <div className="flex gap-[1vw] absolute top-[1vw] left-[2vw] items-center">
      <div className="bg-[#ffe343ec] scale-0 hover:bg-[#606060] text-[#161616] rounded-full py-[0.4vw] transition-all duration-[0.2s] px-[0.6vw] link">
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
              ? "bg-[#606060] pointer-events-none"
              : "bg-[#ffe343ec]"
          } scale-0 hover:bg-[#606060] text-[#161616] rounded-full py-[0.4vw] transition-all duration-[0.2s] px-[0.6vw] link`}
        >
          <Link key={i} className="text-[1.2vw]" href={link.href}>
            {link.label} &#8599;
          </Link>
        </div>
      ))}
    </div>
  );
};

export default StudyNav;
