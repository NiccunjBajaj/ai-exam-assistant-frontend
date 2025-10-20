"use client";
import { useGSAP } from "@gsap/react";
import Spline from "@splinetool/react-spline";
import gsap from "gsap";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function StudyPage() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [userName, setUserName] = useState("");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  // Fetching user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${BACKEND_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        console.log(data);
        setUserName(data.name);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };

    fetchUser();
  }, []);

  useGSAP(() => {
    gsap.to(".bound", {
      y: 0,
      duration: 1.5,
      stagger: 0.2,
      ease: "expo.inOut",
    });
    gsap.to(".image", {
      scale: 1,
      delay: 1.2,
      duration: 1.2,
      ease: "expo",
    });
  });

  return (
    <>
      {/* <div className="fixed w-full z-[-99]">
        <Spline scene="https://prod.spline.design/7mYxTZR1HE7uxNny/scene.splinecode" />
      </div> */}
      <main
        className="h-screen bg-[#161616] backdrop-blur-[3px] select"
        w-screen
      >
        <div className="h-[inherit]">
          <div className="overflow-hidden h-full">
            <div className="bound translate-y-[300%] text-left mx-[7vw] mt-[12vw] w-full h-fit px-[6vw]">
              <h2 className="text-3xl px-3 mb-[2vw]">Welcome to</h2>
              <h1
                className="text-[5.5vw] font-bold hover_target leading-[0.7] font-[federo]"
                data-cursor-scale="5"
              >
                {userName ? (
                  <span className="text-[#ffe243]">
                    {" "}
                    {userName.toUpperCase().split(" ")[0]}'S STUDY
                  </span>
                ) : (
                  "YOUR STUDY"
                )}
              </h1>
              <div
                className="flex items-center w-5/6 hover_target"
                data-cursor-scale="5"
              >
                <p className="leading-[1.5] text-xl px-3">
                  Every journey begins with a single step — and this is yours,{" "}
                  <span className="text-[#ffe243]">
                    {userName ? userName.toUpperCase() : "learner"}
                  </span>
                  . This space is crafted to fuel your curiosity, sharpen your
                  mind, and keep your learning organized. Here, every note,
                  every flashcard, and every moment of focus brings you closer
                  to your goals. Let’s turn study into progress.
                </p>
                <img
                  className="w-[24vw] rounded-full image scale-0"
                  src="/std.png"
                  alt=""
                />
              </div>
              <div className="px-3">
                {/* Notes Card */}
                <Link
                  href={"/study/notes"}
                  className="p-3 text-center rounded-full hover:bg-[#ffe243] bg-[#fff] text-black transition-all duration-[.4s]"
                >
                  Notes &#8599;
                </Link>

                {/* Flashcards Card */}
                <Link
                  href={"/study/flashcards"}
                  className="p-3 text-center rounded-full hover:bg-[#ffe243] bg-white text-black transition-all duration-[.4s] mx-3"
                >
                  Flashcards &#8599;
                </Link>
                <Link
                  href={"/study/quiz"}
                  className="p-3 text-center rounded-full hover:bg-[#ffe243] bg-white text-black transition-all duration-[.4s]"
                >
                  Quiz &#8599;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
