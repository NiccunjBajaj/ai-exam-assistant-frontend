"use client";
import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";

if (!gsap.core.globals().ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger, Flip);
}

const Card = ({ title, span, copy, index }) => {
  return (
    <div className="card relative text-[#161616]" id={`card-${index + 1}`}>
      <div className="card-inner relative will-change-transform w-full h-full p-[3vw] flex gap-[5vw]">
        <div className="card-content flex-3">
          <h1 className="text-[5vw] font-[600] leading-[1] mb-[4vw]">
            {title}
            <span>{span}</span>
          </h1>
          <p className="text-[1.3vw] font-[500]">{copy}</p>
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
      rotate: 1,
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
    gsap.to(".spline", {
      x: 0,
      delay: 1,
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

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  });

  return (
    <div className="font-[jost] select">
      <div className="overflow-hidden">
        <section className="hero flex flex-col gap-7 justify-center items-center w-screen bg-[#161616] relative">
          {/* <img
            className="absolute top-0 left-0 w-full h-full object-cover z-[-99]"
            src="/bg.png"
            alt="heroimage"
          /> */}
          <div className="overflow-hidden flex flex-col gap-7 h-full justify-center">
            <div className="w-full flex flex-col justify-center px-10">
              <h1 className="leading-[11vw] font-[federo] noselect flex flex-col justify-center items-center">
                <div className="text-[20vw] flex">
                  <div className="word scale-0">L</div>
                  <div className="text-[#ffe243] word scale-0">e</div>
                  <div className="word scale-0">a</div>
                  <div className="word scale-0">r</div>
                  <div className="word scale-0">n</div>
                  <div className="text-[#ffe243] word scale-0">e</div>
                  <div className="text-[#ffe243] word scale-0">e</div>
                </div>
                <div className="overflow-hidden leading-[11vw] flex flex-col items-center justify-center">
                  <div className="text-[7.5vw] tracking-[-0.5vw] font-[jost] font-[200] uppercase translate-y-[100vh] text">
                    a t<span className="text-[#ffe243]">oo</span>l b
                    <span className="text-[#ffe243]">o</span>x
                  </div>
                  <div className="text-[2.5vw] leading-0 font-[jost] tracking-wide uppercase translate-y-[100vh] text pb-[1vw]">
                    for <span className="text-[#ffe243]">st</span>uden
                    <span className="text-[#ffe243]">ts</span>
                  </div>
                </div>
              </h1>
            </div>
          </div>
        </section>
      </div>

      <section className="about rounded-t-[4vw] relative bg-[#f2f2f2] flex flex-col gap-[2vw]">
        <h1 className="animate-text heading font-[jost] font-[100]">
          Your AI-powered exam assistant, designed to help students learn
          smarter and faster. It provides instant answers tailored to exam
          formats.
        </h1>
        <a
          href="/chat"
          className="p-4 bg-[#161616] hover:bg-[#ffe34385] text-[#efefef] hover:text-[#000000] text-2xl font-medium rounded-full transition-all duration-[0.3s]"
        >
          Get Started &#8599;
        </a>
      </section>

      <section className="bg-[#161616] services relative w-full h-[100svh] flex flex-col justify-center items-center overflow-hidden">
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
        <section className="intro services-copy relative mt-[155svh] pt-[2rem] pr-[2rem] pb-[25svh] pl-[2rem] text-center bg-[#fff] rounded-t-[4vw] flex flex-col items-center gap-[2vw]">
          <h1 className="animate-text heading font-[jost]">
            Generate concise notes, and create flashcards for quick revision,
            making studying more personalized, efficient, and engaging.
          </h1>
          <a
            href="/chat"
            className="p-4 bg-[#161616] hover:bg-[#ffe34385] text-[#efefef] hover:text-[#000000] text-2xl font-medium rounded-full transition-all duration-[0.3s]"
          >
            Explore &#8599;
          </a>
        </section>
        <section className="cards">
          {cards.map((card, index) => (
            <Card
              key={index}
              {...card}
              index={index}
              containerRef={containerRef}
            />
          ))}
        </section>
        <footer className="outro relative w-screen h-screen p-[3vw] bg-[#161616]">
          <h1 className="text-[5vw] font-[600] leading-[1] mb-[3vw]">
            Leanree
          </h1>
        </footer>

        {/* <footer className="select font-[mouse] rounded-t-[4vw] bg-[#fff] w-[100vw] h-screen text-[#161616] flex flex-col justify-between items-center p-[2vw]">
        <h1 className="text-[8vw] uppercase leading-[4vw]">
          The <span className="text-[#ffe34385]">future</span> is in Your
          Hands
        </h1>
        <div className="flex w-[100vw] justify-between">
          <p>&copy; 2025 Oblivon Decks</p>
          <p>All rights reserved.</p>
        </div>
      </footer> */}
        {/* <section className=" bg-[#161616] font-[jost] noselect">
        <div className="service">
        <div className="col">
            <div className="service-copy leading-[5vw]">
              <h3 className="text-[5vw] font-[federo] tracking-wider">
                Chat<span className="text-[#ffe243] uppercase">bot</span>
              </h3>
              <AnimatedCopy>
                <p>
                  <span className="text-[#ffe243]">Proff</span> is an
                  intelligent AI-powered study assistant designed to simplify
                  exam preparation. It provides instant answers based on mark
                  distribution and can also generate structured notes and
                  flashcards. With <span className="text-[#ffe243]">Proff</span>
                  , students can stay productive, understand concepts faster,
                  and prepare efficiently for exams with a focused learning
                  support.
                </p>
              </AnimatedCopy>
            </div>
          </div>
          <div className="col">
            <img src="/chat.png" alt="" />
          </div>
        </div>

        <div className="service">
          <div className="col">
            <img src="/rev.png" alt="" />
          </div>
          <div className="col">
            <div className="service-copy leading-[5vw]">
              <h3 className="text-[4vw] font-[federo] tracking-wider">
                Re<span className="text-[#ffe243]">vision</span>
              </h3>
              <AnimatedCopy>
                <p>
                  Revision becomes effortless with{" "}
                  <span className="text-[#ffe243] uppercase">learnee</span>. It
                  helps students quickly review key concepts using AI-generated
                  notes and flashcards tailored to their syllabus and mark
                  distribution. With smart summaries, and instant answers, our
                  platform ensures every revision session is focused, efficient,
                  and perfectly aligned with exam goals.
                </p>
              </AnimatedCopy>
            </div>
          </div>
        </div>

        <div className="service">
          <div className="col">
            <div className="service-copy">
              <h3 className="text-[5vw] font-[federo] tracking-wider">
                Qui<span className="text-[#ffe243]">zzz</span>
              </h3>
              <AnimatedCopy>
                <p>
                  Quiz System lets students test their understanding through
                  personalized quizzes generated from{" "}
                  <span className="text-[#ffe243]">
                    Chat Discussions, Study Materials, or Uploaded Files
                  </span>
                  . Each quiz follows the exam’s mark distribution and includes
                  instant feedback to help students identify weak areas, improve
                  retention, and make their preparation more focused and
                  effective.
                </p>
              </AnimatedCopy>
            </div>
          </div>
          <div className="col">
            <img src="/quiz.png" alt="" />
          </div>
        </div>

        <div className="service">
          <div className="col">
            <img src="/study.png" alt="" />
          </div>
          <div className="col">
            <div className="service-copy leading-[5vw]">
              <h3 className="text-[5vw] font-[federo] tracking-wider">Study</h3>
              <AnimatedCopy>
                <p>
                  Study on Leanree is your personalized learning hub — where AI
                  transforms chat into quizzez, uploaded files into organized
                  notes and flashcards. It helps you revise smarter with concise
                  summaries and question breakdowns, making exam preparation
                  efficient and engaging.
                </p>
              </AnimatedCopy>
            </div>
          </div>
        </div>
        <footer className="select font-[mouse] rounded-t-[4vw] bg-[#fff] w-[100vw] h-screen text-[#161616] flex flex-col justify-between items-center p-[2vw]">
          <h1 className="text-[8vw] uppercase leading-[4vw]">
            The <span className="text-[#ffe34385]">future</span> is in Your
            Hands
          </h1>
          <div className="flex w-[100vw] justify-between">
            <p>&copy; 2025 Oblivon Decks</p>
            <p>All rights reserved.</p>
          </div>
        </footer>
      </section> */}
      </div>
    </div>
  );
};

export default Hero;
