"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StudyNav from "@/app/components/StudyNav";

export default function QuizFromStudyPage() {
  const BACKEND_URL = process.env.BACKEND_URL;
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [sessions, setSessions] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [marks, setMarks] = useState(5);
  const [mode, setMode] = useState("short");
  const [loading, setLoading] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const fetchSessions = async () => {
    const res = await fetch(`${BACKEND_URL}/study-sessions?type=notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSessions(data);
  };

  useEffect(() => {
    fetchSessions();
  }, [token]);

  const fetchNotes = async () => {
    const res = await fetch(`${BACKEND_URL}/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setNotes(data);
  };

  useEffect(() => {
    if (!token) return;
    fetchNotes();
  }, [token]);

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
    const res = await fetch(`${BACKEND_URL}/generate-quiz-from-study`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        marks,
        mode,
        note_ids: selectedNotes,
      }),
    });

    const data = await res.json();
    router.push(`/study/quiz/${data.session_id}`);
  };

  return (
    <>
      <StudyNav />
      <main className="pt-[6vw] p-6 max-w-fit mx-auto">
        <h1 className="text-8xl font-bold mb-6 text-center w-fit">
          Generate <span className="text-[#ffe243]">Quiz</span> from Study
        </h1>
        <div className="w-2/3 mx-auto mt-[6vw] text-white">
          <div className="mb-4">
            <input
              className="text-xl w-full p-4 outline-none rounded mb-2 bg-[#222222] text-[#ffe243]"
              placeholder="Quiz Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex gap-6">
              <select
                className="w-full p-4 outline-none rounded bg-[#222222]"
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
                className="w-full p-4 outline-none rounded bg-[#222222]"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="short">Answer Type</option>
                <option value="mcq">Multiple Choice</option>
              </select>
            </div>
          </div>

          <div className="my-7 rounded bg-[#151515]">
            <div>
              <h2 className="text-[#ffe243] text-3xl font-semibold mb-2 p-2">
                Notes
              </h2>
              <div className="space-y-2 max-h-60 overflow-y-auto outline-none rounded p-3">
                <input
                  type="text"
                  placeholder="Search notes..."
                  className="mx-auto p-2  mb-2 w-full bg-[#222222] text-[#ffe243] rounded-md outline-none"
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
          className="w-full text-[#161616] bg-[#606060] hover:bg-[#ffe243] py-3 rounded-lg text-lg"
          onClick={handleGenerate}
          disabled={loading || !selectedNotes.length}
        >
          {loading ? "Generating Quiz..." : "Generate Quiz"}
        </button>
      </main>
    </>
  );
}
