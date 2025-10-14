"use client";
import { useGSAP } from "@gsap/react";
import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BotIcon,
  CurrencyIcon,
  HomeIcon,
  LibraryBig,
  MenuIcon,
  User,
  XIcon,
} from "lucide-react";
import { useAuth } from "./AuthContext";

const navLinks = [
  { href: "/", label: "HOME", data: "home", icon: <HomeIcon size={130} /> },
  {
    href: "/chat",
    label: "ASTRA",
    data: "astra",
    icon: <BotIcon size={130} />,
  },
  {
    href: "/study",
    label: "STUDY",
    data: "study",
    icon: <LibraryBig size={130} />,
  },
  {
    href: "/price",
    label: "PRICING",
    data: "pricing",
    icon: <CurrencyIcon size={130} />,
  },
];

const navLinksShort = [
  { href: "#", label: "INSTAGRAM" },
  { href: "#", label: "YOUTUBE" },
  { href: "#", label: "TWITTER" },
];

const Menu = () => {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const pathname = usePathname();
  const router = useRouter();
  const [plan, setPlan] = useState(null);
  const { isLoggedIn, logout } = useAuth();

  const menuRef = useRef(null);
  const tl = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useGSAP(
    () => {
      gsap.set(".menu-link-item-holder", { y: 75 });
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
    if (isMenuOpen) tl.current?.play();
    else tl.current?.reverse();
  }, [isMenuOpen]);

  const fetchPlan = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetch(`${BACKEND_URL}/plan/me`, {
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

  //Animations
  useGSAP(() => {
    gsap.to(".bar", {
      width: "100%",
      stagger: 0.1,
      duration: 0.2,
      delay: 0.6,
    });
    gsap.to(".image", {
      x: 0,
      duration: 0.2,
      delay: 0.6,
    });
  });

  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <div
      className="menu-container font-[crushed] select z-[99999]"
      ref={menuRef}
    >
      <div className="menu-bar fixed top-[0] right-[0] w-screen z-[1] flex items-center justify-between font-[200]">
        <div className="overflow-hidden">
          <div className="image w-[8vw] translate-x-[-100%]">
            <img
              className="w-full h-full object-cover"
              src="/logo.svg"
              alt="logo"
            />
          </div>
        </div>
        <div className="flex gap-[2vw]">
          {isLoggedIn ? (
            <button
              className="cursor-pointer bg-[#606060] font-[400] text-[#161616] hover:bg-red-500 hover:text-[#fff] px-[0.5vw] rounded-3xl text-[1.2vw]"
              onClick={logout}
            >
              Logout
            </button>
          ) : (
            ""
          )}
          <div
            className="menu-open hover_target cursor-pointer w-[2vw] flex flex-col justify-center gap-2"
            data-cursor-scale="2"
            onClick={toggleMenu}
          >
            <div className="h-[0.3vw] rounded-full w-100 bg-[#fff] bar"></div>
            <div className="h-[0.3vw] rounded-full w-100 bg-[#ffe243] bar"></div>
            <div className="h-[0.3vw] rounded-full w-100 bg-[#fff] bar"></div>
          </div>
        </div>
      </div>

      <div className="menu-overlay fixed top-0 left-0 w-[100vw] h-screen text-[#1a1a1a] bg-[#77670cb7] backdrop-blur-[20px] z-[2]">
        <div className="menu-overlay-bar text-[3vw] flex justify-between items-center">
          <div className="w-[8vw]">
            <img
              className="w-full h-full object-cover"
              src="/logoinv.svg"
              alt="logo"
            />
          </div>

          <div
            className="menu-close hover_target cursor-pointer text-[4vw]"
            data-cursor-scale="2"
            onClick={toggleMenu}
          >
            <p>
              <XIcon size={40} />
            </p>
          </div>
        </div>

        <div className="menu-copy flex">
          <div className="menu-links">
            {navLinks.map((link, i) => (
              <div
                className="menu-link-item-holder w-[100vw] text-[12vw] my-4 leading-[8vw] tracking-widest"
                key={i}
                onClick={toggleMenu}
              >
                <Link
                  href={link.href}
                  className="menu-link hover_click hover:bg-[#1616165c] hover:text-[#ffe862] transition-all duration-[0.4s] px-[1vw] py-[0.5vw] rounded-xl flex items-center justify-center gap-[2vw]"
                  data-cursor-label={link.data}
                >
                  {link.icon}
                  {link.label}
                </Link>
              </div>
            ))}
          </div>
          {/* <div className="menu-info flex flex-col justify-between gap-[2vw] items-end w-full pr-[2vw] py-[2vw]">
            <div className="menu-info-col text-[4vw] flex flex-col items-end justify-between w-full">
              <a href="">X &#8599;</a>
              <a href="">Instagram &#8599;</a>
              <a href="">LinkedIn &#8599;</a>
            </div>
            <div className="menu-info-col text-[3.4vw]">
              <p>info@examease.com</p>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Menu;
