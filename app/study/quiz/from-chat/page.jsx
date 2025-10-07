"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StudyNav from "@/app/components/StudyNav";

export default function QuizFromChatPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [title, setTitle] = useState("");
  const [marks, setMarks] = useState(5);
  const [mode, setMode] = useState("short");
  const [loading, setLoading] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  useEffect(() => {
    const fetchSessions = async () => {
      const res = await fetch("http://localhost:8000/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSessions(data);
    };

    fetchSessions();
  }, [token]);

  const handleGenerate = async () => {
    if (!selectedSession || !title.trim()) return;
    setLoading(true);

    const res = await fetch("http://localhost:8000/generate-quiz-from-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        session_id: selectedSession,
        title,
        marks,
        mode,
      }),
    });

    const data = await res.json();
    router.push(`/study/quiz/${data.session_id}`);
  };

  return (
    <>
      <StudyNav />
      <main className="p-6 pt-[6vw] max-w-fit mx-auto overflow-hidden">
        <h1 className="text-8xl font-bold mb-6 text-center">
          Generate <span className="text-[#ffe243]">Quiz</span> from Chat
        </h1>

        <div className="space-y-4 max-w-3xl mx-auto text-white mt-[7vw]">
          <input
            className="w-full p-4 outline-none bg-[#222222] rounded text-[#ffe243]"
            placeholder="Quiz Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <select
            className="w-full p-4 outline-none bg-[#222222] rounded"
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

          <div className="flex gap-6">
            <select
              className="w-full p-4 outline-none bg-[#222222] rounded"
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
              className="w-full p-4 outline-none bg-[#222222] rounded"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="short">Answer Type</option>
              <option value="mcq">Multiple Choice</option>
            </select>

            <button
              className="w-full text-[#161616] bg-[#606060] hover:bg-[#ffe243] py-2 rounded"
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
