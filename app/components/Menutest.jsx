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
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/", label: "HOME", data: "home", icon: <HomeIcon size={130} /> },
  {
    href: "/chat",
    label: "PROFF",
    data: "proff",
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

// import "./Menu.css";

const Menu = () => {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const pathname = usePathname();
  const router = useRouter();
  const [plan, setPlan] = useState(null);
  const { isLoggedIn, logout, credits } = useAuth();

  const menuRef = useRef(null);
  const tl = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogOutModal, setShowLogOutModal] = useState(false);

  const isStudySubRoute = pathname.startsWith("/study/");
  const isChatRoute = pathname.startsWith("/chat");
  const shouldShowLogo = !isStudySubRoute && !isChatRoute;

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
  }, []);

  const handleLogout = () => {
    logout();
    window.location.reload(); // 🔄 full UI reset after logout
  };

  if (pathname === "/login" || pathname === "/register") return null;

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (showLogOutModal) {
          setShowLogOutModal(false);
        }
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showLogOutModal]);

  return (
    <>
      <AnimatePresence>
        {showLogOutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0000005b] backdrop-blur-[4px] flex items-center justify-center z-[1000]"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-[#1f1f1f] text-white p-6 rounded-2xl w-[90%] sm:w-[400px] shadow-xl"
            >
              <h3 className="text-lg font-semibold mb-3">Logout User?</h3>
              <p className="text-sm mb-6 opacity-80">
                Are you sure you want to Logout?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowLogOutModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowLogOutModal(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700"
                >
                  LogOut
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div
        className="menu-container font-[crushed] select z-[99999]"
        ref={menuRef}
      >
        <div
          className={`menu-bar fixed top-[0] right-[0] ${
            shouldShowLogo ? "w-screen" : "w-fit"
          } z-[1] flex items-center justify-between font-[200]`}
        >
          <div className="overflow-hidden">
            {shouldShowLogo && (
              <div className="image w-[8vw] translate-x-[-100%]">
                <a href="/">
                  <img
                    className="w-full h-full object-cover"
                    src="/logo.svg"
                    alt="logo"
                  />
                </a>
              </div>
            )}
          </div>
          <div
            className={`flex items-center gap-[2vw] ${
              shouldShowLogo ? "" : "py-[1.2vw]"
            }`}
          >
            {isLoggedIn && (
              <>
                <motion.div
                  key={credits}
                  initial={{ scale: 0.9, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`font-semibold px-[1vw] py-[0.3vw] rounded-2xl text-[1.2vw] ${
                    credits === 0
                      ? "bg-[#630202] text-[#F1F5F9]"
                      : "bg-[#FFE655] text-[#00141B]"
                  }`}
                >
                  Credits:&nbsp;{credits}
                </motion.div>

                <button
                  className="cursor-pointer bg-[#0B1E26] text-[#E2E8F0] font-medium hover:bg-[#EF4444] hover:text-[#FFFFFF] px-[1vw] py-[0.3vw] rounded-3xl text-[1.2vw] transition-all duration-200"
                  onClick={() => setShowLogOutModal(true)}
                >
                  Logout
                </button>
              </>
            )}

            <div className="flex w-full h-fit bg-[#00141B] rounded-l-full p-2 items-center">
              <div
                className="menu-open hover_target w-[40px] cursor-pointer flex flex-col justify-center gap-[0.4vw] p-2"
                data-cursor-scale="2"
                onClick={toggleMenu}
              >
                <div className="h-[0.25vw] rounded-full w-full bg-[#E2E8F0] bar"></div>
                <div className="h-[0.25vw] rounded-full w-full bg-[#FACC15] bar"></div>
                <div className="h-[0.25vw] rounded-full w-full bg-[#E2E8F0] bar"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="menu-overlay fixed top-0 left-0 w-[100vw] h-screen text-[#00141b] bg-[#e2e8f061] backdrop-blur-[20px] z-[2]">
          <div className="menu-overlay-bar text-[3vw] flex justify-between items-center">
            <div className="w-[8vw]">
              <img
                className="w-full h-full object-cover"
                src="/logo.svg"
                alt="logo"
              />
            </div>

            <div
              className="menu-close hover_target cursor-pointer text-[4vw] text-[#ffe655]"
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
                    className="menu-link hover_click hover:bg-[#ffe55569] hover:text-[#E2E8F0] transition-all duration-[0.4s] px-[1vw] py-[0.5vw] rounded-xl flex items-center justify-center gap-[2vw]"
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
    </>
  );
};

export default Menu;
