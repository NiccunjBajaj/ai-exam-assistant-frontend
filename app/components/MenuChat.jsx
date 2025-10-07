"use client";
import { useGSAP } from "@gsap/react";
import React, { useEffect, useRef, useState } from "react";
import "../styles/menu.css";
import gsap from "gsap";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";

const navLinks = [
  { href: "/", label: "HOME", data: "home" },
  { href: "/chat", label: "ASTRA", data: "astra" },
  { href: "/study", label: "STUDY", data: "study" },
  { href: "/price", label: "PRICING", data: "pricing" },
  { href: "/", label: "CONTACT", data: "contact" },
];

const navLinksShort = [
  { href: "#", label: "INSTAGRAM" },
  { href: "#", label: "YOUTUBE" },
  { href: "#", label: "TWITTER" },
];

const MenuChat = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [plan, setPlan] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const getLinkData = () => {
    if (pathname === "/") return { href: "/", text: "EXAMEASE" };
    if (pathname.startsWith("/study")) return { href: "/study", text: "STUDY" };
    if (pathname.startsWith("/contact"))
      return { href: "/contact", text: "CONTACT" };
    if (pathname === "/chat") return { href: "/chat", text: "ASTRA" };
    return { href: "/", text: "EXAMEASE" };
  };

  const { href, text } = getLinkData();

  const menuRef = useRef(null);
  const tl = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useGSAP(
    () => {
      gsap.set(".menu-link-item-holder", { y: 75 });
      if (!menuRef.current) return;
      tl.current = gsap
        .timeline({ paused: true })
        .to(".menu-overlay", {
          duration: 1.25,
          clipPath: "polygon(0 0 , 100% 0, 100% 100%, 0 100%)",
          ease: "power4.inOut",
        })
        .to(".menu-link-item-holder", {
          y: 0,
          duration: 1,
          stagger: 0.1,
          ease: "power4.inOut",
          delay: -0.75,
        });
    },
    { scope: menuRef }
  );

  useEffect(() => {
    isMenuOpen ? tl.current?.play() : tl.current?.reverse();
  }, [isMenuOpen]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setIsLoggedIn(false);
    router.push("/");
  };

  const fetchPlan = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetch("http://localhost:8000/plan/me", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setPlan(data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  return (
    <div className="menu-container select z-[99999]" ref={menuRef}>
      <div className="menu-bar px-[4vw] py-5 text-2xl fixed top-0 left-0 w-full z-[1] flex justify-between font-[400] noto border-b-2 border-[#384672a0]">
        <div
          className="menu-logo hover_target flex items-center gap-3"
          data-cursor-scale="2"
        >
          <User className="w-6 h-6 cursor-pointer" />
          <Link href={href}>{text}</Link>
        </div>
        <div
          className="menu-open hover_target cursor-pointer"
          data-cursor-scale="2"
          onClick={toggleMenu}
        >
          <p>MENU</p>
        </div>
      </div>
      <div className="menu-overlay fixed top-0 left-0 w-full h-full px-[4vw] py-[1vw] bg-[#0b1227a0] backdrop-blur-[16px] z-[2]">
        <div className="menu-overlay-bar text-2xl flex justify-between">
          <div
            className="menu-logo hover_target flex items-center gap-3"
            data-cursor-scale="2"
          >
            <User className="w-6 h-6 cursor-pointer" />
            <Link href="/">EXAMEASE</Link>
          </div>
          <div
            className="menu-close hover_target cursor-pointer"
            data-cursor-scale="2"
            onClick={toggleMenu}
          >
            <p>CLOSE</p>
          </div>
        </div>
        <div className="menu-copy">
          <div className="menu-links py-[3vw]">
            {navLinks.map((link, i) => (
              <div
                className="menu-link-item-holder text-[5.7rem] px-[7vw] my-4 leading-[1]"
                key={i}
                onClick={toggleMenu}
              >
                <Link
                  href={link.href}
                  className="block menu-link w-full hover_click hover:bg-[#152348] transition-all duration-[0.4s]"
                  data-cursor-label={link.data}
                >
                  {link.label}
                </Link>
              </div>
            ))}
          </div>
          <div className="menu-info flex justify-between">
            <div className="menu-info-col text-xl flex justify-between w-[50%]">
              <a href="">X &#8599;</a>
              <a href="">Instagram &#8599;</a>
              <a href="">LinkedIn &#8599;</a>
              {isLoggedIn ? (
                <a onClick={handleLogout}>Logout &#8599;</a>
              ) : (
                <Link href="/login">Login &#8599;</Link>
              )}
            </div>
            <div className="menu-info-col">
              <p>info@examease.com</p>
              <p>2342 232 343</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuChat;
