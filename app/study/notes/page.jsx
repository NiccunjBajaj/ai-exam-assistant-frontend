"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Spline from "@splinetool/react-spline";
import { v4 as uuidv4 } from "uuid";
import { Trash2Icon } from "lucide-react";
import StudyNav from "@/app/components/StudyNav";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export default function NotesPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const inputRef = useRef(null);
  const [sessions, setSessions] = useState([]);
  const [uploadedText, setUploadedText] = useState("");
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState([]);
  const [marks, setMarks] = useState(5);
  const [loading, setLoading] = useState(false);
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  const filteredSessions = sessions.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.file_name.toLowerCase().includes(search.toLowerCase())
  );

  const fetchNotes = async () => {
    const res = await fetch("http://localhost:8000/notes", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setNotes(data);
  };

  useEffect(() => {
    if (!token) return;
    fetchNotes();
  }, [token]);

  const fetchSessions = async () => {
    const res = await fetch("http://localhost:8000/study-sessions?type=notes", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSessions(data);
  };

  useEffect(() => {
    fetchSessions();
  }, [token]);

  const handleUploadClick = () => inputRef.current?.click();

  const handleFileChange = async (e) => {
    const newId = uuidv4();
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setFile(file);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("session_id", newId);

    const res = await fetch("http://localhost:8000/upload-file", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    setUploadedText(data.text);
    setLoading(false);
  };

  const cancelGeneration = () => {
    setLoading(false);
    setUploadedText("");
    setFile(null);
    setTitle("");
    setMarks(2);
  };

  const generateNotes = async () => {
    if (!uploadedText) return;

    setLoading(true);
    const res = await fetch("http://localhost:8000/generate-notes", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_input: uploadedText,
        source: "file",
        file_name: file?.name || "Untitled",
        title: title.trim(),
        marks,
      }),
    });
    const data = await res.json();
    setNotes((prev) => [{ id: "new", content: data.notes }, ...prev]);
    await fetchNotes();
    await fetchSessions();
    setLoading(false);
    setFile(null);
    setUploadedText("");
    setTitle("");
    setMarks(5);
  };

  const deleteSession = async (sessionId) => {
    const confirmDelete = confirm("Are you sure you want to delete this note?");
    if (!confirmDelete) return;

    try {
      await fetch(`http://localhost:8000/study-sessions/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setNotes((prev) => prev.filter((n) => n.id !== sessionId));
    } catch (err) {
      console.error("Error deleting session", err);
      alert("Failed to delete note");
    }
  };

  // Animations

  return (
    <>
      <StudyNav />
      {/* <div className="fixed z-[-9999] w-full">
        <Spline scene="https://prod.spline.design/c6NMNa7uwCUsZ6kh/scene.splinecode" />
      </div> */}
      <main className="h-screen bg-[#161616] pt-[5vw]">
        <h1 className="text-8xl font-bold text-center mb-6 text-[#ffe243]">
          Study Notes
        </h1>

        {uploadedText && (
          <div className="max-w-xl mx-auto mt-[5vw]">
            <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
              <div className="w-full text-center">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your notes"
                  className="p-[0.7vw] bg-[#1e1e1e] rounded text-[#ffe243] w-[70%] text-[1.6vw] outline-none"
                />
              </div>
              <div className="mb-2">
                <select
                  value={marks}
                  onChange={(e) => setMarks(parseInt(e.target.value))}
                  className="p-[0.5vw] outline-none rounded cursor-pointer bg-[#1e1e1e] text-[0.9vw]"
                >
                  <option value={2}>2-marks</option>
                  <option value={5}>5-marks</option>
                  <option value={10}>10-marks</option>
                </select>
                <button
                  onClick={generateNotes}
                  disabled={loading}
                  className={`text-[#161616] bg-[#606060] hover:bg-[#ffe243] px-[0.5vw] py-[0.5vw] rounded mx-[0.6vw] text-[0.9vw] ${
                    loading ? "opacity-20 pointer-events-none" : "opacity-100"
                  }`}
                >
                  {loading ? "Generating…" : "Generate Notes"}
                </button>

                <button
                  onClick={cancelGeneration}
                  className={`px-[0.7vw] py-[0.5vw] bg-[#606060] hover:bg-red-600 text-[#161616] rounded ${
                    loading ? "hidden" : ""
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-300 ml-[4.5vw]">
              Extracted from: <strong>{file?.name}</strong>
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4 px-[15vw]">
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mx-auto px-4 py-3 w-1/3 bg-[#1e1e1e] rounded-md outline-none text-[#ffe243]"
          />

          <div className="grid grid-cols-4 gap-4 max-h-[80vh] overflow-auto p-4 hover_target rounded-lg mod-scrollbar">
            {filteredSessions.map((s) => {
              const randomNum = Math.floor(Math.random() * 4) + 1;
              const bgImage = `/img-${randomNum}.jpeg`;

              return (
                <div
                  key={s.id}
                  className="flex flex-col justify-end rounded-lg p-2 shadow hover:shadow-md cursor-pointer text-[#ffe243] bg-[#ffe34385] hover:scale-[1.04] backdrop-blur-[3px] mod-scrollbar transition-all duration-[0.4s]"
                >
                  <div onClick={() => router.push(`/study/notes/${s.id}`)}>
                    <img
                      src={bgImage}
                      className="object-cover brightness-75 rounded-md"
                      alt=""
                    />
                    <div className="bg-black/50 p-2 rounded-md mt-2">
                      <h2 className="text-2xl font-semibold truncate">
                        {s.title}
                      </h2>
                      <p className="text-sm text-[#c4c3c3] truncate">
                        {s.file_name}
                      </p>
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
              <p className="text-gray-500">No notes found.</p>
            )}
          </div>
        </div>

        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          ref={inputRef}
          hidden
          onChange={handleFileChange}
        />
        <button
          onClick={handleUploadClick}
          className="fixed bottom-6 right-6 hover:bg-[#606060] bg-[#ffe34385] text-[#161616] hover:text-black px-5 py-3 rounded-full shadow-lg text-2xl transition-all duration-[0.4s]"
        >
          📎 Upload File
        </button>
      </main>
    </>
  );
}
