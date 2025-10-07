"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Spline from "@splinetool/react-spline";
import { Trash2Icon } from "lucide-react";
import StudyNav from "@/app/components/StudyNav";

export default function QuizHomePage() {
  const [search, setSearch] = useState("");
  const [sessions, setSessions] = useState([]);
  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const fetchFlashcardSessions = async () => {
    const res = await fetch("http://localhost:8000/study-sessions?type=quiz", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSessions(data);
  };
  useEffect(() => {
    if (!token) return;
    fetchFlashcardSessions();
  }, [token]);

  const deleteSession = async (sessionId) => {
    const confirmDelete = confirm("Are you sure you want to delete this quiz?");
    if (!confirmDelete) return;

    try {
      await fetch(`http://localhost:8000/study-sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error("Error deleting session", err);
      alert("Failed to delete note");
    }
  };

  return (
    <>
      <StudyNav />
      {/* <div className="fixed z-[-9999] w-full">
        <Spline scene="https://prod.spline.design/c6NMNa7uwCUsZ6kh/scene.splinecode" />
      </div> */}
      <main className="min-h-screen pt-[5vw] bg-[#161616]">
        <h1 className="text-8xl font-bold text-center mb-6 text-[#ffe243]">
          Quiz
        </h1>
        <div className="flex flex-col gap-4 px-[15vw]">
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mx-auto px-4 py-3 w-1/3 bg-[#1e1e1e] rounded-md outline-none text-[#ffe243]"
          />

          <div className="grid grid-cols-4 gap-4 max-h-[65vh] overflow-auto p-4 hover_target mod-scrollbar rounded-lg">
            {filteredSessions.map((s) => {
              const randomNum = Math.floor(Math.random() * 4) + 1;
              const bgImage = `/img-${randomNum}.jpeg`;

              return (
                <div
                  key={s.id}
                  className="flex flex-col justify-end rounded-lg p-2 shadow hover:shadow-md cursor-pointer text-[#ffe243] bg-[#ffe34385] hover:scale-[1.04] backdrop-blur-[3px] mod-scrollbar transition-all duration-[0.4s]"
                >
                  <div onClick={() => router.push(`/study/quiz/${s.id}`)}>
                    <img
                      src={bgImage}
                      className="object-cover brightness-75 rounded-md"
                      alt=""
                    />
                    <div className="bg-black/50 p-2 rounded-md mt-2">
                      <h2 className="text-2xl font-semibold truncate">
                        {s.title}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSession(s.id)}
                    className="text-left text-sm mt-3 text-red-600 w-fit cursor-pointer"
                  >
                    <Trash2Icon />
                  </button>
                </div>
              );
            })}

            {filteredSessions.length === 0 && (
              <p className="text-gray-500">No Quiz found.</p>
            )}
          </div>
        </div>
        <div className="mx-auto w-fit mt-[2vw]">
          <Link
            href={"/study/quiz/from_file"}
            className="p-3 text-center rounded-full hover:bg-[#606060] bg-[#ffe34385] text-[#161616] hover:text-black transition-all duration-[.4s]"
          >
            From-File &#8599;
          </Link>

          <Link
            href={"/study/quiz/from-chat"}
            className="p-3 text-center rounded-full hover:bg-[#606060] bg-[#ffe34385] text-[#161616] hover:text-black transition-all duration-[.4s] mx-3"
          >
            From-Chat &#8599;
          </Link>
          <Link
            href={"/study/quiz/from-study"}
            className="p-3 text-center rounded-full hover:bg-[#606060] bg-[#ffe34385] text-[#161616] hover:text-black transition-all duration-[.4s]"
          >
            From-Study &#8599;
          </Link>
        </div>
      </main>
    </>
  );
}
