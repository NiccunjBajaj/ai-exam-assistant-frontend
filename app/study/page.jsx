"use client";
import { useGSAP } from "@gsap/react";
import Spline from "@splinetool/react-spline";
import gsap from "gsap";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../components/AuthContext";

export default function StudyPage() {
  const { fetchWithAuth } = useAuth();
  const [userName, setUserName] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetching user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/me`
        );
        const data = await res.json();
        setUserName(data.name);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };

    fetchUser();
  }, []);

  useGSAP(() => {
    if (isMobile) return;
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
  }, [isMobile]);

  return (
    <>
      {/* <div className="fixed w-full z-[-99]">
        <Spline scene="https://prod.spline.design/7mYxTZR1HE7uxNny/scene.splinecode" />
      </div> */}
      <main className="h-full bg-[#00141b] backdrop-blur-[3px] select w-screen">
        <div className="h-full">
          <div className="overflow-hidden h-full flex flex-col items-center justify-center">
            <div
              className={`bound translate-y-[300%] text-left ${
                isMobile
                  ? "mx-[2vw] mt-[5vw] px-[2vw]"
                  : "mx-[7vw] mt-[12vw] px-[6vw]"
              } w-full h-fit`}
            >
              <h2
                className={`px-3 ${
                  isMobile ? "text-xl mb-[3vw]" : "text-3xl mb-[2vw]"
                }`}
              >
                Welcome to
              </h2>
              <h1
                className={`${
                  isMobile ? "text-[10vw] my-3" : "text-[5.5vw]"
                } font-bold hover_target leading-[0.7] font-[federo]`}
                data-cursor-scale="5"
              >
                {userName ? (
                  <span className="text-[#ffe655]">
                    {" "}
                    {userName.toUpperCase().split(" ")[0]}'S STUDY
                  </span>
                ) : (
                  "YOUR STUDY"
                )}
              </h1>
              <div
                className={`flex items-center ${
                  isMobile ? "flex-col w-full" : "w-5/6"
                } hover_target`}
                data-cursor-scale="5"
              >
                <p
                  className={`leading-[1.5] ${
                    isMobile ? "text-base px-0" : "text-[1.3rem] px-3"
                  }`}
                >
                  Every journey begins with a single step — and this is yours,{" "}
                  <span className="text-[#ffe655]">
                    {userName ? userName.toUpperCase() : "learner"}
                  </span>
                  . This space is crafted to fuel your curiosity, sharpen your
                  mind, and keep your learning organized. Here, every note,
                  every flashcard, and every moment of focus brings you closer
                  to your goals. Let’s turn study into progress.
                </p>
                <img
                  className={`${
                    isMobile ? "w-[50vw] mt-5" : "w-[24vw]"
                  } rounded-full image scale-0`}
                  src="/std.png"
                  alt=""
                />
              </div>
              <div
                className={`px-3 ${
                  isMobile ? "flex flex-col gap-3 mt-5" : "text-[1.3rem]"
                }`}
              >
                {/* Notes Card */}
                <Link
                  href={"/study/notes"}
                  className="p-3 text-center rounded-full hover:bg-[#F1E596] bg-[#e2e8f0] text-black transition-all duration-[.4s]"
                >
                  Notes &#8599;
                </Link>

                {/* Flashcards Card */}
                <Link
                  href={"/study/flashcards"}
                  className={`p-3 text-center rounded-full hover:bg-[#F1E596] bg-[#e2e8f0] text-black transition-all duration-[.4s] ${
                    isMobile ? "mx-0" : "mx-3"
                  }`}
                >
                  Flashcards &#8599;
                </Link>
                <Link
                  href={"/study/quiz"}
                  className="p-3 text-center rounded-full hover:bg-[#F1E596] bg-[#e2e8f0] text-black transition-all duration-[.4s]"
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
