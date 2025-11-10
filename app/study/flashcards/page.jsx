"use client";

import StudyNav from "@/app/components/StudyNav";
import Spline from "@splinetool/react-spline";
import { PencilLine, Trash2Icon, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/components/AuthContext";

export default function FlashcardsPage() {
  const { fetchWithAuth, setCredits } = useAuth();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const inputRef = useRef(null);
  const [uploadedText, setUploadedText] = useState("");
  const [file, setFile] = useState(null);
  const [cards, setCards] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [marks, setMarks] = useState(5);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [targetSessionId, setTargetSessionId] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const filteredSessions = sessions.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.file_name.toLowerCase().includes(search.toLowerCase())
  );

  const fetchCards = async () => {
    const res = await fetchWithAuth(`${BACKEND_URL}/flashcards`);
    const data = await res.json();
    setCards(data);
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchSessions = async () => {
    const res = await fetchWithAuth(
      `${BACKEND_URL}/study-sessions?type=flashcard`
    );
    const data = await res.json();
    setSessions(data);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

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

    const res = await fetchWithAuth(`${BACKEND_URL}/upload-file`, {
      method: "POST",
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

  const generateFlashcards = async () => {
    if (!uploadedText) return;

    setLoading(true);
    const res = await fetchWithAuth(`${BACKEND_URL}/generate-flashcards`, {
      method: "POST",
      body: JSON.stringify({
        user_input: uploadedText,
        source: "file",
        file_name: file?.name || "Untitled",
        title: title.trim(),
        marks,
      }),
    });

    const data = await res.json();
    if (data.credits !== undefined) {
      setCredits(data.credits);
    }
    const newCards = data.flashcards.map((c, i) => ({
      id: `new-${i}`,
      question: c.question,
      answer: c.answer,
    }));
    setCards((prev) => [...newCards, ...prev]);
    await fetchCards();
    await fetchSessions();
    setLoading(false);
    setUploadedText("");
    setFile(null);
    setTitle("");
    setMarks(2);
  };

  const deleteSession = async (sessionId) => {
    try {
      await fetchWithAuth(`${BACKEND_URL}/study-sessions/${sessionId}`, {
        method: "DELETE",
      });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setCards((prev) => prev.filter((n) => n.id !== sessionId));
    } catch (err) {
      console.error("Error deleting session", err);
      alert("Failed to delete note");
    }
  };

  const handleRename = async (id, title) => {
    if (!title?.trim()) return;
    try {
      const res = await fetchWithAuth(
        `${BACKEND_URL}/study-rename-session/${id}`,
        {
          method: "PUT",
          body: JSON.stringify({ title }),
        }
      );
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title } : s))
      );
      if (!res.ok) throw new Error("Rename failed");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (showDeleteModal) {
          setShowDeleteModal(false);
        }
        if (showRenameModal) {
          setShowRenameModal(false);
        }
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showDeleteModal, showRenameModal]);

  return (
    <>
      <StudyNav />
      {/* <div className="fixed z-[-9999] w-full">
        <Spline scene="https://prod.spline.design/c6NMNa7uwCUsZ6kh/scene.splinecode" />
      </div> */}
      <main className="min-h-screen pt-[5vw] noto">
        <h1
          className={`${
            isMobile ? "text-5xl" : "text-8xl"
          } font-bold text-center my-6 text-[#ffe655]`}
        >
          Study Flashcards
        </h1>

        {uploadedText && (
          <div className={`max-w-xl mx-auto mb-4 ${isMobile ? "mt-10" : ""}`}>
            <div
              className={`flex items-center justify-center gap-4 mt-2 ${
                isMobile ? "flex-col" : "flex-wrap"
              }`}
            >
              <div className="w-full text-center">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your notes"
                  className={`p-[0.7vw] bg-[#0B1E26] rounded text-[#ffe655] ${
                    isMobile ? "w-full text-lg" : "w-[70%] text-[1.3rem]"
                  } outline-none`}
                />
              </div>
              <div className="mb-2">
                <select
                  value={marks}
                  onChange={(e) => setMarks(parseInt(e.target.value))}
                  className={`p-[0.5vw] outline-none rounded cursor-pointer bg-[#0B1E26] ${
                    isMobile ? "text-base" : "text-[0.9vw]"
                  }`}
                >
                  <option value={2}>2-marks</option>
                  <option value={5}>5-marks</option>
                  <option value={10}>10-marks</option>
                </select>
                <button
                  onClick={generateFlashcards}
                  disabled={loading}
                  className={`text-[#00141b] bg-[#606060] hover:bg-[#ffe655] px-[0.5vw] py-[0.5vw] rounded mx-[0.6vw] ${
                    isMobile ? "text-base" : "text-[1rem]"
                  } ${
                    loading ? "opacity-20 pointer-events-none" : "opacity-100"
                  }`}
                >
                  {loading ? "Generating…" : "Generate Notes"}
                </button>

                <button
                  onClick={cancelGeneration}
                  className={`px-[0.7vw] py-[0.5vw] bg-[#606060] hover:bg-red-600 text-[#00141b] ${
                    isMobile ? "text-base" : "text-[1rem]"
                  } rounded ${loading ? "hidden" : ""}`}
                >
                  Cancel
                </button>
              </div>
            </div>
            <p
              className={`text-sm text-[#e2e8f0] ${
                isMobile ? "ml-0 text-center" : "ml-[3.5vw]"
              }`}
            >
              Extracted from: <strong>{file?.name}</strong>
            </p>
          </div>
        )}

        <div
          className={`flex flex-col gap-4 ${isMobile ? "px-4" : "px-[15vw]"}`}
        >
          <input
            type="text"
            placeholder="Search cards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`mx-auto px-4 py-3 ${
              isMobile ? "w-full" : "w-1/3"
            } bg-[#0B1E26] rounded-md outline-none text-[#ffe655]`}
          />

          <div
            className={`grid ${
              isMobile ? "grid-cols-1" : "grid-cols-4"
            } gap-4 max-h-[80vh] overflow-auto p-4 hover_target rounded-lg mod-scrollbar`}
          >
            {filteredSessions.map((s) => {
              return (
                <>
                  <AnimatePresence>
                    {showDeleteModal && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-[#0000005b] backdrop-blur-[4px] flex items-center justify-center z-[1000]"
                      >
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0.8 }}
                          className="bg-[#00141b] text-[#e2e8f0] p-6 rounded-2xl w-[90%] sm:w-[400px] shadow-xl"
                        >
                          <h3 className="text-lg font-semibold mb-3">
                            Delete Chat?
                          </h3>
                          <p className="text-sm mb-6 opacity-80">
                            Are you sure you want to delete this chat
                            permanently?
                          </p>
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => setShowDeleteModal(false)}
                              className="px-4 py-2 rounded-lg bg-[#0B1E26] hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                deleteSession(targetSessionId);
                                setShowDeleteModal(false);
                              }}
                              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* Rename */}
                  <AnimatePresence>
                    {showRenameModal && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-[#0000005b] backdrop-blur-[4px] flex items-center justify-center z-[1000]"
                      >
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0.8 }}
                          className="bg-[#00141b] text-[#e2e8f0] p-6 rounded-2xl w-[90%] sm:w-[400px] shadow-xl"
                        >
                          <h3 className="text-lg font-semibold mb-3">
                            Rename Chat
                          </h3>
                          <input
                            type="text"
                            value={newTitle}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (newTitle.trim()) {
                                  handleRename(targetSessionId, newTitle);
                                  setShowRenameModal(false);
                                }
                              }
                            }}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full p-3 rounded-lg bg-[#00141b] border border-[#e2e8f0] text-[#ffe655] outline-none mb-5"
                          />
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => setShowRenameModal(false)}
                              className="px-4 py-2 rounded-lg bg-[#0B1E26] hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                handleRename(targetSessionId, newTitle);
                                setShowRenameModal(false);
                              }}
                              className="px-4 py-2 rounded-lg bg-[#f1e596] text-black font-semibold hover:bg-[#ffe655]"
                            >
                              Save
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div
                    key={s.id}
                    className="flex flex-col justify-end rounded-lg p-2 shadow hover:shadow-md cursor-pointer text-[#ffe655] bg-[#0B1E26] hover:scale-[1.04] backdrop-blur-[3px] mod-scrollbar transition-all duration-[0.4s]"
                  >
                    <div
                      onClick={() => router.push(`/study/flashcards/${s.id}`)}
                    >
                      <div className="bg-black/50 p-2 rounded-md mt-2">
                        <h2 className="text-2xl font-semibold truncate">
                          {s.title}
                        </h2>
                        <p className="text-sm text-[#c4c3c3] truncate">
                          {s.file_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={() => {
                          setTargetSessionId(s.id);
                          setNewTitle(s.title);
                          setShowRenameModal(true);
                        }}
                        className="p-2 rounded-md hover:bg-white/30"
                      >
                        <PencilLine
                          size={20}
                          className="text-white cursor-pointer"
                        />
                      </button>
                      <button
                        onClick={() => {
                          setTargetSessionId(s.id);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 rounded-md hover:bg-white/30"
                      >
                        <Trash2Icon
                          size={20}
                          className="text-red-600 cursor-pointer"
                        />
                      </button>
                    </div>
                  </div>
                </>
              );
            })}

            {filteredSessions.length === 0 && (
              <p className="text-[#e2e8f0]">No notes found.</p>
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
          className={`fixed bottom-6 right-6 hover:bg-[#f1e596] bg-[#ffe655] text-[#00141b] cursor-pointer ${
            isMobile ? "px-4 py-2 text-lg" : "px-5 py-3 text-2xl"
          } rounded-full shadow-lg transition-all duration-[0.4s] flex items-center gap-3`}
        >
          <Upload /> {isMobile ? "" : "Upload File"}
        </button>
      </main>
    </>
  );
}
