"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StudyNav from "@/app/components/StudyNav";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { useAuth } from "@/app/components/AuthContext";

export default function QuizFromChatPage() {
  const { fetchWithAuth, setCredits } = useAuth();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [title, setTitle] = useState("");
  const [marks, setMarks] = useState(5);
  const [mode, setMode] = useState("short");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      const res = await fetchWithAuth(`${BACKEND_URL}/sessions`);
      const data = await res.json();
      setSessions(data);
    };

    fetchSessions();
  }, []);

  const handleGenerate = async () => {
    if (!selectedSession || !title.trim()) return;
    setLoading(true);

    const res = await fetchWithAuth(`${BACKEND_URL}/generate-quiz-from-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: selectedSession,
        title,
        marks,
        mode,
      }),
    });

    const data = await res.json();
    if (data.credits !== undefined) {
      setCredits(data.credits);
    }
    router.push(`/study/quiz/${data.session_id}`);
  };

  return (
    <>
      <div
        className={`absolute ${
          isMobile ? "top-4 left-4" : "top-[1.3vw] left-[2vw]"
        } bg-[#ffe655] hover:bg-[#606060] text-[#00141b] rounded-[1vw] cursor-pointer`}
      >
        <Link
          href="/study/quiz"
          className={`${
            isMobile ? "text-lg px-2" : "text-[1.2vw] px-[0.5vw]"
          } flex items-center`}
        >
          <ArrowLeft />
          Back
        </Link>
      </div>
      <main className="p-6 pt-[6vw] max-w-fit mx-auto overflow-hidden">
        <h1
          className={`${
            isMobile ? "text-5xl" : "text-8xl"
          } font-bold my-6 text-center`}
        >
          Generate <span className="text-[#ffe655]">Quiz</span> from Chat
        </h1>

        <div
          className={`space-y-4 ${
            isMobile ? "w-full" : "max-w-3xl"
          } mx-auto text-white mt-[7vw]`}
        >
          <input
            className="w-full p-4 outline-none bg-[#0b1e26] rounded text-[#ffe655]"
            placeholder="Quiz Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <select
            className="w-full p-4 outline-none bg-[#0b1e26] rounded"
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
          >
            <option>Select a past chat session</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.title || "Untitled"} (
                {new Date(session.created_at).toLocaleDateString()})
              </option>
            ))}
          </select>

          <div className={`flex gap-6 ${isMobile ? "flex-col" : ""}`}>
            <select
              className="w-full p-4 outline-none bg-[#0b1e26] rounded"
              value={marks}
              onChange={(e) => setMarks(parseInt(e.target.value))}
            >
              <option value={2}>2-marks quiz</option>
              <option value={5}>5-marks quiz</option>
              <option value={10}>10-marks quiz</option>
              <option value={10}>150-words quiz</option>
              <option value={10}>250-words quiz</option>
            </select>

            <select
              className="w-full p-4 outline-none bg-[#0b1e26] rounded"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="answer">Answer Type</option>
              <option value="mcq">Multiple Choice</option>
            </select>

            <button
              className="w-full text-[#00141b] bg-[#606060] hover:bg-[#ffe655] py-2 rounded"
              onClick={handleGenerate}
              disabled={loading || !selectedSession || !title}
            >
              {loading ? "Generating..." : "Generate Quiz"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
