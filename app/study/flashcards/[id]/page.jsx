"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Spline from "@splinetool/react-spline";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";

export default function FlashcardDetailPage() {
  const BACKEND_URL = process.env.BACKEND_URL;
  const { id } = useParams();
  const [cards, setCards] = useState([]);
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  useEffect(() => {
    if (!id) return;
    const fetchCards = async () => {
      const res = await fetch(`${BACKEND_URL}/flashcards/by-session/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCards(data);
    };
    fetchCards();
  }, [id, token]);

  const autoBoldKeywords = (text) =>
    text.replace(/\b(important|note|tip)\b/gi, "**$1**");

  return (
    <>
      {/* <div className="fixed z-[-9999] w-full">
        <Spline scene="https://prod.spline.design/8UR40oDmhAS3NI8V/scene.splinecode" />
      </div> */}
      <main className="bg-[#161616] p-6 w-full mx-auto min-h-screen noto">
        <h1 className="text-2xl font-bold mb-4 text-center z-10 py-2">
          📚 Flashcards
        </h1>

        {cards.length === 0 ? (
          <p className="text-center mt-10">No flashcards found for this set.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {cards.map((c, i) => (
              <div
                key={c.id}
                className="bg-[#ffe3432d] backdrop-blur-[3px] p-4 rounded-lg"
              >
                <p className="font-semibold">
                  {i + 1}Q: {c.question}
                </p>
                <hr className="my-3 text-[#ffe243]" />
                <p className="mt-1">
                  <MarkdownRenderer content={autoBoldKeywords(c.answer)} />
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
