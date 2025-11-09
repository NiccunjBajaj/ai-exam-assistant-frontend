"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Spline from "@splinetool/react-spline";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";

export default function FlashcardDetailPage() {
  const { fetchWithAuth } = useAuth();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const { id } = useParams();
  const [cards, setCards] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchCards = async () => {
      const res = await fetchWithAuth(
        `${BACKEND_URL}/flashcards/by-session/${id}`
      );
      const data = await res.json();
      setCards(data);
    };
    fetchCards();
  }, [id]);

  const autoBoldKeywords = (text) =>
    text.replace(/\b(important|note|tip)\b/gi, "**$1**");

  return (
    <>
      <div className={`absolute ${isMobile ? "top-4 left-4" : "top-[1.3vw] left-[2vw]"} bg-[#ffe655] hover:bg-[#606060] text-[#00141b] rounded-[1vw] cursor-pointer`}>
        <Link
          href="/study/flashcards"
          className={`${isMobile ? "text-lg px-2" : "text-[1.2vw] px-[0.5vw]"} flex items-center`}
        >
          <ArrowLeft />
          Back
        </Link>
      </div>
      {/* <div className="fixed z-[-9999] w-full">
        <Spline scene="https://prod.spline.design/8UR40oDmhAS3NI8V/scene.splinecode" />
      </div> */}
      <main className="bg-[#00141b] p-6 w-full mx-auto min-h-screen noto">
        {cards.length > 0 && (
          <h1 className={`${isMobile ? "text-4xl" : "text-6xl"} font-bold py-[0.5vw] w-fit mx-auto text-[#ffe655]`}>
            {cards[0].studysession.title}
          </h1>
        )}

        {cards.length === 0 ? (
          <p className="text-center mt-10">No flashcards found for this set.</p>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isMobile ? "p-2" : "p-4"}`}>
            {cards.map((c, i) => (
              <div
                key={c.id}
                className="bg-[#0b1e26] backdrop-blur-[3px] p-4 rounded-lg"
              >
                <p className={`font-semibold ${isMobile ? "text-lg" : "text-[1.2rem]"}`}>
                  {i + 1}Q: {c.question}
                </p>
                <hr className="my-3 text-[#f1e586]" />

                <MarkdownRenderer content={autoBoldKeywords(c.answer)} />
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
