"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StudyNav from "@/app/components/StudyNav";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { useAuth } from "@/app/components/AuthContext";

export default function QuizFromStudyPage() {
  const { fetchWithAuth, setCredits } = useAuth();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [sessions, setSessions] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);
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

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const fetchSessions = async () => {
    const res = await fetchWithAuth(`${BACKEND_URL}/study-sessions?type=notes`);
    const data = await res.json();
    setSessions(data);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchNotes = async () => {
    const res = await fetchWithAuth(`${BACKEND_URL}/notes`);
    const data = await res.json();
    setNotes(data);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const toggleNote = (id) => {
    setSelectedNotes((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  };

  const selectAllNotes = () => {
    setSelectedNotes(notes.map((n) => n.id));
  };

  const handleGenerate = async () => {
    if (!title.trim() || !selectedNotes.length) return;

    setLoading(true);
    const res = await fetchWithAuth(`${BACKEND_URL}/generate-quiz-from-study`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        marks,
        mode,
        note_ids: selectedNotes,
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
      <main className="pt-[6vw] p-6 max-w-fit mx-auto">
        <h1
          className={`${
            isMobile ? "text-5xl" : "text-8xl"
          } font-bold my-6 text-center w-fit`}
        >
          Generate <span className="text-[#ffe655]">Quiz</span> from Study
        </h1>
        <div
          className={`${
            isMobile ? "w-full" : "w-2/3"
          } mx-auto mt-[6vw] text-white`}
        >
          <div className="mb-4">
            <input
              className="text-xl w-full p-4 outline-none rounded mb-2 bg-[#0b1e26] text-[#ffe655]"
              placeholder="Quiz Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className={`flex gap-6 ${isMobile ? "flex-col" : ""}`}>
              <select
                className="w-full p-4 outline-none rounded bg-[#0b1e26]"
                value={marks}
                onChange={(e) => setMarks(parseInt(e.target.value))}
              >
                <option value={2}>2-marks quiz</option>
                <option value={5}>5-marks quiz</option>
                <option value={10}>10-marks quiz</option>
                <option value={150}>150-words quiz</option>
                <option value={250}>250-words quiz</option>
              </select>
              <select
                className="w-full p-4 outline-none rounded bg-[#0b1e26]"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="answer">Answer Type</option>
                <option value="mcq">Multiple Choice</option>
              </select>
            </div>
          </div>

          <div className="my-7 rounded bg-[#0b1e26]">
            <div>
              <h2 className="text-[#ffe655] text-3xl font-semibold mb-2 p-2">
                Notes
              </h2>
              <div className="space-y-2 max-h-60 overflow-y-auto outline-none rounded p-3">
                <input
                  type="text"
                  placeholder="Search notes..."
                  className="mx-auto p-2  mb-2 w-full bg-[#00141b] text-[#ffe655] rounded-md outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {filteredSessions.map((note) => (
                  <label
                    key={note.id}
                    className="flex items-center gap-2 text-lg"
                  >
                    <input
                      type="checkbox"
                      checked={selectedNotes.includes(note.id)}
                      onChange={() => toggleNote(note.id)}
                    />
                    <h3>{note.title}</h3>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          className="w-full text-[#00141b] bg-[#606060] hover:bg-[#ffe655] py-3 rounded-lg text-lg"
          onClick={handleGenerate}
          disabled={loading || !selectedNotes.length}
        >
          {loading ? "Generating Quiz..." : "Generate Quiz"}
        </button>
      </main>
    </>
  );
}
