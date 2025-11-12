"use client";
import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import AnimatedCopy from "./AnimatedCopy";
import { useAuth } from "./AuthContext";

if (!gsap.core.globals().ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger, Flip);
}

const Card = ({ title, span, copy, index }) => {
  return (
    <div className="card relative text-[#00141b]" id={`card-${index + 1}`}>
      <div className="card-inner rounded-t-4xl relative will-change-transform w-full h-full p-[3vw] flex gap-[5vw]">
        <div className="card-content flex-3">
          <h2 className="text-[5vw] font-[600] leading-[1] mb-[4vw]">
            {title}
            <span>{span}</span>
          </h2>
          <p className="text-[1.5vw] font-[500] mt-[1vw]">{copy}</p>
        </div>
        <div className="card-img flex-1 aspect-[16/9] rounded-[1.2vw] overflow-hidden">
          <img
            className="w-full h-full object-cover"
            src={`/card-${index + 1}.png`}
            alt={title}
          />
        </div>
      </div>
    </div>
  );
};

const Hero = () => {
  const containerRef = useRef();
  const { isLoggedIn } = useAuth();

  const cards = [
    {
      title: "Chat",
      span: "BOT",
      copy: "Proff is an intelligent AI-powered study assistant designed to simplify exam preparation. It provides instant answers based on mark distribution and can also generate structured notes and flashcards. With Proff, students can stay productive, understand concepts faster, and prepare efficiently for exams with a focused learning support.",
    },
    {
      title: "Re",
      span: "vision",
      copy: "Revision becomes effortless with learnee. It helps students quickly review key concepts using AI-generated notes and flashcards tailored to their syllabus and mark distribution. With smart summaries, and instant answers, our platform ensures every revision session is focused, efficient, and perfectly aligned with exam goals.",
    },
    {
      title: "Quiz",
      span: "zz",
      copy: "Quiz System lets students test their understanding through personalized quizzes generated from Chat Discussions, Study Materials, or Uploaded Files. Each quiz follows the exam’s mark distribution and includes instant feedback to help students identify weak areas, improve retention, and make their preparation more focused and effective.",
    },
    {
      title: "Study",
      span: "",
      copy: "Study on Leanree is your personalized learning hub — where AI transforms chat into quizzez, uploaded files into organized notes and flashcards. It helps you revise smarter with concise summaries and question breakdowns, making exam preparation efficient and engaging.",
    },
  ];

  useGSAP(() => {
    document.querySelectorAll(".animate-text").forEach((textElement) => {
      const text = textElement.textContent?.trim() ?? "";
      textElement.setAttribute("data-text", text);

      ScrollTrigger.create({
        trigger: textElement,
        start: "top 50%",
        end: "bottom 50%",
        scrub: 1,
        onUpdate: (self) => {
          const clipValue = Math.max(0, 100 - self.progress * 100);
          textElement.style.setProperty("--clip-value", `${clipValue}%`);
        },
      });
    });

    ScrollTrigger.create({
      trigger: ".services",
      start: "top bottom",
      end: "top top",
      scrub: 1,
      onUpdate: (self) => {
        const headers = document.querySelectorAll(".service-header");
        gsap.set(headers[0], { x: `${100 - self.progress * 100}%` });
        gsap.set(headers[1], { x: `${-100 + self.progress * 100}%` });
        gsap.set(headers[2], { x: `${100 - self.progress * 100}%` });
      },
    });

    ScrollTrigger.create({
      trigger: ".services",
      start: "top top",
      end: `+=${window.innerHeight * 2}`,
      pin: true,
      scrub: 1,
      pinSpacing: false,
      onUpdate: (self) => {
        const headers = document.querySelectorAll(".service-header");
        if (self.progress <= 0.5) {
          const yProgress = self.progress / 0.5;
          gsap.set(headers[0], { y: `${yProgress * 100}%` });
          gsap.set(headers[2], { y: `${yProgress * -100}%` });
        } else {
          gsap.set(headers[0], { y: "100%" });
          gsap.set(headers[2], { y: "-100%" });

          const scaleProgress = (self.progress - 0.5) / 0.5;
          const minScale = window.innerWidth <= 1000 ? 0.5 : 0.3;
          const scale = 1 - scaleProgress * (1 - minScale);

          headers.forEach((header) => gsap.set(header, { scale }));
        }
      },
    });
    gsap.to(".word", {
      scale: 1,
      duration: 0.7,
      stagger: 0.1,
      ease: "bounce.out",
    });
    gsap.to(".image", {
      scale: 1,
      delay: 1.2,
      duration: 1.2,
      ease: "expo",
    });
    gsap.to(".text", {
      y: 0,
      duration: 0.8,
      stagger: 0.05,
      ease: "expo",
      delay: 0.3,
    });
    gsap.to(".cta", {
      scale: 1,
      duration: 0.7,
      ease: "bounce.out",
    });

    if (typeof window === "undefined") return;
    if (!containerRef.current) return;

    const cards = gsap.utils.toArray(".card");

    // Safely create scroll triggers
    if (cards.length) {
      ScrollTrigger.create({
        trigger: cards[0],
        start: "top 35%",
        endTrigger: cards[cards.length - 1],
        end: "top 30%",
        pin: ".intro",
        pinSpacing: false,
      });

      cards.forEach((card, index) => {
        const cardInner = card.querySelector(".card-inner");
        if (index === cards.length - 1 || !cardInner) return;

        ScrollTrigger.create({
          trigger: card,
          start: "top 35%",
          endTrigger: ".outro",
          end: "top 65%",
          pin: true,
          pinSpacing: false,
        });

        gsap.to(cardInner, {
          y: `-${(cards.length - index) * 14}vh`,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top 35%",
            endTrigger: ".outro",
            end: "top 65%",
            scrub: true,
          },
        });
      });
    }

    const features = document.querySelectorAll(".feature");
    const featureBg = document.querySelectorAll(".feature-bg");

    const featureStartPosition = [
      { top: 25, left: 30 }, //ChatBot
      { top: 80, left: 70 }, // Learn
      { top: 50, left: 75 }, //Notes
      { top: 25, left: 72.5 }, // Flashcards
      { top: 50, left: 25 }, // Revise
      { top: 80, left: 30 }, // Test
    ];

    features.forEach((feature, index) => {
      const featurePos = featureStartPosition[index];
      gsap.set(feature, {
        top: `${featurePos.top}%`,
        left: `${featurePos.left}%`,
      });
    });

    const featuresStartDimensions = [];
    featureBg.forEach((bbg) => {
      const rect = bbg.getBoundingClientRect();
      featuresStartDimensions.push({
        width: rect.width,
        heigth: rect.height,
      });
    });

    const remInPixels = parseFloat(
      getComputedStyle(document.documentElement).fontSize
    );
    const targerWidth = 3 * remInPixels;
    const targerHeight = 3 * remInPixels;

    const getSearchBarFinalWidth = () => {
      return window.innerWidth < 1000 ? 20 : 25;
    };

    let searchBarFinalWidth = getSearchBarFinalWidth();

    window.addEventListener("resize", () => {
      searchBarFinalWidth = getSearchBarFinalWidth();
      ScrollTrigger.refresh();
    });

    ScrollTrigger.create({
      trigger: ".spotlight",
      start: "start",
      end: `+=${window.innerHeight * 3}px`,
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;

        if (progress <= 0.3333) {
          const spotlightHeaderProgress = progress / 0.3333;
          gsap.set(".spotlight-content", {
            y: `${-100 * spotlightHeaderProgress}%`,
          });
        } else {
          gsap.set(".spotlight-content", {
            y: "-100%",
          });
        }
        if (progress >= 0 && progress <= 0.5) {
          const featureProgress = progress / 0.5;
          features.forEach((feature, index) => {
            const original = featureStartPosition[index];
            const currentTop =
              original.top + (50 - original.top) * featureProgress;
            const currentLeft =
              original.left + (50 - original.left) * featureProgress;

            gsap.set(feature, {
              top: `${currentTop}%`,
              left: `${currentLeft}%`,
            });
          });

          featureBg.forEach((bg, index) => {
            const featureDim = featuresStartDimensions[index];
            const currentWidth =
              featureDim.width +
              (targerWidth - featureDim.width) * featureProgress;
            const currentHeight =
              featureDim.height +
              (targerHeight - featureDim.height) * featureProgress;
            const currentBorderRadius = 10 + (25 - 10) * featureProgress;

            gsap.set(bg, {
              width: `${currentWidth}px`,
              height: `${currentHeight}px`,
              borderRadius: `${currentBorderRadius}`,
            });
          });

          if (progress >= 0 && progress <= 0.1) {
            const featureTextProgress = progress / 0.1;
            gsap.set(".feature-content", {
              opacity: 1 - featureTextProgress,
            });
          } else if (progress > 0.1) {
            gsap.set(".feature-content", {
              opacity: 0,
            });
          }
        }

        if (progress >= 0.5) {
          gsap.set(".features", {
            opacity: 0,
          });
        } else {
          gsap.set(".features", {
            opacity: 1,
          });
        }

        if (progress >= 0.5) {
          gsap.set(".search-bar", {
            opacity: 1,
          });
        } else {
          gsap.set(".search-bar", {
            opacity: 0,
          });
        }

        if (progress >= 0.5 && progress <= 0.75) {
          const searchBarProgress = (progress - 0.5) / 0.25;

          const width = 3 + (searchBarFinalWidth - 3) * searchBarProgress;
          const height = 3 + (5 - 3) * searchBarProgress;

          const translateY = -50 + (200 - -50) * searchBarProgress;

          gsap.set(".search-bar", {
            width: `${width}rem`,
            height: `${height}rem`,
            transform: `translate(-50%, ${translateY}%)`,
          });

          gsap.set(".search-bar p", {
            opacity: 0,
          });
        } else if (progress > 0.75) {
          gsap.set(".search-bar", {
            width: `${searchBarFinalWidth}rem`,
            height: " 5rem",
            transform: "translate(-50%, 200%)",
          });
        }

        if (progress >= 0.75) {
          const finalHeaderProgress = (progress - 0.75) / 0.25;

          gsap.set(".search-bar p", {
            opacity: finalHeaderProgress,
          });
          gsap.set(".header-content", {
            y: -50 + 50 * finalHeaderProgress,
            opacity: finalHeaderProgress,
          });
        } else {
          gsap.set(".search-bar p", {
            opacity: 0,
          });
          gsap.set(".header-content", {
            y: -50,
            opacity: 0,
          });
        }
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  });

  return (
    <div className="font-[jost] select">
      <div className="overflow-hidden">
        <section className="hero flex flex-col gap-7 justify-center items-center w-screen bg-[#000141b] relative">
          {/* <img
            className="absolute top-0 left-0 w-full h-full object-cover z-[-99]"
            src="/bg.png"
            alt="heroimage"
          /> */}
          <div className="overflow-hidden flex flex-col gap-7 h-full justify-center items-center">
            <div className="w-full flex flex-col justify-center px-10">
              <h1 className="leading-[11vw] font-[federo] noselect flex flex-col justify-center items-center">
                <div className="text-[20vw] flex">
                  <div className="word scale-0">L</div>
                  <div className="text-[#ffe655] word scale-0">e</div>
                  <div className="word scale-0">a</div>
                  <div className="word scale-0">r</div>
                  <div className="word scale-0">n</div>
                  <div className="text-[#ffe655] word scale-0">e</div>
                  <div className="text-[#ffe655] word scale-0">e</div>
                </div>
                <h2 className="overflow-hidden leading-[11vw] flex flex-col items-center justify-center w-full">
                  <span className="text-[7.5vw] tracking-[-0.5vw] font-[jost] font-[200] uppercase translate-y-[100vh] text">
                    a t<span className="text-[#ffe655]">oo</span>l b
                    <span className="text-[#ffe655]">o</span>x
                  </span>
                  <span className="text-[2.5vw] leading-0 font-[jost] tracking-wide uppercase translate-y-[100vh] text pb-[1vw]">
                    for <span className="text-[#ffe655]">st</span>uden
                    <span className="text-[#ffe655]">ts</span>
                  </span>
                </h2>
              </h1>
              {isLoggedIn ? (
                ""
              ) : (
                <a
                  className="bg-[#ffe655] text-[#00141b] hover:bg-[#606060] hover:text-[#fff] w-fit p-[0.4vw] px-[1vw] text-[1.5vw] rounded-4xl mx-auto mt-[2vw] cta transition-all duration-[0.2s] scale-0"
                  href="/login"
                >
                  Get Started
                </a>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="about rounded-t-[4vw] relative bg-[#E2E8F0] flex flex-col gap-[2vw]">
        <h2 className="animate-text heading font-[jost] font-[100]">
          Your AI-powered exam assistant, designed to help students learn
          smarter and faster. It provides instant answers tailored to exam
          formats.
        </h2>
        <a
          href="/chat"
          className="p-4 bg-[#F1E596] hover:bg-[#ffe655] text-[#000000] text-2xl font-medium rounded-full transition-all duration-[0.3s]"
        >
          Get Started &#8599;
        </a>
      </section>

      <section className="bg-[#000141b] services relative w-full h-[100svh] flex flex-col justify-center items-center overflow-hidden">
        <div className="service-header">
          <img
            className="w-[100vw] h-[100svh] object-cover"
            src="/learnorg.svg"
            alt=""
          />
        </div>
        <div className="service-header">
          <img
            className="w-[100vw] h-[100svh] object-cover z-[-10]"
            src="/learn.svg"
            alt=""
          />
        </div>
        <div className="service-header">
          <img
            className="w-[100vw] h-[100svh] object-cover"
            src="/learnorg.svg"
            alt=""
          />
        </div>
      </section>
      <div ref={containerRef}>
        <section className="intro services-copy relative mt-[155svh] pt-[3vw] pr-[3vw] pb-[25svh] pl-[3vw] text-center bg-[#E2E8F0] rounded-t-[4vw] flex flex-col items-center gap-[2vw]">
          <h2 className="animate-text heading font-[jost]">
            Generate concise notes, and create flashcards for quick revision,
            making studying more personalized, efficient, and engaging.
          </h2>
          <a
            href="/chat"
            className="p-4 bg-[#F1E596] hover:bg-[#ffe655] text-[#000000] text-2xl font-medium rounded-full transition-all duration-[0.3s]"
          >
            Explore &#8599;
          </a>
        </section>
        <section className="cards">
          {cards.map((card, index) => (
            <Card key={index} {...card} index={index} />
          ))}
        </section>
        <section className="outro relative w-screen h-[100svh] overflow-hidden flex flex-col items-center justify-center p-[3vw] bg-[#000141b]">
          <h2 className="text-[20vw] font-[600] leading-[1] text-center">
            L<span className="text-[#ffe655]">e</span>arn
            <span className="text-[#ffe655]">ee</span>
          </h2>
          <AnimatedCopy>
            <p className="text-[2vw] w-[60%]">
              Learnee is an AI-powered exam assistant that helps students
              prepare smarter with instant answers, auto-generated notes,
              flashcards, and personalized study tools — all in one platform.
            </p>
          </AnimatedCopy>
        </section>

        <section className="spotlight relative w-full h-[100svh] overflow-hidden">
          <div className="spotlight-content absolute w-full h-full flex justify-center items-center will-change-transform">
            <div className="spotlight-bg absolute scale-[0.58]">
              <img
                className="w-full h-full object-cover"
                src="/chats.png"
                alt="A screenshot of the Learnee chat interface, showing a conversation with the Proff AI assistant."
              />
            </div>
          </div>
          <div className="header absolute w-full h-full flex justify-center items-center will-change-transform ">
            <div className="header-content w-[60%] flex flex-col items-center text-center gap-[3vw] will-change-transform will-change-opacity translate-y-[-100px] opacity-0 mb-[2vw]">
              <h2 className="text-[5vw] font-[600] leading-[1] text-center">
                Find the answers with{" "}
                <span className="text-[#ffe655]">Proff</span>
                <span>'</span>
                <span className="text-[#ffe655]">s</span> assistance
              </h2>
              <p>
                Seek the answers you couldn't find — structures the ones you
                already know.
              </p>
            </div>
          </div>

          <div className="features">
            <div className="feature">
              <div className="feature-bg"></div>
              <div className="feature-content">
                <p>ChatBot</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-bg"></div>
              <div className="feature-content">
                <p>Learn</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-bg"></div>
              <div className="feature-content">
                <p>Notes</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-bg"></div>
              <div className="feature-content">
                <p>Flashcards</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-bg"></div>
              <div className="feature-content">
                <p>Revise</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-bg"></div>
              <div className="feature-content">
                <p>Test</p>
              </div>
            </div>
          </div>

          <div className="search-bar absolute top-[50%] left-[50%] translate-x-[-50%] ranslate-y-[-50%] w-[4vw] h-[4vw] bg-[#F1E596] rounded-4xl opacity-0 flex items-center will-change-transform will-change-opacity will-change-width will-change-height hover:bg-[#ffe655] cursor-pointer">
            <a href="/chat" className="flex justify-center w-full">
              <p className="text-[#000] relative opacity-0 will-change-opacity">
                Ask Proff
              </p>
            </a>
          </div>
        </section>

        <footer className="outro relative overflow-hidden flex rounded-t-4xl bg-[#E2E8F0]">
          <div className="w-[30vw] h-[30vw] bg-[url('/bee.svg')] bg-no-repeat bg-contain bg-center"></div>
          <h2 className="text-[15vw] text-[#00141b] font-[600] leading-[1]">
            L<span className="text-[#ffe655]">e</span>arn
            <span className="text-[#ffe655]">ee</span>
          </h2>
          <h2 className="text-[#00141b] lowercase">space</h2>
        </footer>
      </div>
    </div>
  );
};

export default Hero;
