"use client";
import { useGSAP } from "@gsap/react";
import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BotIcon,
  CurrencyIcon,
  GpuIcon,
  HomeIcon,
  LibraryBig,
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
    icon: <GpuIcon size={130} />,
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

const Menu = () => {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/register") return null;

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();
  const [plan, setPlan] = useState(null);
  const { isLoggedIn, logout, credits } = useAuth();

  const menuRef = useRef(null);
  const tl = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogOutModal, setShowLogOutModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-[#0b1e26] text-[#e2e8f0] p-6 rounded-2xl w-[90%] sm:w-[400px] shadow-xl"
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
      <div className="font-[jost] select-none z-[99999]" ref={menuRef}>
        <div
          className={`fixed top-0 right-0 ${
            shouldShowLogo ? "w-screen" : "w-fit"
          } z-[1] flex items-center justify-between font-light`}
        >
          {shouldShowLogo && (
            <div className="w-24 md:w-32">
              <a href="/">
                <img
                  className="w-full h-full object-cover"
                  src="/logo.svg"
                  alt="logo"
                />
              </a>
            </div>
          )}
          <div
            className={`flex items-center gap-4 md:gap-8 ${
              shouldShowLogo ? "" : "py-4"
            }`}
          >
            {isLoggedIn && (
              <>
                <motion.div
                  key={credits}
                  initial={{ scale: 0.9, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`font-semibold px-3 py-1 rounded-full text-sm ${
                    isMobile ? "text-xs" : "md:text-base"
                  } ${
                    credits === 0
                      ? "bg-red-800 text-[#e2e8f0]"
                      : "bg-[#ffe655] text-[#00141b]"
                  }`}
                >
                  Credits:&nbsp;{credits}
                </motion.div>

                {!isMobile && (
                  <button
                    className="cursor-pointer bg-[#0b1e26] text-gray-200 font-medium hover:bg-red-600 hover:text-white px-3 py-1 rounded-full text-sm md:text-base transition-all duration-200"
                    onClick={() => setShowLogOutModal(true)}
                  >
                    Logout
                  </button>
                )}
              </>
            )}

            <div className="flex w-full h-fit bg-[#00141b] rounded-l-full p-2 items-center">
              <div
                className="w-10 h-10 cursor-pointer flex flex-col justify-center items-center gap-1.5"
                onClick={toggleMenu}
              >
                <div
                  className={`w-6 h-0.5 bg-gray-200 rounded-full transition-all duration-300 ${
                    isMenuOpen ? "rotate-45 translate-y-2" : ""
                  }`}
                ></div>
                <div
                  className={`w-6 h-0.5 bg-yellow-400 rounded-full transition-all duration-300 ${
                    isMenuOpen ? "opacity-0" : ""
                  }`}
                ></div>
                <div
                  className={`w-6 h-0.5 bg-gray-200 rounded-full transition-all duration-300 ${
                    isMenuOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="menu-overlay fixed top-0 left-0 w-screen h-screen text-[#00141b] bg-[#00141ba5] backdrop-blur-[20px] z-[2000]"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" }}
        >
          <div className="flex justify-between items-center p-4 md:p-8">
            <div className="w-24 md:w-32">
              <img
                className="w-full h-full object-cover"
                src="/logo.svg"
                alt="logo"
              />
            </div>

            <div className="cursor-pointer text-[#ffe655]" onClick={toggleMenu}>
              <XIcon size={40} />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center h-[80%]">
            <div className="flex flex-col items-center gap-8">
              {navLinks.map((link, i) => (
                <div
                  className="menu-link-item-holder"
                  key={i}
                  onClick={toggleMenu}
                >
                  <Link
                    href={link.href}
                    className={`text-5xl md:text-9xl text-[#e2e8f0] hover:bg-[#f2e6966f] hover:backdrop-blur-[10px] hover:text-[#00141b] transition-colors duration-300 flex items-center gap-4 w-screen justify-center ${
                      link.label === "PROFF"
                        ? "font-[mouse] tracking-widest"
                        : ""
                    }`}
                  >
                    {React.cloneElement(link.icon, {
                      className: "w-16 h-16 md:w-24 md:h-24 text-[#ffe655]",
                    })}
                    {link.label}
                  </Link>
                </div>
              ))}
            </div>
            {isMobile && isLoggedIn && (
              <div className="mt-28">
                <button
                  className="cursor-pointer bg-[#ff4343] text-[#e2e8f0] font-medium px-6 py-2 rounded-full text-lg transition-all duration-200"
                  onClick={() => {
                    toggleMenu();
                    setShowLogOutModal(true);
                  }}
                  b
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Menu;
